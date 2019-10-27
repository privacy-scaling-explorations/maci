// @flow
import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { privateToPublicKey, decrypt } = require('./utils/crypto')
const { createMerkleTree, saveMerkleTreeToDb, loadMerkleTreeFromDb, MerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')

const { eddsa, mimc7 } = require('circomlib')
const { initDb, dbPool } = require('./utils/db')
const { initRedis, redisGet, redisSet } = require('./utils/redis')

const { merkleTreeConfig } = require('../maci-config')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Prepends timestamp to console.log
require('log-timestamp')

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

// Helper functions to load merkletree
const getMerkleTree = async (name: String): MerkleTree => {
  try {
    const t = await loadMerkleTreeFromDb(dbPool, name)
    return t
  } catch (e) {
    return createMerkleTree(
      merkleTreeConfig.treeDepth,
      merkleTreeConfig.zeroValue
    )
  }
}

const getStateTree = async (): MerkleTree => {
  return getMerkleTree(merkleTreeConfig.stateTreeName)
}

const getResultTree = async (): MerkleTree => {
  return getMerkleTree(merkleTreeConfig.resultTreeName)
}

/** Pub/Sub Events on the contract **/
maciContract.on('MessagePublished', async (
  _encryptedMessage: Array<BigInt>,
  _publisherPublicKey: [BigInt, BigInt],
  _hashedEncryptedMessage: BigInt
) => {
  const _encryptedMessageStr = _encryptedMessage.map((x: Any): String => x.toString())
  const _publisherPublicKeyStr = _publisherPublicKey.map((x: Any): String => x.toString())
  const _hashedEncryptedMessageStr = _hashedEncryptedMessage.toString()

  console.log('[INFO]', '[MessagePublished]')
  console.log(`encryptedMessage: ${_encryptedMessageStr}`)
  console.log(`publisherPublicKey: ${_publisherPublicKeyStr}`)
  console.log(`hashedEncryptedMessage: ${_hashedEncryptedMessageStr}`)

  // Convert values into big int
  const encryptedMessage = unstringifyBigInts(_encryptedMessageStr)
  const publisherPublicKey = unstringifyBigInts(_publisherPublicKeyStr)
  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessageStr)

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
    console.log('[ERROR]', '[MessagePublished] Invalid signature, ignoring message')
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
    text: 'SELECT * FROM users WHERE public_key_hash = $1',
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
  const _hashedEncryptedMessageStr = _hashedEncryptedMessage.toString()

  console.log('[INFO]', '[MessageInserted]')
  console.log(`hashedEncryptedMessage: ${_hashedEncryptedMessageStr}`)

  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessageStr)

  // Retrieve encrypted message from cache
  const encryptedMessageStr = await redisGet(stringifyBigInts(hashedEncryptedMessage))

  if (encryptedMessageStr === null) {
    console.log('[ERROR]', '[MessageInserted] Missing decrypted message...., returning')
    return
  }

  // Reconstruct the cached message
  const msgCache: MessageCache = unstringifyBigInts(JSON.parse(encryptedMessageStr))

  // Insert into local state
  const stateTree = await getStateTree()
  stateTree.insert(msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, merkleTreeConfig.stateTreeName, stateTree)
})

maciContract.on('UserInserted', async (
  _hashedEncryptedMessage: BigInt,
  _userIndex: Number
) => {
  const _hashedEncryptedMessageStr = _hashedEncryptedMessage.toString()

  console.log('[INFO]', '[UserInserted]')
  console.log(`hashedEncryptedMessage: ${_hashedEncryptedMessageStr}`)

  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessageStr)
  const userIndex = unstringifyBigInts(_userIndex.toString())

  // Retrieve encrypted message from cache
  const encryptedMessageStr = await redisGet(stringifyBigInts(hashedEncryptedMessage))

  if (encryptedMessageStr === null) {
    console.log('[ERROR]', '[UserInserted] Missing decrypted message.... returning')
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
  const userPublicKeyHash = mimc7.multiHash(userPublicKey)

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
      stringifyBigInts(userPublicKeyHash)
    ]
  })
  resultTree.insert(msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, merkleTreeConfig.resultTreeName, resultTree)
})

maciContract.on('UserUpdated', async (
  _oldHashedEncryptedMessage: BigInt,
  _newHashedEncryptedMessage: BigInt,
  _userIndex: BigInt
) => {
  const _oldHashedEncryptedMessageStr = _oldHashedEncryptedMessage.toString()
  const _newHashedEncryptedMessageStr = _newHashedEncryptedMessage.toString()
  const _userIndexStr = _userIndex.toString()

  console.log('[INFO]', '[UserUpdated]')
  console.log(`oldHashedEncryptedMessage: ${_oldHashedEncryptedMessageStr}`)
  console.log(`newHashedEncryptedMessage: ${_newHashedEncryptedMessageStr}`)
  console.log(`userIndex: ${_userIndexStr}`)

  const oldHashedEncryptedMessage = unstringifyBigInts(_oldHashedEncryptedMessageStr)
  const newHashedEncryptedMessage = unstringifyBigInts(_newHashedEncryptedMessageStr)
  const userIndex = unstringifyBigInts(_userIndexStr)

  // Read from cache
  const oldEncryptedMessageStr = await redisGet(stringifyBigInts(oldHashedEncryptedMessage))
  const newEncryptedMessageStr = await redisGet(stringifyBigInts(newHashedEncryptedMessage))

  if (oldEncryptedMessageStr === null || newEncryptedMessageStr === null) {
    console.log('[ERROR]', '[UserUpdate] `oldEncryptedMessageStr` or `newEncryptedMessageStr` not found in cache, returning')
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
        public_key = $1,
        public_key_hash = $2
      WHERE
        index = $3
      ;
    `,
    values: [
      stringifyBigInts(newPublicKey),
      stringifyBigInts(newPublicKeyHash),
      Number(userIndex)
    ]
  })

  // Update results tree
  const resultTree = await getResultTree()
  resultTree.update(Number(userIndex), msgCache.original, msgCache.ecdhPublicKey)
  await saveMerkleTreeToDb(dbPool, merkleTreeConfig.resultTreeName, resultTree)
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
const initAndStartApp = async (): object => {
  console.log('[STATUS]', 'Connecting to database....')
  await initDb()
  console.log('[STATUS]', 'Connected to database')

  console.log('[STATUS]', 'Connecting to Redis....')
  await initRedis()
  console.log('[STATUS]', 'Connected to Redis')

  app.listen(port, async () => {
    console.log('[STATUS]', `Coordinator service listening on port ${port}!`)
  })

  return app
}

// Starts app if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  initAndStartApp()
}

module.exports = {
  initAndStartApp
}
