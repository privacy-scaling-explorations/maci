/**
 * Supported networks for deployment and task running
 */
export enum ESupportedChains {
  Sepolia = "sepolia",
  Optimism = "optimism",
  OptimismSepolia = "optimism_sepolia",
  Scroll = "scroll",
  ScrollSepolia = "scroll_sepolia",
  Arbitrum = "arbitrum",
  ArbitrumSepolia = "arbitrum_sepolia",
  Coverage = "coverage",
  Hardhat = "hardhat",
}

/**
 * Supported network chain ids for deployment and task running
 */
export enum EChainId {
  Hardhat = 31337,
  Optimism = 10,
  OptimismSepolia = 11155420,
  Sepolia = 11155111,
  Scroll = 534352,
  ScrollSepolia = 534351,
  Arbitrum = 42161,
  ArbitrumSepolia = 421614,
  Coverage = 1337,
}

export const STATE_TREE_ARITY = 5;

/**
 * Get network rpc urls object
 *
 * @returns {Record<ESupportedChains, string>} rpc urls for supported networks
 */
export const getNetworkRpcUrls = (): Record<ESupportedChains, string> => {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
  const OP_RPC_URL = process.env.OP_RPC_URL ?? "";
  const OP_SEPOLIA_RPC_URL = process.env.OP_SEPOLIA_RPC_URL ?? "";
  const SCROLL_RPC_URL = process.env.SCROLL_RPC_URL ?? "";
  const SCROLL_SEPOLIA_RPC_URL = process.env.SCROLL_SEPOLIA_RPC_URL ?? "";
  const ARB_RPC_URL = process.env.ARB_RPC_URL ?? "";
  const ARB_SEPOLIA_RPC_URL = process.env.ARB_SEPOLIA_RPC_URL ?? "";

  return {
    [ESupportedChains.Sepolia]: SEPOLIA_RPC_URL,
    [ESupportedChains.Optimism]: OP_RPC_URL,
    [ESupportedChains.OptimismSepolia]: OP_SEPOLIA_RPC_URL,
    [ESupportedChains.Scroll]: SCROLL_RPC_URL,
    [ESupportedChains.ScrollSepolia]: SCROLL_SEPOLIA_RPC_URL,
    [ESupportedChains.Arbitrum]: ARB_RPC_URL,
    [ESupportedChains.ArbitrumSepolia]: ARB_SEPOLIA_RPC_URL,
    [ESupportedChains.Coverage]: "http://localhost:8555",
    [ESupportedChains.Hardhat]: "http://localhost:8545",
  };
};

export const getEtherscanApiKeys = (): Record<ESupportedChains, string | undefined> => ({
  [ESupportedChains.Sepolia]: process.env.ETH_ETHERSCAN_API_KEY,
  [ESupportedChains.Optimism]: process.env.OPTIMISM_ETHERSCAN_API_KEY,
  [ESupportedChains.OptimismSepolia]: process.env.OPTIMISM_ETHERSCAN_API_KEY,
  [ESupportedChains.Scroll]: process.env.SCROLL_ETHERSCAN_API_KEY,
  [ESupportedChains.ScrollSepolia]: process.env.SCROLL_ETHERSCAN_API_KEY,
  [ESupportedChains.Arbitrum]: process.env.ARB_ETHERSCAN_API_KEY,
  [ESupportedChains.ArbitrumSepolia]: process.env.ARB_SEPOLIA_ETHERSCAN_API_KEY,
  [ESupportedChains.Coverage]: undefined,
  [ESupportedChains.Hardhat]: undefined,
});
