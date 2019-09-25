const Verifier = artifacts.require('Verifier')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')

module.exports = async (deployer) => {
  // Need to read MiMC here because MiMC is generated on the fly
  await deployer.link(MiMC, MACI)
  await deployer.deploy(MACI, 4, 0, 0)
  await deployer.deploy(Verifier)
}
