/**
 * Supported networks for deployment and task running
 */
export enum ESupportedChains {
  Sepolia = "sepolia",
  OptimismSepolia = "optimism_sepolia",
  Scroll = "scroll",
  ScrollSepolia = "scroll_sepolia",
  Coverage = "coverage",
  Hardhat = "hardhat",
}

/**
 * Supported network chain ids for deployment and task running
 */
export enum EChainId {
  Hardhat = 31337,
  OptimismSepolia = 11155420,
  Sepolia = 11155111,
  Scroll = 534352,
  ScrollSepolia = 534351,
  Coverage = 1337,
}

const GWEI = 1e9;

export const STATE_TREE_ARITY = 5;

/**
 * Convert gas price from gweguari to wei
 *
 * @param value - gas price in gwei
 * @returns gas price in wei
 */
const gasPrice = (value: number) => value * GWEI;

/**
 * Gas price settings for supported network
 */
export const NETWORKS_DEFAULT_GAS: Record<ESupportedChains, number | "auto"> = {
  [ESupportedChains.Sepolia]: gasPrice(1),
  [ESupportedChains.OptimismSepolia]: gasPrice(1),
  [ESupportedChains.Scroll]: gasPrice(1),
  [ESupportedChains.ScrollSepolia]: gasPrice(1),
  [ESupportedChains.Coverage]: gasPrice(1),
  [ESupportedChains.Hardhat]: gasPrice(1),
};

/**
 * Get network rpc urls object
 *
 * @returns {Record<ESupportedChains, string>} rpc urls for supported networks
 */
export const getNetworkRpcUrls = (): Record<ESupportedChains, string> => {
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
  const OP_SEPOLIA_RPC_URL = process.env.OP_SEPOLIA_RPC_URL ?? "";
  const SCROLL_RPC_URL = process.env.SCROLL_RPC_URL ?? "";
  const SCROLL_SEPOLIA_RPC_URL = process.env.SCROLL_SEPOLIA_RPC_URL ?? "";

  return {
    [ESupportedChains.Sepolia]: SEPOLIA_RPC_URL,
    [ESupportedChains.OptimismSepolia]: OP_SEPOLIA_RPC_URL,
    [ESupportedChains.Scroll]: SCROLL_RPC_URL,
    [ESupportedChains.ScrollSepolia]: SCROLL_SEPOLIA_RPC_URL,
    [ESupportedChains.Coverage]: "http://localhost:8555",
    [ESupportedChains.Hardhat]: "http://localhost:8545",
  };
};

export const getEtherscanApiKeys = (): Record<ESupportedChains, string | undefined> => ({
  [ESupportedChains.Sepolia]: process.env.ETH_ETHERSCAN_API_KEY,
  [ESupportedChains.OptimismSepolia]: process.env.OPTIMISM_ETHERSCAN_API_KEY,
  [ESupportedChains.Scroll]: process.env.SCROLL_ETHERSCAN_API_KEY,
  [ESupportedChains.ScrollSepolia]: process.env.SCROLL_ETHERSCAN_API_KEY,
  [ESupportedChains.Coverage]: undefined,
  [ESupportedChains.Hardhat]: undefined,
});
