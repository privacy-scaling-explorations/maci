import { JsonRpcProvider, Signer, Wallet } from "ethers";

import { ErrorCodes } from "./errors";
import { ESupportedNetworks } from "./networks";

/**
 * Get the RPC url for the chain we need to interact with
 *
 * @param network - the network we want to interact with
 * @returns the RPC url for the network
 */
export const getRpcUrl = (network: ESupportedNetworks): string => {
  const rpcUrl = process.env.COORDINATOR_RPC_URL;

  if (!rpcUrl) {
    throw new Error(ErrorCodes.COORDINATOR_RPC_URL_NOT_SET.toString());
  }

  if (!Object.values(ESupportedNetworks).includes(network)) {
    throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }

  return rpcUrl;
};

/**
 * Get a Ethers Signer given a chain and private key
 * @param chain
 * @returns
 */
export const getSigner = (chain: ESupportedNetworks): Signer => {
  const wallet = process.env.PRIVATE_KEY
    ? new Wallet(process.env.PRIVATE_KEY)
    : Wallet.fromPhrase(process.env.MNEMONIC!);

  const alchemyRpcUrl = getRpcUrl(chain);
  const provider = new JsonRpcProvider(alchemyRpcUrl);

  return wallet.connect(provider);
};
