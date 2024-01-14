/* eslint-disable import/no-extraneous-dependencies */
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-artifactor";
import "hardhat-contract-sizer";
import "solidity-docgen";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
        count: 20,
      },
      loggingEnabled: false,
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 100,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  paths: {
    tests: "./tests",
    artifacts: "./artifacts",
  },
  docgen: {
    outputDir: "./docs",
    pages: "files",
    exclude: ["./trees/zeros"],
  },
  gasReporter: {
    currency: "USD",
    enabled: true,
  },
};

export default config;
