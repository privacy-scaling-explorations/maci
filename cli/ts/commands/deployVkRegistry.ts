import { deployVkRegistry, getDefaultSigner, getDefaultNetwork } from "maci-contracts";

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
  if (fs.existsSync(contractAddressesStore)) {
    fs.renameSync(contractAddressesStore, oldContractAddressesStore);
    resetContractAddresses();
  }

  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();
  // deploy and store the address
  const vkRegistry = await deployVkRegistry(ethSigner, true);
  const vkRegistryAddress = await vkRegistry.getAddress();
  storeContractAddress("VkRegistry", vkRegistryAddress, network?.name);

  logGreen(quiet, success(`VkRegistry deployed at: ${vkRegistryAddress}`));
  return vkRegistryAddress;
};
