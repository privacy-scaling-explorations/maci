import { JsonRpcProvider, Signer, Wallet } from "ethers";

import { ErrorCodes } from "./errors";
import { ESupportedNetworks } from "./networks";

/**
 * Generate the RPCUrl for Alchemy based on the chain we need to interact with
 *
 * @param network - the network we want to interact with
 * @returns the RPCUrl for the network
 */
export const genAlchemyRPCUrl = (network: ESupportedNetworks): string => {
  const rpcAPIKey = process.env.RPC_API_KEY;

  if (!rpcAPIKey) {
    throw new Error(ErrorCodes.RPC_API_KEY_NOT_SET.toString());
  }

  switch (network) {
    case ESupportedNetworks.OPTIMISM_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2/${rpcAPIKey}`;
    case ESupportedNetworks.ETHEREUM_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${rpcAPIKey}`;
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};

/**
 * Get a Ethers Signer given a chain and private key
 * @param chain
 * @returns
 */
export const getSigner = (chain: ESupportedNetworks): Signer => {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const alchemyRpcUrl = genAlchemyRPCUrl(chain);
  const provider = new JsonRpcProvider(alchemyRpcUrl);

  return wallet.connect(provider);
};
