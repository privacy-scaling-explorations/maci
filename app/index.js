// @flow
import type { $Request, $Response } from 'express'

const { privateToPublicKey } = require('./utils/crypto')
const { initDb, dbPool } = require('./utils/db')
const { initRedis } = require('./utils/redis')
const { stringifyBigInts } = require('./utils/helpers')
const { createMerkleTree, loadMerkleTreeFromDb } = require('./utils/merkletree')

const { merkleTreeConfig, coordinatorConfig } = require('../maci-config')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// Prepends timestamp to console.log
require('log-timestamp')

// Parse application/json
app.use(bodyParser.json())

// TODO: Save keys to a database
const coordinatorPrivateKey: BigInt = BigInt(coordinatorConfig.privateKey)
const coordinatorPublicKey: BigInt = privateToPublicKey(coordinatorPrivateKey)

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

const getCmdTree = async (): MerkleTree => {
  return getMerkleTree(merkleTreeConfig.cmdTreeName)
}

const getStateTree = async (): MerkleTree => {
  return getMerkleTree(merkleTreeConfig.stateTreeName)
}

/** API Endpoints **/
// Create new user
// Gets merkle root
app.get('/merkleroots', async (req: $Request, res: $Response) => {
  const cmdTree = await getCmdTree()
  const stateTree = await getStateTree()

  res.send(stringifyBigInts({
    cmd: cmdTree.root,
    stateTree: stateTree.root
  }))
})

// Returns public key to user
app.get('/publickey', (req: $Request, res: $Response) => {
  res.send(stringifyBigInts({coordinatorPublicKey}))
})

// Entry Point
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
