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

import type { TransactionReceipt } from "viem";

import {
  genAlchemyRPCUrl,
  genPimlicoRPCUrl,
  getBundlerClient,
  getDeployedContractAddress,
  getPublicClient,
  getZeroDevBundlerRPCUrl,
} from "../accountAbstraction";
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

  describe("genAlchemyRPCUrl", () => {
    test("should return the correct RPCUrl for optimism-sepolia", () => {
      const rpcUrl = genAlchemyRPCUrl(ESupportedNetworks.OPTIMISM_SEPOLIA);
      expect(rpcUrl).toBeDefined();
      expect(rpcUrl).toContain("https://opt-sepolia.g.alchemy.com/v2/");
    });

    test("should return the correct RPCUrl for sepolia", () => {
      const rpcUrl = genAlchemyRPCUrl(ESupportedNetworks.ETHEREUM_SEPOLIA);
      expect(rpcUrl).toBeDefined();
      expect(rpcUrl).toContain("https://eth-sepolia.g.alchemy.com/v2/");
    });

    test("should throw when given an unsupported network", () => {
      expect(() => genAlchemyRPCUrl(ESupportedNetworks.GNOSIS_CHAIN)).toThrow(
        ErrorCodes.UNSUPPORTED_NETWORK.toString(),
      );
    });

    test("should throw when ALCHEMY_API_KEY is not set", () => {
      delete process.env.RPC_API_KEY;
      expect(() => genAlchemyRPCUrl(ESupportedNetworks.OPTIMISM_SEPOLIA)).toThrow(
        ErrorCodes.RPC_API_KEY_NOT_SET.toString(),
      );
    });
  });

  describe("genPimlicoRPCUrl", () => {
    test("should return the correct RPCUrl", () => {
      const rpcUrl = genPimlicoRPCUrl("optimism-sepolia");
      expect(rpcUrl).toBeDefined();
      expect(rpcUrl).toContain("https://api.pimlico.io/v2/optimism-sepolia/rpc");
    });

    test("should throw when PIMLICO_API_KEY is not set", () => {
      delete process.env.PIMLICO_API_KEY;
      expect(() => genPimlicoRPCUrl("optimism-sepolia")).toThrow(ErrorCodes.PIMLICO_API_KEY_NOT_SET.toString());
    });
  });

  describe("getDeployedContractAddress", () => {
    test("should throw when the log is undefined", () => {
      expect(() => getDeployedContractAddress({} as TransactionReceipt)).toThrow();
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
