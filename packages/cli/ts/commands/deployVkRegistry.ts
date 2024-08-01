import { deployVkRegistry } from "maci-contracts";

import fs from "fs";

import {
  banner,
  contractAddressesStore,
  logGreen,
  oldContractAddressesStore,
  success,
  storeContractAddress,
  resetContractAddresses,
  DeployVkRegistryArgs,
} from "../utils";

/**
 * Deploy the vkRegistry contract
 * @param quiet - whether to print the contract address
 */
export const deployVkRegistryContract = async ({ signer, quiet = true }: DeployVkRegistryArgs): Promise<string> => {
  banner(quiet);
  // assume that the vkRegistry contract is the first one to be deployed
  const isContractAddressesStoreExists = fs.existsSync(contractAddressesStore);

  if (isContractAddressesStoreExists) {
    await fs.promises.rename(contractAddressesStore, oldContractAddressesStore);
    await resetContractAddresses();
  }

  const network = await signer.provider?.getNetwork();
  // deploy and store the address
  const vkRegistry = await deployVkRegistry(signer, true);
  const vkRegistryAddress = await vkRegistry.getAddress();
  await storeContractAddress("VkRegistry", vkRegistryAddress, network?.name);

  logGreen(quiet, success(`VkRegistry deployed at: ${vkRegistryAddress}`));
  return vkRegistryAddress;
};
