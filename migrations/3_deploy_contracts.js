const MerkleTree = artifacts.require('MerkleTree')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')
const Hasher = artifacts.require('Hasher')

const { merkleTreeConfig } = require('../maci-config')

module.exports = async (deployer) => {
  // Link MiMC with the Hasher object
  await deployer.link(MiMC, Hasher)

  // Deploy hasher
  const hasher = await deployer.deploy(Hasher)

  // Deploy execution state merkle tree
  // (The append-only merkle tree)
  const cmdTree = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue.toString(),
    hasher.address
  )

  const maci = await deployer.deploy(
    MACI,
    cmdTree.address,
    hasher.address
  )

  // Allow MACI contract to call `insert` and `update` methods
  // on the MerkleTrees
  await cmdTree.whitelistAddress(maci.address)

  // Saves addresses
  global.contractAddresses = {
    mimcAddress: MiMC.address,
    maciAddress: maci.address,
    cmdTree: cmdTree.address
  }
}
