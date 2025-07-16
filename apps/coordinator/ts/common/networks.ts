import { ESupportedChains } from "@maci-protocol/sdk";
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

/**
 * Get the Viem chain for a given network
 *
 * @param network - the network to get the chain for
 * @returns the Viem chain
 */
export const viemChain = (network: ESupportedChains): Chain => {
  switch (network) {
    case ESupportedChains.Mainnet:
      return mainnet;
    case ESupportedChains.Sepolia:
      return sepolia;
    case ESupportedChains.Arbitrum:
      return arbitrum;
    case ESupportedChains.ArbitrumSepolia:
      return arbitrumSepolia;
    case ESupportedChains.BaseSepolia:
      return baseSepolia;
    case ESupportedChains.LineaSepolia:
      return lineaSepolia;
    case ESupportedChains.ScrollSepolia:
      return scrollSepolia;
    case ESupportedChains.Scroll:
      return scroll;
    case ESupportedChains.Base:
      return base;
      return holesky;
    case ESupportedChains.Linea:
      return linea;
      return bsc;
    case ESupportedChains.GnosisChiado:
      return gnosis;
    case ESupportedChains.Polygon:
      return polygon;
    case ESupportedChains.Optimism:
      return optimism;
    case ESupportedChains.OptimismSepolia:
      return optimismSepolia;
    case ESupportedChains.Localhost:
      return localhost;
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};
