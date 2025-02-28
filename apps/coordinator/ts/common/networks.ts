import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  bsc,
  type Chain,
  gnosis,
  holesky,
  linea,
  lineaSepolia,
  localhost,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  scroll,
  scrollSepolia,
  sepolia,
} from "viem/chains";

import { ErrorCodes } from "./errors";

export enum ESupportedNetworks {
  ETHEREUM = "mainnet",
  OPTIMISM = "optimism",
  OPTIMISM_SEPOLIA = "optimism-sepolia",
  BSC = "bsc",
  BSC_CHAPEL = "chapel",
  GNOSIS_CHAIN = "gnosis",
  POLYGON = "matic",
  ARBITRUM_ONE = "arbitrum-one",
  HOLESKY = "holesky",
  LINEA_SEPOLIA = "linea-sepolia",
  BASE_SEPOLIA = "base-sepolia",
  ETHEREUM_SEPOLIA = "sepolia",
  ARBITRUM_SEPOLIA = "arbitrum-sepolia",
  LINEA = "linea",
  BASE = "base",
  SCROLL_SEPOLIA = "scroll-sepolia",
  SCROLL = "scroll",
  LOCALHOST = "localhost",
}

/**
 * Get the Viem chain for a given network
 *
 * @param network - the network to get the chain for
 * @returns the Viem chain
 */
export const viemChain = (network: ESupportedNetworks): Chain => {
  switch (network) {
    case ESupportedNetworks.ETHEREUM:
      return mainnet;
    case ESupportedNetworks.ETHEREUM_SEPOLIA:
      return sepolia;
    case ESupportedNetworks.ARBITRUM_ONE:
      return arbitrum;
    case ESupportedNetworks.ARBITRUM_SEPOLIA:
      return arbitrumSepolia;
    case ESupportedNetworks.BASE_SEPOLIA:
      return baseSepolia;
    case ESupportedNetworks.LINEA_SEPOLIA:
      return lineaSepolia;
    case ESupportedNetworks.SCROLL_SEPOLIA:
      return scrollSepolia;
    case ESupportedNetworks.SCROLL:
      return scroll;
    case ESupportedNetworks.BASE:
      return base;
    case ESupportedNetworks.HOLESKY:
      return holesky;
    case ESupportedNetworks.LINEA:
      return linea;
    case ESupportedNetworks.BSC:
      return bsc;
    case ESupportedNetworks.GNOSIS_CHAIN:
      return gnosis;
    case ESupportedNetworks.POLYGON:
      return polygon;
    case ESupportedNetworks.OPTIMISM:
      return optimism;
    case ESupportedNetworks.OPTIMISM_SEPOLIA:
      return optimismSepolia;
    case ESupportedNetworks.LOCALHOST:
      return localhost;
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};
