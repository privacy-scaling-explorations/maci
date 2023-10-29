// /**
//  * @type import('hardhat/config').HardhatUserConfig
//  */
// require('@nomiclabs/hardhat-ethers')

// const { Wallet } = require('ethers')

// const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC || "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

// const randomPrivKey = Wallet.createRandom().privateKey.toString()

// const GAS_LIMIT = 30000000;
// const CHAIN_IDS = {
// 	ganache: 1337,
// 	goerli: 5,
// 	hardhat: 31337,
// 	arbitrumTestnet: 421613 
// };

// const config = {
// 	defaultNetwork: 'hardhat',
// 	networks: {
// 		hardhat: {
// 			gas: GAS_LIMIT,
// 			blockGasLimit: GAS_LIMIT,
// 			accounts: { count: 30, mnemonic: WALLET_MNEMONIC },
// 			chainId: CHAIN_IDS.hardhat,
// 		},
// 		goerli: {
// 			url: process.env.RPC_URL_GOERLI || "https://eth-goerli.public.blastapi.io",
// 			accounts: [
// 				process.env.PRIV_KEY || randomPrivKey, 
// 				process.env.PRIV_KEY_2 || randomPrivKey, 
// 				process.env.PRIV_KEY_3 || randomPrivKey
// 			],
// 			gas: GAS_LIMIT,
// 			blockGasLimit: GAS_LIMIT,
// 			chainId: CHAIN_IDS.goerli
// 		},
// 		arbitrum_testnet: {
// 			url: process.env.RPC_URL_ARBITRUM_TESTNET || "https://goerli-rollup.arbitrum.io/rpc",
// 			accounts: [process.env.PRIV_KEY || randomPrivKey, process.env.PRIV_KEY_2 || randomPrivKey, process.env.PRIV_KEY_3 || randomPrivKey],
// 			gas: GAS_LIMIT,
// 			blockGasLimit: GAS_LIMIT,
// 			chainId: CHAIN_IDS.arbitrumTestnet
// 		}
// 	},
// 	// paths: {
// 	// 	sources: "../contracts/contracts/",
// 	// 	artifacts: "../contracts/artifacts"
// 	// }
// };

// module.exports = config;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-ethers");

const {
  DEFAULT_ETH_SK,
  DEFAULT_ETH_PROVIDER,
} = require('./build/utils/defaults')

const config = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: process.env.ETH_PROVIDER || DEFAULT_ETH_PROVIDER,
      accounts: [process.env.ETH_SK || DEFAULT_ETH_SK],
      loggingEnabled: false,
    },
  },
  paths: {
    sources: "../contracts/contracts/",
    artifacts: "../contracts/artifacts",
  },
};

module.exports = config;
