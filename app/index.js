// @flow

import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { privateToPublicKey, decrypt } = require('./utils/crypto')
const { createMerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')

const { eddsa, mimc7 } = require('circomlib')
const { initDb } = require('./utils/db')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Types
type User = {
  idx: Number,
  vote: Number // 0 or 1 (for now...)
};

type DecryptedMessage = Array<BigInt>;

// Parse application/json
app.use(bodyParser.json())

// TODO: Save these stuff to a database
const privateKey: BigInt = BigInt('7967026810230244945878656285404800478023519231012520937555019323290519989206')
const publicKey: BigInt = privateToPublicKey(privateKey)

const stateTree = createMerkleTree(4, BigInt(0))
const resultTree = createMerkleTree(4, BigInt(0))

// users: { hash(publicKey): User }
const users: { BigInt: User } = {}

// messages: { hashedEncryptedMessage: DecryptedMessage }
const messages: { BigInt: DecryptedMessage } = {}

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
  // Save the decryptedMessage into local storage first to be retrieved later
  messages[hashedEncryptedMessage] = decryptedMessage

  if (!(oldPublicKeyHash in users)) {
    // If its a new user, call the 'insertUser' function on the smart contract
    await maciContract.insertUser(stringifyBigInts(hashedEncryptedMessage))
  } else {
    // Get user index
    const curUser: User = users[oldPublicKeyHash]

    // Get merkle tree path
    // eslint-disable-next-line no-unused-vars
    const [treePath, treePathPos] = resultTree.getPath(Number(curUser.idx))

    // If its an existing user then update the users
    await maciContract.updateUser(
      curUser.idx.toString(),
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

  if (!(hashedEncryptedMessage in messages)) {
    console.log('[MessageInserted] Missing decrypted message...., returning')
    return
  }

  // Insert into local state
  stateTree.insert(hashedEncryptedMessage)
})

maciContract.on('UserInserted', async (
  _hashedEncryptedMessage: BigInt,
  _userIndex: Number
) => {
  console.log('[UserInserted]')

  const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessage.toString())
  const userIndex = unstringifyBigInts(_userIndex.toString())

  if (!(hashedEncryptedMessage in messages)) {
    console.log('[UserInserted] Missing decrypted message.... returning')
    return
  }

  // Invalid index, something went wrong....
  // TODO: Test to make sure this never happens
  if (!(resultTree.nextIndex.toString() === userIndex.toString())) {
    console.log('[UserInserted] Something went wrong oof....')
  }

  // Deconstruct message and obtain relevant parameters
  const decryptedMessage: DecryptedMessage = messages[hashedEncryptedMessage]
  const initialPublicKey = decryptedMessage.slice(0, 2)
  const initialVoteResult = decryptedMessage[2]
  const initialPublicKeyHash = mimc7.multiHash(initialPublicKey)

  // Insert into user storage
  users[initialPublicKeyHash] = {
    idx: userIndex,
    vote: initialVoteResult
  }

  // Insert user and their corresponding vote into our own tree
  resultTree.insert(hashedEncryptedMessage)
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

  if (!(oldHashedEncryptedMessage in messages || newHashedEncryptedMessage in messages)) {
    console.log('[UserUpdate] Missing decrypted message.... returning')
    return
  }

  const decryptedMessage: DecryptedMessage = messages[newHashedEncryptedMessage]
  const oldPublicKey = decryptedMessage.slice(0, 2)
  const oldPublicKeyHash = mimc7.multiHash(oldPublicKey)

  const newPublicKey = decryptedMessage.slice(3, 5)
  const newVoteResult = decryptedMessage[5]
  const newPublicKeyHash = mimc7.multiHash(newPublicKey)

  // Remove old vote
  users[oldPublicKeyHash] = {}

  // Insert new vote
  users[newPublicKeyHash] = {
    idx: userIndex,
    vote: newVoteResult
  }

  // Update results tree
  resultTree.update(Number(userIndex), newHashedEncryptedMessage)
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

  console.log('Initializing database....')
  await initDb()
})

module.exports = {
  app
}
