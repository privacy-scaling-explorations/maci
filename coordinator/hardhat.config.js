/* eslint-disable @typescript-eslint/no-var-requires */
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

const path = require("path");

dotenv.config();

const parentDir = __dirname.includes("build") ? ".." : "";

module.exports = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: process.env.COORDINATOR_RPC_URL,
      loggingEnabled: false,
    },
    hardhat: {
      loggingEnabled: false,
    },
  },
  paths: {
    sources: path.resolve(__dirname, parentDir, "../contracts/contracts"),
    artifacts: path.resolve(__dirname, parentDir, "../contracts/artifacts"),
  },
};
