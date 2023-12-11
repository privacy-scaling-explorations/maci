import { deployVkRegistry, getDefaultSigner } from "maci-contracts";
import { existsSync, renameSync } from "fs";
import { contractAddressesStore, oldContractAddressesStore } from "../utils/constants";
import { logGreen, success } from "../utils/theme";
import { banner } from "../utils/banner";
import { resetContractAddresses, storeContractAddress } from "../utils/storage";

/**
 * Deploy the vkRegistry contract
 * @param quiet - whether to print the contract address
 */
export const deployVkRegistryContract = async (quiet = true): Promise<string> => {
  banner(quiet);
  // assume that the vkRegistry contract is the first one to be deployed
  if (existsSync(contractAddressesStore)) {
    renameSync(contractAddressesStore, oldContractAddressesStore);
    resetContractAddresses();
  }

  // deploy and store the address
  const vkRegistry = await deployVkRegistry(await getDefaultSigner(), true);
  const vkRegistryAddress = await vkRegistry.getAddress();
  storeContractAddress("VkRegistry", vkRegistryAddress);

  logGreen(quiet, success(`VkRegistry deployed at: ${vkRegistryAddress}`));
  return vkRegistryAddress;
};
