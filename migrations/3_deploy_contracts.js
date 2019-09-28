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
  const executionStateMT = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )

  // Deploy registry merkle tree
  // (Merkle tree to store 'registered' users)
  const registryMT = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )

  const maci = await deployer.deploy(
    MACI,
    executionStateMT.address,
    registryMT.address
  )

  // Allow MACI contract to call `insert` and `update` methods
  // on the MerkleTrees
  await executionStateMT.whitelistAddress(maci.address)
  await registryMT.whitelistAddress(maci.address)

  // Saves addresses
  global.contractAddresses = {
    maciAddress: maci.address,
    executionStateMTAddress: executionStateMT.address,
    registryMTAddress: registryMT.address
  }
}
