import { EContracts, EPolicies } from "./types";

/**
 * Deploy steps
 */
export enum EDeploySteps {
  Policies = "full:deploy-policies",
  Verifier = "full:deploy-verifier",
  Poseidon = "full:deploy-poseidon",
  PollFactory = "full:deploy-poll-factory",
  MessageProcessorFactory = "full:deploy-message-processor-factory",
  TallyFactory = "full:deploy-tally-factory",
  Maci = "full:deploy-maci",
  VerifyingKeysRegistry = "full:deploy-verifyingKey-registry",
  InitialVoiceCreditProxy = "poll:deploy-initial-voice-credit-proxy",
  PollPolicy = "poll:deploy-policy",
  Poll = "poll:deploy-poll",
}

/**
 * Supported networks for deployment and task running
 */
export enum ESupportedChains {
  Mainnet = "mainnet",
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
  Linea = "linea",
  LineaSepolia = "linea_sepolia",
  ZkSyncEra = "zksync_era",
  ZkSyncSepolia = "zksync_sepolia",
  PolygonZkEvm = "polygon_zkevm",
  PolygonCardonaZkEvm = "polygon_cardona_zkevm",
  Coverage = "coverage",
  Hardhat = "hardhat",
}

/**
 * Supported network chain ids for deployment and task running
 */
export enum EChainId {
  Mainnet = 1,
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
  Linea = 59144,
  LineaSepolia = 59141,
  ZkSyncEra = 324,
  ZkSyncSepolia = 300,
  PolygonZkEvm = 1101,
  PolygonCardonaZkEvm = 2442,
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
  const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? "";
  const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "";
  const BASE_RPC_URL = process.env.BASE_RPC_URL ?? "";
  const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL ?? "";
  const GNOSIS_RPC_URL = process.env.GNOSIS_RPC_URL ?? "";
  const GNOSIS_CHIADO_RPC_URL = process.env.GNOSIS_CHIADO_RPC_URL ?? "";
  const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL ?? "";
  const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL ?? "";
  const LINEA_RPC_URL = process.env.LINEA_RPC_URL ?? "";
  const LINEA_SEPOLIA_RPC_URL = process.env.LINEA_SEPOLIA_RPC_URL ?? "";
  const ZK_SYNC_ERA_RPC_URL = process.env.ZK_SYNC_ERA_RPC_URL ?? "";
  const ZK_SYNC_SEPOLIA_RPC_URL = process.env.ZK_SYNC_SEPOLIA_RPC_URL ?? "";
  const POLYGON_ZKEVM_RPC_URL = process.env.POLYGON_ZKEVM_RPC_URL ?? "";
  const POLYGON_CARDONA_RPC_URL = process.env.POLYGON_CARDONA_RPC_URL ?? "";
  const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL ?? "";

  return {
    [ESupportedChains.Sepolia]: SEPOLIA_RPC_URL,
    [ESupportedChains.Optimism]: OP_RPC_URL,
    [ESupportedChains.OptimismSepolia]: OP_SEPOLIA_RPC_URL,
    [ESupportedChains.Scroll]: SCROLL_RPC_URL,
    [ESupportedChains.ScrollSepolia]: SCROLL_SEPOLIA_RPC_URL,
    [ESupportedChains.Arbitrum]: ARBITRUM_RPC_URL,
    [ESupportedChains.ArbitrumSepolia]: ARBITRUM_SEPOLIA_RPC_URL,
    [ESupportedChains.Base]: BASE_RPC_URL,
    [ESupportedChains.BaseSepolia]: BASE_SEPOLIA_RPC_URL,
    [ESupportedChains.Gnosis]: GNOSIS_RPC_URL,
    [ESupportedChains.GnosisChiado]: GNOSIS_CHIADO_RPC_URL,
    [ESupportedChains.Polygon]: POLYGON_RPC_URL,
    [ESupportedChains.PolygonAmoy]: POLYGON_AMOY_RPC_URL,
    [ESupportedChains.Linea]: LINEA_RPC_URL,
    [ESupportedChains.LineaSepolia]: LINEA_SEPOLIA_RPC_URL,
    [ESupportedChains.ZkSyncEra]: ZK_SYNC_ERA_RPC_URL,
    [ESupportedChains.ZkSyncSepolia]: ZK_SYNC_SEPOLIA_RPC_URL,
    [ESupportedChains.PolygonZkEvm]: POLYGON_ZKEVM_RPC_URL,
    [ESupportedChains.PolygonCardonaZkEvm]: POLYGON_CARDONA_RPC_URL,
    [ESupportedChains.Coverage]: "http://localhost:8555",
    [ESupportedChains.Hardhat]: "http://localhost:8545",
    [ESupportedChains.Mainnet]: MAINNET_RPC_URL,
  };
};

export const FULL_POLICY_NAMES: Record<
  | EContracts.FreeForAllPolicy
  | EContracts.TokenPolicy
  | EContracts.EASPolicy
  | EContracts.GitcoinPassportPolicy
  | EContracts.HatsPolicy
  | EContracts.ZupassPolicy
  | EContracts.SemaphorePolicy
  | EContracts.MerkleProofPolicy
  | EContracts.AnonAadhaarPolicy
  | EContracts.ERC20VotesPolicy
  | EContracts.ERC20Policy,
  EPolicies
> = {
  [EContracts.FreeForAllPolicy]: EPolicies.FreeForAll,
  [EContracts.TokenPolicy]: EPolicies.Token,
  [EContracts.EASPolicy]: EPolicies.EAS,
  [EContracts.GitcoinPassportPolicy]: EPolicies.GitcoinPassport,
  [EContracts.HatsPolicy]: EPolicies.Hats,
  [EContracts.ZupassPolicy]: EPolicies.Zupass,
  [EContracts.SemaphorePolicy]: EPolicies.Semaphore,
  [EContracts.MerkleProofPolicy]: EPolicies.MerkleProof,
  [EContracts.AnonAadhaarPolicy]: EPolicies.AnonAadhaar,
  [EContracts.ERC20VotesPolicy]: EPolicies.ERC20Votes,
  [EContracts.ERC20Policy]: EPolicies.ERC20,
};
