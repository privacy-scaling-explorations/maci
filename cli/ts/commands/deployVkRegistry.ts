import { deployVkRegistry, getDefaultSigner } from "maci-contracts";

import fs from "fs";

import { banner } from "../utils/banner";
import { contractAddressesStore, oldContractAddressesStore } from "../utils/constants";
import { resetContractAddresses, storeContractAddress } from "../utils/storage";
import { logGreen, success } from "../utils/theme";

/**
 * Deploy the vkRegistry contract
 * @param quiet - whether to print the contract address
 */
export const deployVkRegistryContract = async (quiet = true): Promise<string> => {
  banner(quiet);
  // assume that the vkRegistry contract is the first one to be deployed
  if (fs.existsSync(contractAddressesStore)) {
    fs.renameSync(contractAddressesStore, oldContractAddressesStore);
    resetContractAddresses();
  }

  // deploy and store the address
  const vkRegistry = await deployVkRegistry(await getDefaultSigner(), true);
  const vkRegistryAddress = await vkRegistry.getAddress();
  storeContractAddress("VkRegistry", vkRegistryAddress);

  logGreen(quiet, success(`VkRegistry deployed at: ${vkRegistryAddress}`));
  return vkRegistryAddress;
};
