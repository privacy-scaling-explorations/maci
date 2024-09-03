/* eslint-disable import/no-extraneous-dependencies */
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "hardhat-artifactor";
import "hardhat-contract-sizer";
import "solidity-docgen";

import type { HardhatUserConfig } from "hardhat/config";

// Don't forget to import new tasks here
import "./tasks/deploy";
import { EChainId, ESupportedChains, getEtherscanApiKeys, getNetworkRpcUrls } from "./tasks/helpers/constants";
import "./tasks/runner/benchmarks";
import "./tasks/runner/deployFull";
import "./tasks/runner/deployPoll";
import "./tasks/runner/merge";
import "./tasks/runner/prove";
import "./tasks/runner/verifyFull";

dotenv.config();

const DEFAULT_BLOCK_GAS_LIMIT = 30_000_000;
const DEFAULT_GAS_MUL = 2;
const TEST_MNEMONIC = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
const NETWORKS_RPC_URL = getNetworkRpcUrls();
const GAS_PRICE: number | "auto" = process.env.GAS_PRICE ? Number(process.env.GAS_PRICE) : "auto";
const ETHERSCAN_API_KEYS = getEtherscanApiKeys();

const getCommonNetworkConfig = (networkName: ESupportedChains, chainId: number, mnemonic?: string) => ({
  url: NETWORKS_RPC_URL[networkName],
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  gasMultiplier: DEFAULT_GAS_MUL,
  gasPrice: GAS_PRICE,
  saveDeployments: true,
  chainId,
  accounts: {
    mnemonic: mnemonic || process.env.MNEMONIC || TEST_MNEMONIC,
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 20,
  },
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
  networks: {
    sepolia: getCommonNetworkConfig(ESupportedChains.Sepolia, EChainId.Sepolia),
    optimism: getCommonNetworkConfig(ESupportedChains.Optimism, EChainId.Optimism),
    optimism_sepolia: getCommonNetworkConfig(ESupportedChains.OptimismSepolia, EChainId.OptimismSepolia),
    scroll: getCommonNetworkConfig(ESupportedChains.Scroll, EChainId.Scroll),
    scroll_sepolia: getCommonNetworkConfig(ESupportedChains.ScrollSepolia, EChainId.ScrollSepolia),
    arbitrum: getCommonNetworkConfig(ESupportedChains.Arbitrum, EChainId.Arbitrum),
    arbitrum_sepolia: getCommonNetworkConfig(ESupportedChains.ArbitrumSepolia, EChainId.ArbitrumSepolia),
    base: getCommonNetworkConfig(ESupportedChains.Base, EChainId.Base),
    base_sepolia: getCommonNetworkConfig(ESupportedChains.BaseSepolia, EChainId.BaseSepolia),
    gnosis: getCommonNetworkConfig(ESupportedChains.Gnosis, EChainId.Gnosis),
    gnosis_chiado: getCommonNetworkConfig(ESupportedChains.GnosisChiado, EChainId.GnosisChiado),
    polygon: getCommonNetworkConfig(ESupportedChains.Polygon, EChainId.Polygon),
    polygon_amoy: getCommonNetworkConfig(ESupportedChains.PolygonAmoy, EChainId.PolygonAmoy),
    coverage: getCommonNetworkConfig(ESupportedChains.Coverage, EChainId.Coverage, TEST_MNEMONIC),
    localhost: {
      url: "http://localhost:8545",
      loggingEnabled: false,
    },
    hardhat: {
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gasMultiplier: DEFAULT_GAS_MUL,
      gasPrice: "auto",
      chainId: EChainId.Hardhat,
      accounts: {
        mnemonic: TEST_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      loggingEnabled: process.env.HARDHAT_LOGGING === "true",
      allowUnlimitedContractSize: true,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      mining: {
        auto: true,
        interval: 100,
      },
      forking: process.env.FORKING_URL
        ? {
            url: process.env.FORKING_URL,
            blockNumber: process.env.FORKING_BLOCK_NUM ? parseInt(process.env.FORKING_BLOCK_NUM, 10) : 0,
          }
        : undefined,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  etherscan: {
    apiKey: {
      [ESupportedChains.Sepolia]: ETHERSCAN_API_KEYS[ESupportedChains.Sepolia]!,
      [ESupportedChains.Optimism]: ETHERSCAN_API_KEYS[ESupportedChains.Optimism]!,
      [ESupportedChains.OptimismSepolia]: ETHERSCAN_API_KEYS[ESupportedChains.OptimismSepolia]!,
      [ESupportedChains.Scroll]: ETHERSCAN_API_KEYS[ESupportedChains.Scroll]!,
      [ESupportedChains.ScrollSepolia]: ETHERSCAN_API_KEYS[ESupportedChains.ScrollSepolia]!,
      [ESupportedChains.Arbitrum]: ETHERSCAN_API_KEYS[ESupportedChains.Arbitrum]!,
      [ESupportedChains.ArbitrumSepolia]: ETHERSCAN_API_KEYS[ESupportedChains.ArbitrumSepolia]!,
      [ESupportedChains.Base]: ETHERSCAN_API_KEYS[ESupportedChains.Base]!,
      [ESupportedChains.BaseSepolia]: ETHERSCAN_API_KEYS[ESupportedChains.BaseSepolia]!,
      [ESupportedChains.Gnosis]: ETHERSCAN_API_KEYS[ESupportedChains.Gnosis]!,
      [ESupportedChains.GnosisChiado]: ETHERSCAN_API_KEYS[ESupportedChains.GnosisChiado]!,
      [ESupportedChains.Polygon]: ETHERSCAN_API_KEYS[ESupportedChains.Polygon]!,
      [ESupportedChains.PolygonAmoy]: ETHERSCAN_API_KEYS[ESupportedChains.PolygonAmoy]!,
    },
    customChains: [
      {
        network: ESupportedChains.Optimism,
        chainId: EChainId.Optimism,
        urls: {
          apiURL: "https://api-optimistic.etherscan.io/api",
          browserURL: "https://optimistic.etherscan.io",
        },
      },
      {
        network: ESupportedChains.OptimismSepolia,
        chainId: EChainId.OptimismSepolia,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimistic.etherscan.io",
        },
      },
      {
        network: ESupportedChains.Scroll,
        chainId: EChainId.Scroll,
        urls: {
          apiURL: "https://api.scrollscan.com/api",
          browserURL: "https://scrollscan.com/",
        },
      },
      {
        network: ESupportedChains.ScrollSepolia,
        chainId: EChainId.ScrollSepolia,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/",
        },
      },
      {
        network: ESupportedChains.Arbitrum,
        chainId: EChainId.Arbitrum,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
      {
        network: ESupportedChains.ArbitrumSepolia,
        chainId: EChainId.ArbitrumSepolia,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: ESupportedChains.Base,
        chainId: EChainId.Base,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: ESupportedChains.BaseSepolia,
        chainId: EChainId.BaseSepolia,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: ESupportedChains.Gnosis,
        chainId: EChainId.Gnosis,
        urls: {
          apiURL: "https://api.gnosisscan.io/api",
          browserURL: "https://gnosisscan.io/",
        },
      },
      {
        network: ESupportedChains.GnosisChiado,
        chainId: EChainId.GnosisChiado,
        urls: {
          apiURL: "https://gnosis-chiado.blockscout.com/api",
          browserURL: "https://gnosis-chiado.blockscout.com/",
        },
      },
      {
        network: ESupportedChains.Polygon,
        chainId: EChainId.Polygon,
        urls: {
          apiURL: "https://polygonscan.com/api",
          browserURL: "https://polygonscan.com/",
        },
      },
      {
        network: ESupportedChains.PolygonAmoy,
        chainId: EChainId.PolygonAmoy,
        urls: {
          apiURL: "https://amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
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
