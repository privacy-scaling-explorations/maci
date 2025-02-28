import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { type Policy, serializePermissionAccount, toPermissionValidator } from "@zerodev/permissions";
import { toSudoPolicy, toTimestampPolicy } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { addressToEmptyAccount, createKernelAccount, KernelSmartAccount } from "@zerodev/sdk";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import dotenv from "dotenv";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { Chain, type Hex, HttpTransport } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { ESupportedNetworks } from "../../common";
import { getPublicClient } from "../../common/accountAbstraction";

dotenv.config();

export const ENTRY_POINT = ENTRYPOINT_ADDRESS_V07;
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
export const getKernelAccount = async (
  sessionKeyAddress: Hex,
): Promise<KernelSmartAccount<typeof ENTRYPOINT_ADDRESS_V07, HttpTransport, Chain>> => {
  const publicClient = getPublicClient(ESupportedNetworks.OPTIMISM_SEPOLIA);

  const sessionKeySigner = privateKeyToAccount(process.env.TEST_PRIVATE_KEY! as Hex);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: sessionKeySigner,
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
  });

  const emptyAccount = addressToEmptyAccount(sessionKeyAddress);
  const emptySessionKeySigner = toECDSASigner({ signer: emptyAccount });

  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    signer: emptySessionKeySigner,
    policies: [toSudoPolicy({})],
  });

  const sessionKeyAccount = await createKernelAccount(publicClient, {
    entryPoint: ENTRY_POINT,
    kernelVersion: KERNEL_VERSION,
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
  });
  return sessionKeyAccount;
};

/**
 * Generate an approval for a session key
 * @param sessionKeyAddress - the session key address
 * @returns - the approval
 */
export const generateApproval = async (sessionKeyAddress: Hex): Promise<string> => {
  const sessionKeyAccount = await getKernelAccount(sessionKeyAddress);
  return serializePermissionAccount(sessionKeyAccount);
};
