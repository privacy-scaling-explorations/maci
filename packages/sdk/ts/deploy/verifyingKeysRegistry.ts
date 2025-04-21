import { deployVerifyingKeysRegistry } from "@maci-protocol/contracts";

import type { IDeployVerifyingKeyRegistryArgs } from "./types";

/**
 * Deploy the verifyingKeysRegistry contract
 * @param args deploy VerifyingKeysRegistry arguments
 */
export const deployVerifyingKeysRegistryContract = async ({
  signer,
}: IDeployVerifyingKeyRegistryArgs): Promise<string> => {
  const verifyingKeysRegistry = await deployVerifyingKeysRegistry(signer, true);

  return verifyingKeysRegistry.getAddress();
};
