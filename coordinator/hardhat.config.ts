import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

import path from "path";

import type { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const parentDir = __dirname.includes("build") ? ".." : "";

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: process.env.COORDINATOR_RPC_URL,
      loggingEnabled: false,
      accounts: {
        mnemonic: process.env.COORDINATOR_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    hardhat: {
      loggingEnabled: false,
      accounts: {
        mnemonic: process.env.COORDINATOR_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
  paths: {
    sources: path.resolve(__dirname, parentDir, "../contracts/contracts"),
    artifacts: path.resolve(__dirname, parentDir, "../contracts/artifacts"),
  },
};

export default config;
