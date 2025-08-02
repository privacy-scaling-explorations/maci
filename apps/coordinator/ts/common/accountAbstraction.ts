import { ESupportedChains } from "@maci-protocol/sdk";
import { deserializePermissionAccount } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { createKernelAccountClient } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import dotenv from "dotenv";
import { createPublicClient, http, type Hex } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";

import type { BundlerClientType, KernelClientType, PublicClientHTTPType } from "./types";

import { getRpcUrl } from "./chain";
import { ErrorCodes } from "./errors";
import { viemChain } from "./networks";

dotenv.config();

/**
 * Get a public client
 *
 * @param chainName - the name of the chain to use
 * @returns the public client
 */
export const getPublicClient = (chainName: ESupportedChains): PublicClientHTTPType =>
  createPublicClient({
    transport: http(getRpcUrl(chainName)),
    chain: viemChain(chainName),
  });

/**
 * Get the ZeroDev bundler RPC URL based on the network
 *
 * @param network - the network we are on
 * @returns the ZeroDev bundler RPC URL
 */
export const getZeroDevBundlerRPCUrl = (network: ESupportedChains): string => {
  switch (network) {
    case ESupportedChains.OptimismSepolia:
      return process.env.ZERODEV_BUNDLER_RPC_OP_SEPOLIA || "";
    case ESupportedChains.Optimism:
      return process.env.ZERODEV_BUNDLER_RPC_OP || "";
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};

/**
 * Get a bundler client
 *
 * @param chainName - the chain name
 * @returns the bundler client
 */
export const getBundlerClient = (chainName: ESupportedChains): BundlerClientType =>
  createBundlerClient({
    transport: http(getZeroDevBundlerRPCUrl(chainName)),
    chain: viemChain(chainName),
  });

/**
 * The offset for the address in the contract creation event
 */
export const addressOffset = 26;

/**
 * Get a Kernel account handle given a session key
 *
 * @param sessionKey - the session key to use
 * @param approval - the approval to the session key
 * @param chain - the chain to use
 * @returns the kernel client
 */
export const getKernelClient = async (
  sessionKey: Hex,
  approval: string,
  chain: ESupportedChains,
): Promise<KernelClientType> => {
  const bundlerUrl = getZeroDevBundlerRPCUrl(chain);
  const publicClient = getPublicClient(chain);

  // Using a stored private key
  const sessionKeySigner = await toECDSASigner({
    signer: privateKeyToAccount(sessionKey),
  });

  try {
    const sessionKeyAccount = await deserializePermissionAccount(
      publicClient,
      getEntryPoint("0.7"),
      KERNEL_V3_1,
      approval,
      sessionKeySigner,
    );
    const kernelClient = createKernelAccountClient({
      bundlerTransport: http(bundlerUrl),
      account: sessionKeyAccount,
      chain: viemChain(chain),
    });

    return kernelClient;
  } catch (error) {
    throw new Error(ErrorCodes.INVALID_APPROVAL.toString());
  }
};
