/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('hardhat-contract-sizer')
require('@nomiclabs/hardhat-ethers')
require('hardhat-artifactor')

module.exports = {
  solidity: "0.7.2",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }

  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
      },
      loggingEnabled: false,
      allowUnlimitedContractSize: true
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }
};
