/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('hardhat-contract-sizer')

module.exports = {
  solidity: {
	version: "0.7.2",
	settings: {
	  optimizer: {
	    enabled: true,
	    runs: 200
	  }
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
      },
      loggingEnabled: true,
      allowUnlimitedContractSize: true
    }
  },
  contractSizer: {
	alphaSort: true,
	runOnCompile: true,
	disambiguatePaths: false,
  }
};
