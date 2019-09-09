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
type Action = "Alice" | "Bob";

type User = {
  publicKey: string, // Compressed public key
  action: Action // Whom we voting for
};

// TODO: 1. Save these things to a database instead of being in memory
const users = []

// TODO: Make this listen to events on smart contract for admitting users
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

  res.send({ index: users.length - 1 })
})

app.get('/publickey', (req: $Request, res: $Response) => {
  res.send({ publicKey: signingKey.publicKey, compressed: true })
})

app.get('/', (req: $Request, res: $Response) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Coordinator servive listening on port ${port}!`)
  console.log(`Public Key: ${publicKey}`)
})
