import { JsonRpcProvider, Signer, Wallet } from "ethers";

import { ErrorCodes } from "./errors";
import { ESupportedNetworks } from "./networks";

/**
 * Get the RPCUrl for Alchemy based on the chain we need to interact with
 *
 * @param network - the network we want to interact with
 * @returns the RPCUrl for the network
 */
export const getAlchemyRpcUrl = (network: ESupportedNetworks): string => {
  const apiKey = process.env.RPC_API_KEY;

  if (!apiKey) {
    throw new Error(ErrorCodes.RPC_API_KEY_NOT_SET.toString());
  }

  switch (network) {
    case ESupportedNetworks.OPTIMISM_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2/${apiKey}`;
    case ESupportedNetworks.ETHEREUM_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`;
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
  const alchemyRpcUrl = getAlchemyRpcUrl(chain);
  const provider = new JsonRpcProvider(alchemyRpcUrl);

  return wallet.connect(provider);
};
