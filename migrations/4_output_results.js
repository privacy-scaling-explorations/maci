const Verifier = artifacts.require('Verifier')
const MiMC = artifacts.require('MiMC')
const MACI = artifacts.require('MACI')

module.exports = async (deployer) => {
  console.log(JSON.stringify({
    MACI: MACI.address,
    Verifier: Verifier.address
  }, null, 4))
}
