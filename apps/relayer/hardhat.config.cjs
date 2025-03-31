/* eslint-disable @typescript-eslint/no-var-requires */
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

const path = require("path");

dotenv.config();

const parentDir = __dirname.includes("build") ? ".." : "";
const TEST_MNEMONIC = "test test test test test test test test test test test junk";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: process.env.RELAYER_RPC_URL || "",
      accounts: {
        mnemonic: process.env.MNEMONIC || TEST_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
      loggingEnabled: false,
    },
    hardhat: {
      loggingEnabled: false,
    },
  },
  paths: {
    sources: path.resolve(
      __dirname,
      parentDir,
      "./node_modules/@maci-protocol/sdk/node_modules/@maci-protocol/contracts/contracts",
    ),
    artifacts: path.resolve(
      __dirname,
      parentDir,
      "./node_modules/@maci-protocol/sdk/node_modules/@maci-protocol/contracts/artifacts",
    ),
  },
};
