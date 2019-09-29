// @flow

import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { privateToPublicKey, decrypt } = require('./utils/crypto')
const { createMerkleTree } = require('./utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('./utils/helpers')

const { eddsa, mimc7 } = require('circomlib')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Parse application/json
app.use(bodyParser.json())

// TODO: Save to database
const privateKey: BigInt = BigInt('7967026810230244945878656285404800478023519231012520937555019323290519989206')
const publicKey: BigInt = privateToPublicKey(privateKey)

const merkleTree = createMerkleTree(4, BigInt(0))

/** Pub/Sub Events on the contract **/
maciContract.on('MessagePublished', (
  _encryptedMessage: Array<BigInt>,
  _publisherPublicKey: [BigInt, BigInt],
  _hashedEncryptedMessage: BigInt
) => {
  // Convert values into big int
  const encryptedMessage = unstringifyBigInts(_encryptedMessage.map(x => x.toString()))
  const publisherPublicKey = unstringifyBigInts(_publisherPublicKey.map(x => x.toString()))
  // const hashedEncryptedMessage = unstringifyBigInts(_hashedEncryptedMessage.toString())

  // Decrypt message
  const decryptedMessage = decrypt(
    encryptedMessage,
    privateKey,
    publisherPublicKey
  )

  // Validate signature
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

  console.log(`Signature valid: ${validSignature}`)

  if (!validSignature) {
    return
  }

  // TODO: Append to merkle tree
})

/** API Endpoints **/
// Create new user
// Gets merkle root
app.get('/merkleroot', (req: $Request, res: $Response) => {
  res.send(stringifyBigInts({ merkleRoot: merkleTree.root }))
})

// Returns public key to user
app.get('/publickey', (req: $Request, res: $Response) => {
  res.send(stringifyBigInts({publicKey}))
})

// Entrypoint
app.listen(port, () => {
  console.log(`Coordinator service listening on port ${port}!`)
})
