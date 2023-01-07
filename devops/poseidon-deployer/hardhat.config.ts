import dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ganache";
import "@typechain/hardhat";
import "hardhat-artifactor";
import "hardhat-contract-sizer";

import "./tasks/deployPoseidon";
import "./tasks/deployPoseidonFactory";

dotenv.config();

const GAS_LIMIT = 20000000;
const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

let accounts;
if (WALLET_MNEMONIC) {
  accounts = { mnemonic: WALLET_MNEMONIC };
}
if (WALLET_PRIVATE_KEY) {
  accounts = [WALLET_PRIVATE_KEY];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 60000,
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    ganache: {
      // Workaround for https://github.com/nomiclabs/hardhat/issues/518
      url: "http://127.0.0.1:8555",
      gasLimit: GAS_LIMIT,
    } as any,
    gnosis: {
      url: process.env.JSONRPC_HTTP_URL || "https://rpc.gnosischain.com",
      timeout: 60000,
      accounts,
    },
    arbitrum: {
      url: process.env.JSONRPC_HTTP_URL || "https://arb1.arbitrum.io/rpc",
      accounts,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
