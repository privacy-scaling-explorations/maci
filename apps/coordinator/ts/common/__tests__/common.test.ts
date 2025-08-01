import {
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  baseSepolia,
  lineaSepolia,
  scrollSepolia,
  scroll,
  base,
  holesky,
  linea,
  bsc,
  gnosis,
  polygon,
  optimism,
  optimismSepolia,
} from "viem/chains";

import { getBundlerClient, getPublicClient, getZeroDevBundlerRPCUrl } from "../accountAbstraction";
import { getRpcUrl } from "../chain";
import { ErrorCodes } from "../errors";
import { ESupportedNetworks, viemChain } from "../networks";

describe("common", () => {
  describe("getPublicClient", () => {
    test("should return a public client", () => {
      const publicClient = getPublicClient(ESupportedNetworks.OPTIMISM_SEPOLIA);
      expect(publicClient).toBeDefined();
    });

    test("should throw when given an unsupported network", () => {
      expect(() => getPublicClient("Unsupported" as ESupportedNetworks)).toThrow(
        ErrorCodes.UNSUPPORTED_NETWORK.toString(),
      );
    });
  });

  describe("getZeroDevBundlerRPCUrl", () => {
    test("should throw when the network is not supported", () => {
      expect(() => getZeroDevBundlerRPCUrl("Unsupported" as ESupportedNetworks)).toThrow(
        ErrorCodes.UNSUPPORTED_NETWORK.toString(),
      );
    });

    test("should return an RPCUrl for a supported network", () => {
      const rpcUrlOPS = getZeroDevBundlerRPCUrl(ESupportedNetworks.OPTIMISM_SEPOLIA);
      expect(rpcUrlOPS).toBeDefined();

      const rpcUrlOP = getZeroDevBundlerRPCUrl(ESupportedNetworks.OPTIMISM);
      expect(rpcUrlOP).toBeDefined();
    });
  });

  describe("getBundlerClient", () => {
    test("should throw when the network is not supported", () => {
      expect(() => getBundlerClient("Unsupported" as ESupportedNetworks)).toThrow(
        ErrorCodes.UNSUPPORTED_NETWORK.toString(),
      );
    });
  });

  describe("getRpcUrl", () => {
    test("should throw when given an unsupported network", () => {
      expect(() => getRpcUrl("Unsupported" as ESupportedNetworks)).toThrow(ErrorCodes.UNSUPPORTED_NETWORK.toString());
    });

    test("should throw when COORDINATOR_RPC_URL is not set", () => {
      delete process.env.COORDINATOR_RPC_URL;
      expect(() => getRpcUrl(ESupportedNetworks.OPTIMISM_SEPOLIA)).toThrow(
        ErrorCodes.COORDINATOR_RPC_URL_NOT_SET.toString(),
      );
    });
  });

  describe("viemChain", () => {
    test("should return correct chain for all supported networks", () => {
      expect(viemChain(ESupportedNetworks.ETHEREUM)).toBe(mainnet);
      expect(viemChain(ESupportedNetworks.ETHEREUM_SEPOLIA)).toBe(sepolia);
      expect(viemChain(ESupportedNetworks.ARBITRUM_ONE)).toBe(arbitrum);
      expect(viemChain(ESupportedNetworks.ARBITRUM_SEPOLIA)).toBe(arbitrumSepolia);
      expect(viemChain(ESupportedNetworks.BASE_SEPOLIA)).toBe(baseSepolia);
      expect(viemChain(ESupportedNetworks.LINEA_SEPOLIA)).toBe(lineaSepolia);
      expect(viemChain(ESupportedNetworks.SCROLL_SEPOLIA)).toBe(scrollSepolia);
      expect(viemChain(ESupportedNetworks.SCROLL)).toBe(scroll);
      expect(viemChain(ESupportedNetworks.BASE)).toBe(base);
      expect(viemChain(ESupportedNetworks.HOLESKY)).toBe(holesky);
      expect(viemChain(ESupportedNetworks.LINEA)).toBe(linea);
      expect(viemChain(ESupportedNetworks.BSC)).toBe(bsc);
      expect(viemChain(ESupportedNetworks.GNOSIS_CHAIN)).toBe(gnosis);
      expect(viemChain(ESupportedNetworks.POLYGON)).toBe(polygon);
      expect(viemChain(ESupportedNetworks.OPTIMISM)).toBe(optimism);
      expect(viemChain(ESupportedNetworks.OPTIMISM_SEPOLIA)).toBe(optimismSepolia);
    });

    test("should throw error for unsupported network", () => {
      expect(() => viemChain("UNSUPPORTED_NETWORK" as ESupportedNetworks)).toThrow(
        ErrorCodes.UNSUPPORTED_NETWORK.toString(),
      );
    });
  });
});
