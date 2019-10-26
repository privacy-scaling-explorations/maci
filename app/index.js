// @flow
import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { privateToPublicKey, decrypt } = require('./utils/crypto')
const { createMerkleTree, saveMerkleTreeToDb, loadMerkleTreeFromDb, MerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')

const { eddsa, mimc7 } = require('circomlib')
const { initDb, dbPool } = require('./utils/db')
const { initRedis, redisGet, redisSet } = require('./utils/redis')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Types
type User = {
  index: Number,
  public_key: BigInt[],
  public_key_hash: BigInt[]
};

// Redis component, votes are coconsciously not included
// just the publicKeys
type MessageCache = {
  original: BigInt[], // Original submitted format (encrypted)
  userOldPublicKey: BigInt[], // User's old selected public key
  userNewPublicKey: BigInt[], // User's new selected public key
  ecdhPublicKey: BigInt[] // public_key broadcasted along with the message (perform ecdh to get the decryption key)
};

// Parse application/json
app.use(bodyParser.json())

// TODO: Save keys to a database
const privateKey: BigInt = BigInt('7967026810230244945878656285404800478023519231012520937555019323290519989206')
const publicKey: BigInt = privateToPublicKey(privateKey)

const treeDepth = 4
const stateTreeName = 'StateTree'
const resultTreeName = 'ResultTree'

// Helper functions to load merkletree
const getMerkleTree = async (name: String): MerkleTree => {
  try {
    const t = await loadMerkleTreeFromDb(dbPool, name)
    return t
  } catch (e) {
    return createMerkleTree(treeDepth, 0n)
  }
}

const getStateTree = async (): MerkleTree => {
  return getMerkleTree(stateTreeName)
}

const getResultTree = async (): MerkleTree => {
  return getMerkleTree(resultTreeName)
}

/** Pub/Sub Events on the contract **/
maciContract.on('MessagePublished', async (
  _encryptedMessage: Array<BigInt>,
  _publisherPublicKey: [BigInt, BigInt],
  _hashedEncryptedMessage: BigInt
) => {
  console.log('[MessagePublished]')

  // Convert values into big int
  const encryptedMessage = unstringifyBigInts(
    _encryptedMessage.map((x: Any): String => x.toString())
  )
  const publisherPublicKey = unstringifyBigInts(
    _publisherPublicKey.map((x: Any): String => x.toString())
  )
  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessage.toString())

  // Decrypt message
  const decryptedMessage = decrypt(
    encryptedMessage,
    privateKey,
    publisherPublicKey
  )

  const oldPublicKey = decryptedMessage.slice(0, 2)
  const oldPublicKeyHash = mimc7.multiHash(oldPublicKey)

  // Validate signature
  // Signature will be last 3 elements of the array
  const decryptedMessageHash = mimc7.multiHash(decryptedMessage.slice(0, -3))
  const decryptedSignature = {
    R8: [
      decryptedMessage.slice(-3)[0],
      decryptedMessage.slice(-3)[1]
    ],
    S: decryptedMessage.slice(-3)[2]
  }

  const validSignature = eddsa.verifyMiMC(
    decryptedMessageHash,
    decryptedSignature,
    publisherPublicKey
  )

  if (!validSignature) {
    console.log('[MessagePublished] Invalid signature, ignoring message')
    return
  }

  /** Coordinator state **/
  // Save the decryptedMessage into a cache to be retrieved later
  await redisSet(
    stringifyBigInts(hashedEncryptedMessage),
    JSON.stringify({
      original: stringifyBigInts(encryptedMessage),
      userOldPublicKey: stringifyBigInts(decryptedMessage.slice(0, 2)),
      userNewPublicKey: stringifyBigInts(decryptedMessage.slice(3, 5)),
      ecdhPublicKey: stringifyBigInts(publisherPublicKey)
    })
  )

  // Try and get oldPublicKeyHash from postgres
  const oldPublicKeyRes = await dbPool.query({
    text: 'SELECT * FROM USERS WHERE public_key_hash = $1',
    values: [stringifyBigInts(oldPublicKeyHash)]
  })

  if (oldPublicKeyRes.rows.length === 0) {
    // If its a new user, call the 'insertUser' function on the smart contract
    await maciContract.insertUser(stringifyBigInts(hashedEncryptedMessage))
  } else {
    // Get user index
    const curUser: User = oldPublicKeyRes.rows[0]

    // Try get merkletree
    const resultTree = await getResultTree()

    // Get merkle tree path
    // eslint-disable-next-line no-unused-vars
    const [treePath, treePathPos] = resultTree.getPath(Number(curUser.index))

    // If its an existing user then update the users
    await maciContract.updateUser(
      curUser.index.toString(),
      stringifyBigInts(hashedEncryptedMessage),
      treePath.map((x: BigInt): String => x.toString())
    )
  }

  // If able to decrypt message, then insert message
  await maciContract.insertMessage(stringifyBigInts(hashedEncryptedMessage))
})

