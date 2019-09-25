const path = require('path')
const Artifactor = require('@truffle/artifactor')
const mimcGenContract = require('circomlib/src/mimc_gencontract.js')
const artifactor = new Artifactor(path.join(__dirname, '..', 'app/contracts'))
const SEED = 'mimc'

module.exports = async (deployer) => {
  await artifactor.save({
    contractName: 'MiMC',
    abi: mimcGenContract.abi,
    unlinked_binary: mimcGenContract.createCode(SEED, 220)
  })

  const MiMC = artifacts.require('MiMC')
  await deployer.deploy(MiMC)
}
