const Artifactor = require('@truffle/artifactor')
const mimcGenContract = require('circomlib/src/mimc_gencontract.js')
const artifactor = new Artifactor('../app/contracts')
const SEED = 'mimcsponge'

module.exports = (deployer) => {
  const buildMiMC = async () => {
    await artifactor.save({
      contractName: 'MiMC',
      abi: mimcGenContract.abi,
      unlinked_binary: mimcGenContract.createCode(SEED, 220)
    })
  }

  buildMiMC()
}
