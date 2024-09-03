/**
 * Deploy steps
 */
export enum EDeploySteps {
  ConstantInitialVoiceCreditProxy = "full:deploy-constant-initial-voice-credit-proxy",
  Gatekeepers = "full:deploy-gatekeepers",
  Verifier = "full:deploy-verifier",
  Poseidon = "full:deploy-poseidon",
  PollFactory = "full:deploy-poll-factory",
  MessageProcessorFactory = "full:deploy-message-processor-factory",
  TallyFactory = "full:deploy-tally-factory",
  Maci = "full:deploy-maci",
  VkRegistry = "full:deploy-vk-registry",
  Poll = "poll:deploy-poll",
}

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
  Base = "base",
  BaseSepolia = "base_sepolia",
  Gnosis = "gnosis",
  GnosisChiado = "gnosis_chiado",
  Polygon = "polygon",
  PolygonAmoy = "polygon_amoy",
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
  Base = 8453,
  BaseSepolia = 84532,
  Gnosis = 100,
  GnosisChiado = 10200,
  Polygon = 137,
  PolygonAmoy = 80002,
  Coverage = 1337,
}

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
  const BASE_RPC_URL = process.env.BASE_RPC_URL ?? "";
  const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL ?? "";
  const GNOSIS_RPC_URL = process.env.GNOSIS_RPC_URL ?? "";
  const GNOSIS_CHIADO_RPC_URL = process.env.GNOSIS_CHIADO_RPC_URL ?? "";
  const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL ?? "";
  const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL ?? "";

  return {
    [ESupportedChains.Sepolia]: SEPOLIA_RPC_URL,
    [ESupportedChains.Optimism]: OP_RPC_URL,
    [ESupportedChains.OptimismSepolia]: OP_SEPOLIA_RPC_URL,
    [ESupportedChains.Scroll]: SCROLL_RPC_URL,
    [ESupportedChains.ScrollSepolia]: SCROLL_SEPOLIA_RPC_URL,
    [ESupportedChains.Arbitrum]: ARB_RPC_URL,
    [ESupportedChains.ArbitrumSepolia]: ARB_SEPOLIA_RPC_URL,
    [ESupportedChains.Base]: BASE_RPC_URL,
    [ESupportedChains.BaseSepolia]: BASE_SEPOLIA_RPC_URL,
    [ESupportedChains.Gnosis]: GNOSIS_RPC_URL,
    [ESupportedChains.GnosisChiado]: GNOSIS_CHIADO_RPC_URL,
    [ESupportedChains.Polygon]: POLYGON_RPC_URL,
    [ESupportedChains.PolygonAmoy]: POLYGON_AMOY_RPC_URL,
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
  [ESupportedChains.ArbitrumSepolia]: process.env.ARB_ETHERSCAN_API_KEY,
  [ESupportedChains.Base]: process.env.BASE_ETHERSCAN_API_KEY,
  [ESupportedChains.BaseSepolia]: process.env.BASE_ETHERSCAN_API_KEY,
  [ESupportedChains.Gnosis]: process.env.GNOSIS_ETHERSCAN_API_KEY,
  [ESupportedChains.GnosisChiado]: process.env.GNOSIS_ETHERSCAN_API_KEY,
  [ESupportedChains.Polygon]: process.env.POLYGON_ETHERSCAN_API_KEY,
  [ESupportedChains.PolygonAmoy]: process.env.POLYGON_ETHERSCAN_API_KEY,
  [ESupportedChains.Coverage]: undefined,
  [ESupportedChains.Hardhat]: undefined,
});
