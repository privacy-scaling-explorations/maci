const path = require('path')
const Artifactor = require('@truffle/artifactor')
const mimcSpongeGenContract = require('circomlib/src/mimcsponge_gencontract.js')
const artifactor = new Artifactor(path.join(__dirname, '..', 'app/contracts'))

// https://github.com/iden3/circomlib/blob/master/src/mimcsponge.js
const SEED = 'mimcsponge'
const NROUNDS = 220

module.exports = async (deployer) => {
  await artifactor.save({
    contractName: 'CircomLib',
    abi: mimcSpongeGenContract.abi,
    unlinked_binary: mimcSpongeGenContract.createCode(SEED, NROUNDS)
  })

  const CircomLib = artifacts.require('CircomLib')
  await deployer.deploy(
    CircomLib,
    { data: mimcSpongeGenContract.createCode(SEED, NROUNDS) }
  )
}
