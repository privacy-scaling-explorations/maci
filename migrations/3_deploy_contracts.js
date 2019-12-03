const MerkleTree = artifacts.require('MerkleTree')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')
const Hasher = artifacts.require('Hasher')
const SignUpToken = artifacts.require('SignUpToken')
const UpdateStateTreeVerifier = artifacts.require('UpdateStateTreeVerifier')

const { coordinatorConfig, merkleTreeConfig } = require('../maci-config')
const { privateToPublicKey } = require('../_build/utils/crypto.js')

const coordinatorPublicKey = privateToPublicKey(coordinatorConfig.privateKey)

module.exports = async (deployer) => {
  // Link MiMC with the Hasher object
  await deployer.link(MiMC, Hasher)

  // Deploy hasher
  const hasher = await deployer.deploy(Hasher)

  // Deploy SignUpToken
  // (This is how we sign up to the contract)
  const signUpToken = await deployer.deploy(SignUpToken)

  // Deploy UpdateStateTreeVerifier
  const updateStateTreeVerifier = await deployer.deploy(UpdateStateTreeVerifier)

  // Deploy merkle tree
  const cmdTree = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue.toString(),
    hasher.address
  )
  const stateTree = await deployer.deploy(
    MerkleTree,
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue.toString(),
    hasher.address
  )

  const maci = await deployer.deploy(
    MACI,
    cmdTree.address,
    stateTree.address,
    hasher.address,
    updateStateTreeVerifier.address,
    signUpToken.address,
    merkleTreeConfig.durationSignUpBlockNumbers.toString(),
    coordinatorPublicKey[0].toString(),
    coordinatorPublicKey[1].toString()
  )

  // Allow MACI contract to call `insert` and `update` methods
  // on the MerkleTrees
  await cmdTree.whitelistAddress(maci.address)
  await stateTree.whitelistAddress(maci.address)

  // Saves addresses
  global.contracts = {
    mimcAddress: MiMC.address,
    maciAddress: maci.address,
    cmdTreeAddress: cmdTree.address,
    stateTreeAddress: stateTree.address,
    signUpTokenAddress: signUpToken.address
  }
}
