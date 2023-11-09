/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: "0.8.10",
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
  }
};
