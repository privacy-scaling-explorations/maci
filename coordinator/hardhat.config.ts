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

export default config;
