const Verifier = artifacts.require('Verifier')
const MiMC = artifacts.require('MiMC')

module.exports = function (deployer) {
  deployer.deploy(Verifier)
}
