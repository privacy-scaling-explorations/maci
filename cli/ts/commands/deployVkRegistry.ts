import { deployVkRegistry } from "maci-contracts";
import { existsSync, renameSync } from "fs";
import {
    contractAddressesStore,
    oldContractAddressesStore,
} from "../utils/constants";
import { logGreen, success } from "../utils/theme";
import { banner } from "../utils/banner";
import { resetContractAddresses, storeContractAddress } from "../utils/storage";

/**
 * Deploy the vkRegistry contract
 * @param quiet - whether to print the contract address
 */
export const deployVkRegistryContract = async (
    quiet = true
): Promise<string> => {
    banner(quiet);
    // assume that the vkRegistry contract is the first one to be deployed
    if (existsSync(contractAddressesStore)) {
        renameSync(contractAddressesStore, oldContractAddressesStore);
        resetContractAddresses();
    }

    // deploy and store the address
    const vkRegistry = await deployVkRegistry(true);
    storeContractAddress("VkRegistry", vkRegistry.address);
    
    logGreen(quiet, success(`VkRegistry deployed at: ${vkRegistry.address}`));
    return vkRegistry.address;
};