maciContract.on('MessageInserted', async (_hashedEncryptedMessage: BigInt) => {
  console.log('[MessageInserted]')

  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessage.toString())

  // Retrieve encrypted message from cache
  const encryptedMessageStr = await redisGet(stringifyBigInts(hashedEncryptedMessage))

  if (encryptedMessageStr === null) {
    console.log('[MessageInserted] Missing decrypted message...., returning')
    return
  }

  // Reconstruct the cached message
  const msgCache: MessageCache = unstringifyBigInts(JSON.parse(encryptedMessageStr))

  // Insert into local state
  const stateTree = await getStateTree()
  stateTree.insert(msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, stateTreeName, stateTree)
})

maciContract.on('UserInserted', async (
  _hashedEncryptedMessage: BigInt,
  _userIndex: Number
) => {
  console.log('[UserInserted]')

  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessage.toString())
  const userIndex = unstringifyBigInts(_userIndex.toString())

  // Retrieve encrypted message from cache
  const encryptedMessageStr = await redisGet(stringifyBigInts(hashedEncryptedMessage))

  if (encryptedMessageStr === null) {
    console.log('[UserInserted] Missing decrypted message.... returning')
    return
  }

  // Try get merkletree
  const resultTree = await getResultTree()

  // Invalid index, something went wrong....
  // TODO: Test to make sure this never happens
  if (!(resultTree.nextIndex.toString() === userIndex.toString())) {
    throw new Error('[UserInserted] userIndex and resultTree out of sync....')
  }

  // Reconstruct the encrypted message
  const msgCache: MessageCache = unstringifyBigInts(JSON.parse(encryptedMessageStr))
  const userPublicKey = msgCache.userOldPublicKey // Using old as we're inserting, not updating

  // Insert user and their corresponding vote into our own tree
  // TODO: Make sure the resultTree and user inserted successfully
  await dbPool.query({
    text: `INSERT INTO 
    users(index, public_key, public_key_hash)
    VALUES($1, $2, $3)
    `,
    values: [
      resultTree.nextIndex,
      stringifyBigInts(userPublicKey),
      stringifyBigInts(hashedEncryptedMessage)
    ]
  })
  resultTree.insert(msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, resultTreeName, resultTree)
})

maciContract.on('UserUpdated', async (
  _oldHashedEncryptedMessage: BigInt,
  _newHashedEncryptedMessage: BigInt,
  _userIndex: BigInt
) => {
  console.log('[UserUpdated]')

  const oldHashedEncryptedMessage = unstringifyBigInts(_oldHashedEncryptedMessage.toString())
  const newHashedEncryptedMessage = unstringifyBigInts(_newHashedEncryptedMessage.toString())
  const userIndex = unstringifyBigInts(_userIndex.toString())

  // Read from cache
  const oldEncryptedMessageStr = await redisGet(stringifyBigInts(oldHashedEncryptedMessage))
  const newEncryptedMessageStr = await redisGet(stringifyBigInts(newHashedEncryptedMessage))

  if (oldEncryptedMessageStr === null || newEncryptedMessageStr === null) {
    console.log('[UserUpdate] `oldEncryptedMessageStr` or `newEncryptedMessageStr` not found in cache, returning')
    return
  }

  const msgCache: MessageCache = unstringifyBigInts(JSON.parse(newEncryptedMessageStr))

  const newPublicKey = msgCache.userNewPublicKey
  const newPublicKeyHash = mimc7.multiHash(newPublicKey)

  // Update user
  await dbPool.query({
    text: `
      UPDATE users
      SET
        public_key = $1
        public_key_hash = $2
      WHERE
        index = $3
    `,
    values: [
      stringifyBigInts(newPublicKey),
      stringifyBigInts(newPublicKeyHash),
      userIndex
    ]
  })

  // Update results tree
  const resultTree = await getResultTree()
  resultTree.update(Number(userIndex), msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, resultTreeName, resultTree)
})

/** API Endpoints **/
// Create new user
// Gets merkle root
app.get('/merkleroots', async (req: $Request, res: $Response) => {
  const stateTree = await getStateTree()
  const resultTree = await getResultTree()

  res.send(stringifyBigInts({
    stateTree: stateTree.root,
    resultTree: resultTree.root
  }))
})

// Returns public key to user
app.get('/publickey', (req: $Request, res: $Response) => {
  res.send(stringifyBigInts({publicKey}))
})

// Entrypoint
// TODO: Make database initialization run before app is listening
app.listen(port, async () => {
  console.log(`Coordinator service listening on port ${port}!`)

  console.log('Connecting to database....')
  await initDb()
  console.log('Connected to database')

  console.log('Connecting to Redis....')
  await initRedis()
  console.log('Connected to Redis')
})

module.exports = {
  app
}
