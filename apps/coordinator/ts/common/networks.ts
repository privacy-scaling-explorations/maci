import { ESupportedChains } from "@maci-protocol/sdk";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  type Chain,
  gnosis,
  gnosisChiado,
  hardhat,
  linea,
  lineaSepolia,
  localhost,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonZkEvm,
  polygonZkEvmCardona,
  scroll,
  scrollSepolia,
  sepolia,
  zksync,
  zksyncSepoliaTestnet,
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
    case ESupportedChains.Optimism:
      return optimism;
    case ESupportedChains.OptimismSepolia:
      return optimismSepolia;
    case ESupportedChains.Scroll:
      return scroll;
    case ESupportedChains.ScrollSepolia:
      return scrollSepolia;
    case ESupportedChains.Arbitrum:
      return arbitrum;
    case ESupportedChains.ArbitrumSepolia:
      return arbitrumSepolia;
    case ESupportedChains.Base:
      return base;
    case ESupportedChains.BaseSepolia:
      return baseSepolia;
    case ESupportedChains.Gnosis:
      return gnosis;
    case ESupportedChains.GnosisChiado:
      return gnosisChiado;
    case ESupportedChains.Polygon:
      return polygon;
    case ESupportedChains.PolygonAmoy:
      return polygonAmoy;
    case ESupportedChains.Linea:
      return linea;
    case ESupportedChains.LineaSepolia:
      return lineaSepolia;
    case ESupportedChains.ZkSyncEra:
      return zksync;
    case ESupportedChains.ZkSyncSepolia:
      return zksyncSepoliaTestnet;
    case ESupportedChains.PolygonZkEvm:
      return polygonZkEvm;
    case ESupportedChains.PolygonCardonaZkEvm:
      return polygonZkEvmCardona;
    // coverage is not supported by viem and it wont be used in the coordinator
    case ESupportedChains.Hardhat:
      return hardhat;
    case ESupportedChains.Localhost:
      return localhost;
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};
