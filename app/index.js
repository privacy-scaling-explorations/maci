// @flow

import type { $Request, $Response } from 'express'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const ethers = require('ethers')

// Parse application/json
app.use(bodyParser.json())

// Generate private key and public key on the fly
// TODO: Read from file, etc
const wallet = ethers.Wallet.createRandom()
const signingKey = new ethers.utils.SigningKey(wallet.privateKey)
const publicKey = ethers.utils.computePublicKey(
  signingKey.publicKey,
  true
)

// Types
type PublicKey = String

type Action = "Alice" | "Bob";

type UserAction = {
  publicKey: PublicKey, // Compressed public key
  action: Action // Whom we voting for
};

type State = Array<UserAction>

// TODO: 1. Save these things to a database instead of being in memory
const users: Array<PublicKey> = []
const states: Array<UserAction> = []

// TODO: Change these endpoints to some event happening
// on the smart contract

// Create new user
app.post('/user', (req: $Request, res: $Response) => {
  const publicKey = req.body.publicKey
  const validPublicKey =
    typeof publicKey === String &&
    publicKey.length === 68 // 64 bytes + "0x" + 2 bytes for pos / neg

  // Don't add it to the array if its not a valid public key
  if (publicKey === undefined || !validPublicKey) {
    res.send({ error: 'publicKey (compressed) required' })
    res.status(400)
    return
  }

  // Append to list of users
  users.push(publicKey)

  // Return user index
  res.send({ index: users.length - 1 })
})

// Set new action
app.put('/user/:idx/action', (req: $Request, res: $Response) => {
  res.send({ action: 'hello' })
})

// Set new user key
app.put('/user/:idx/key', (req: $Request, res: $Response) => {
  res.send({ key: 'hello' })
})

// Gets merkle root
app.get('/merkleroot', (req: $Request, res: $Response) => {
  res.send('Merkle root')
})

// Returns public key to user
app.get('/publickey', (req: $Request, res: $Response) => {
  res.send({ publicKey: signingKey.publicKey, compressed: true })
})

// Entrypoint
app.listen(port, () => {
  console.log(`Coordinator servive listening on port ${port}!`)
  console.log(`Public Key: ${publicKey}`)
})
