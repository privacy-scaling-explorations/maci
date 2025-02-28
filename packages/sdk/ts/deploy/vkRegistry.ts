import { deployVkRegistry } from "maci-contracts";

import type { IDeployVkRegistryArgs } from "./types";

/**
 * Deploy the vkRegistry contract
 * @param args deploy VkRegistry arguments
 */
export const deployVkRegistryContract = async ({ signer }: IDeployVkRegistryArgs): Promise<string> => {
  const vkRegistry = await deployVkRegistry(signer, true);

  return vkRegistry.getAddress();
};
