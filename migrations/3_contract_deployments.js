const Verifier = artifacts.require('Verifier')

module.exports = function (deployer) {
  // Need to read MiMC here because MiMC is generated on the fly
  const MiMC = artifacts.require('MiMC')

  // Link MiMC to the libs

  deployer.deploy(Verifier)
}
