/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require('hardhat-artifactor')
require('hardhat-contract-sizer')
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: {
    version: "0.7.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      }
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
