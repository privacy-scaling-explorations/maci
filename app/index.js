// @flow

import type { $Request, $Response } from 'express'

const { maciContract } = require('./utils/contracts')
const { randomPrivateKey, privateToPublicKey } = require('./utils/crypto')
const { createMerkleTree } = require('./utils/merkletree')
const { stringifyBigInts } = require('./utils/helpers')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Parse application/json
app.use(bodyParser.json())

// TODO: Save to database
const privateKey: BigInt = randomPrivateKey()
const publicKey: BigInt = privateToPublicKey(privateKey)

const merkleTree = createMerkleTree(4, BigInt(0))

/** Pub/Sub Events on the contract **/
maciContract.on('MessagePublished', (encryptedMessage: Array<BigInt>, hashedEncryptedMessage: BigInt) => {
  console.log(encryptedMessage.map(x => x.toString()))
  console.log(hashedEncryptedMessage.toString())
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
  console.log(`Coordinator servive listening on port ${port}!`)
})
