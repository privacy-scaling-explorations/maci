const Verifier = artifacts.require('Verifier')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')

const { treeDepth, zeroValue } = require('./config')

module.exports = async (deployer) => {
  // Need to read MiMC here because MiMC is generated on the fly
  await deployer.link(MiMC, MACI)
  await deployer.deploy(MACI, treeDepth, zeroValue)
  await deployer.deploy(Verifier)
}
