// @flow

import type { $Request, $Response } from 'express'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Parse application/json
app.use(bodyParser.json())

// TODO: Generate private key and public key on the fly
// TODO: Read from file, etc

// TODO: Change these endpoints to some event happening
// on the smart contract. I.e. pub/sub events

// Create new user
app.post('/user', (req: $Request, res: $Response) => {
  res.send('user')
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
  res.send('Public key')
})

// Entrypoint
app.listen(port, () => {
  console.log(`Coordinator servive listening on port ${port}!`)
})
