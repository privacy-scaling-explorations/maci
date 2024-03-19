/**
 * Supported networks for deployment and task running
 */
export enum ESupportedChains {
  Sepolia = "sepolia",
  OptimismSepolia = "optimism_sepolia",
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
  Coverage = 1337,
}

const GWEI = 1e9;

export const STATE_TREE_ARITY = 5;

/**
 * Convert gas price from gwei to wei
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
  [ESupportedChains.Coverage]: gasPrice(1),
  [ESupportedChains.Hardhat]: gasPrice(1),
};

/**
 * Get network rpc urls object
 *
 * @returns {Record<ESupportedChains, string>} rpc urls for supported networks
 */
export const getNetworkRpcUrls = (): Record<ESupportedChains, string> => {
  const INFURA_KEY = process.env.INFURA_KEY ?? "";

  return {
    [ESupportedChains.Sepolia]: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.OptimismSepolia]: `https://optimism-sepolia.infura.io/v3/${INFURA_KEY}`,
    [ESupportedChains.Coverage]: "http://localhost:8555",
    [ESupportedChains.Hardhat]: "http://localhost:8545",
  };
};

export const getEtherscanApiKeys = (): Record<ESupportedChains, string | undefined> => ({
  [ESupportedChains.Sepolia]: process.env.ETH_ETHERSCAN_API_KEY,
  [ESupportedChains.OptimismSepolia]: process.env.OPTIMISM_ETHERSCAN_API_KEY,
  [ESupportedChains.Coverage]: undefined,
  [ESupportedChains.Hardhat]: undefined,
});
