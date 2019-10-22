const MerkleTree = artifacts.require('MerkleTree')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')

const { merkleTreeConfig } = require('./config')

module.exports = async (deployer) => {
  // Link MiMC with the merkle tree
  await deployer.link(MiMC, MerkleTree)
  await deployer.link(MiMC, MACI)

  // Deploy execution state merkle tree
  // (The append-only merkle tree)
  const stateTree = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )

  // Deploy results merkle tree
  // (Merkle tree to store 'registered' users and their associated votes)
  const resultsTree = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )

  const maci = await deployer.deploy(
    MACI,
    stateTree.address,
    resultsTree.address
  )

  // Allow MACI contract to call `insert` and `update` methods
  // on the MerkleTrees
  await stateTree.whitelistAddress(maci.address)
  await resultsTree.whitelistAddress(maci.address)

  // Saves addresses
  global.contractAddresses = {
    mimcAddress: MiMC.address,
    maciAddress: maci.address,
    stateTreeAddress: stateTree.address,
    resultsTreeAddress: resultsTree.address
  }
}
