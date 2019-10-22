// @flow

import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { privateToPublicKey, decrypt } = require('./utils/crypto')
const { createMerkleTree } = require('./utils/merkletree')
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
  public_key: Array<BigInt>,
  public_key_hash: BigInt
};

type MessageCache = {
  original: Array<BigInt>,
  decrypted: Array<BigInt>
};

// type DecryptedMessage = Array<BigInt>;

// Parse application/json
app.use(bodyParser.json())

// TODO: Save these stuff to a database
const privateKey: BigInt = BigInt('7967026810230244945878656285404800478023519231012520937555019323290519989206')
const publicKey: BigInt = privateToPublicKey(privateKey)

const stateTree = createMerkleTree(4, BigInt(0))
const resultTree = createMerkleTree(4, BigInt(0))

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
  // Save the decryptedMessage into a cacheto be retrieved later
  await redisSet(
    stringifyBigInts(hashedEncryptedMessage),
    JSON.stringify({
      original: stringifyBigInts(encryptedMessage),
      decrypted: stringifyBigInts(decryptedMessage)
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

  /** Smart contract state **/
  // Insert into state tree
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

  // Reconstruct the encrypted message
  const encryptedMessage: MessageCache = unstringifyBigInts(JSON.parse(encryptedMessageStr))

  // Insert into local state
  stateTree.insert(encryptedMessage.original)
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

  // Invalid index, something went wrong....
  // TODO: Test to make sure this never happens
  if (!(resultTree.nextIndex.toString() === userIndex.toString())) {
    console.log('[UserInserted] userIndex and resultTree out of sync....')
  }

  // Reconstruct the encrypted message
  const encryptedMessage: MessageCache = unstringifyBigInts(JSON.parse(encryptedMessageStr))
  const userPublicKey = [encryptedMessage.decrypted[0], encryptedMessage.decrypted[1]]

  // TODO: Make sure the hashes are the same

  // Insert user and their corresponding vote into our own tree
  // TODO: Make sure the resultTree and user inserted successfully
  await dbPool.query({
    text: `INSERT INTO 
    users(index, public_key, public_key_hash=)
    VALUES($1, $2, $3)
    `,
    values: [
      resultTree.nextIndex,
      stringifyBigInts(userPublicKey),
      stringifyBigInts(hashedEncryptedMessage)
    ]
  })
  resultTree.insert(encryptedMessage.original)
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

  const newEncryptedMessage: MessageCache = unstringifyBigInts(JSON.parse(newEncryptedMessageStr))

  const decryptedMessage = newEncryptedMessage.decrypted
  // const oldPublicKey = decryptedMessage.slice(0, 2)
  // const oldPublicKeyHash = mimc7.multiHash(oldPublicKey)

  const newPublicKey = decryptedMessage.slice(3, 5)
  // const newVoteResult = decryptedMessage[5]
  const newPublicKeyHash = mimc7.multiHash(newPublicKey)

  // Update user
  // TODO: Save vote result?
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
  resultTree.update(Number(userIndex), newEncryptedMessage.original)
})

/** API Endpoints **/
// Create new user
// Gets merkle root
app.get('/merkleroots', (req: $Request, res: $Response) => {
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
