import { ESupportedChains } from "@maci-protocol/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { type Policy, serializePermissionAccount, toPermissionValidator } from "@zerodev/permissions";
import { toSudoPolicy, toTimestampPolicy } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { addressToEmptyAccount, createKernelAccount, type CreateKernelAccountReturnType } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import dotenv from "dotenv";
import { type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getPublicClient } from "../../common/accountAbstraction";
import { getWallet } from "../../common/chain";

dotenv.config();

export const ENTRY_POINT = getEntryPoint("0.7");
export const KERNEL_VERSION = KERNEL_V3_1;

/**
 * Generate a timestamp policy
 * @param endTime - The end time of the policy
 * @param start - The start time of the policy
 * @returns The timestamp policy
 */
export const generateTimestampPolicy = (endTime: number, start?: number): Policy =>
  toTimestampPolicy({
    validAfter: start,
    validUntil: endTime,
  });

/**
 * Get smart contract kernel account
 * @param sessionKeyAddress - the session key address
 * @returns - the kernel account
 */
export const getKernelAccount = async (sessionKeyAddress: Hex): Promise<CreateKernelAccountReturnType> => {
  const publicClient = await getPublicClient(ESupportedChains.Localhost);
  const wallet = getWallet();

  const sessionKeySigner = privateKeyToAccount(wallet.privateKey as Hex);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: sessionKeySigner,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  const emptyAccount = addressToEmptyAccount(sessionKeyAddress);
  const emptySessionKeySigner = await toECDSASigner({ signer: emptyAccount });

  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    signer: emptySessionKeySigner,
    policies: [toSudoPolicy({})],
  });

  return await createKernelAccount(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
  });
};

/**
 * Generate an approval for a session key
 * @param sessionKeyAddress - the session key address
 * @returns - the approval
 */
export const generateApproval = async (sessionKeyAddress: Hex): Promise<string> => {
  const sessionKeyAccount = await getKernelAccount(sessionKeyAddress);
  return await serializePermissionAccount(sessionKeyAccount);
};
