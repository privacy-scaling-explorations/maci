import fs from "fs";

import { contractAddressesStore } from "./constants";
import { logError } from "./theme";

/**
 * Read a JSON file from disk
 * @param path - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = (path: string): Record<string, Record<string, string> | undefined> => {
  if (!fs.existsSync(path)) {
    logError(`File ${path} does not exist`);
  }

  return JSON.parse(fs.readFileSync(path).toString()) as Record<string, Record<string, string> | undefined>;
};

/**
 * Store a contract address to the local address store file
 * @param contractName - the name of the contract
 * @param address - the address of the contract
 */
export const storeContractAddress = (contractName: string, address: string, network = "default"): void => {
  // if it does not exist yet, then create it
  if (!fs.existsSync(contractAddressesStore)) {
    fs.writeFileSync(contractAddressesStore, "{}");
  }

  const contractAddrs = readJSONFile(contractAddressesStore);

  if (!contractAddrs[network]) {
    contractAddrs[network] = {};
  }

  contractAddrs[network]![contractName] = address;
  fs.writeFileSync(contractAddressesStore, JSON.stringify(contractAddrs, null, 4));
};

/**
 * Read a contract address from the local address store file
 * @param contractName - the name of the contract
 * @returns the contract address or a undefined it it does not exist
 */
export const readContractAddress = (contractName: string, network = "default"): string => {
  try {
    return readJSONFile(contractAddressesStore)[network]?.[contractName] || "";
  } catch (error) {
    return "";
  }
};

/**
 * Delete the content of the contract address file file
 */
export const resetContractAddresses = (): void => {
  fs.writeFileSync(contractAddressesStore, JSON.stringify({}, null, 4));
};

/**
 * Check if an array of paths exist on the local file system
 * @param paths - the array of paths to check
 * @returns an array of boolean and string,
 * where the boolean indicates whether all paths exist, and the string
 * is the path that does not exist
 */
export const doesPathExist = (paths: string[]): [boolean, string | null] => {
  const notFoundPath = paths.find((path) => !fs.existsSync(path));

  return notFoundPath ? [false, notFoundPath] : [true, null];
};
