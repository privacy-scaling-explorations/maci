import "@nomicfoundation/hardhat-toolbox";
import { config as envConfig } from "dotenv";

import path from "path";

import type { HardhatUserConfig } from "hardhat/config";

envConfig();

const parentDir = __dirname.includes("build") ? ".." : "";

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: process.env.ETH_PROVIDER,
      accounts: [process.env.ETH_SK!],
      loggingEnabled: false,
    },
  },
  paths: {
    sources: path.resolve(__dirname, parentDir, "../contracts/contracts"),
    artifacts: path.resolve(__dirname, parentDir, "../contracts/artifacts"),
  },
};

export default config;
