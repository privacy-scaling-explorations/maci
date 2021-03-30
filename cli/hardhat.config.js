/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-ethers')

const {
  DEFAULT_ETH_SK,
  DEFAULT_ETH_PROVIDER,
} = require('./build/defaults')

const config = {
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: process.env.ETH_PROVIDER || DEFAULT_ETH_PROVIDER,
      accounts: [ process.env.ETH_SK || DEFAULT_ETH_SK ],
      loggingEnabled: false,
    },
  },
  paths: {
    sources: "../contracts/contracts/",
    artifacts: "../contracts/artifacts"
  }
};

module.exports = config;
