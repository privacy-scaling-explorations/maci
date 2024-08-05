import fs from "fs";

import { contractAddressesStore } from "./constants";
import { logError } from "./theme";

/**
 * Read a JSON file from disk
 * @param path - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = async (path: string): Promise<Record<string, Record<string, string> | undefined>> => {
  const isExists = fs.existsSync(path);

  if (!isExists) {
    logError(`File ${path} does not exist`);
  }

  return JSON.parse(await fs.promises.readFile(path).then((res) => res.toString())) as Record<
    string,
    Record<string, string> | undefined
  >;
};

/**
 * Store a contract address to the local address store file
 * @param contractName - the name of the contract
 * @param address - the address of the contract
 */
export const storeContractAddress = async (
  contractName: string,
  address: string,
  network = "default",
): Promise<void> => {
  // if it does not exist yet, then create it
  const isContractAddressesStoreExists = fs.existsSync(contractAddressesStore);

  if (!isContractAddressesStoreExists) {
    await fs.promises.writeFile(contractAddressesStore, "{}");
  }

  const contractAddrs = await readJSONFile(contractAddressesStore);

  if (!contractAddrs[network]) {
    contractAddrs[network] = {};
  }

  contractAddrs[network][contractName] = address;
  await fs.promises.writeFile(contractAddressesStore, JSON.stringify(contractAddrs, null, 4));
};

/**
 * Read a contract address from the local address store file
 * @param contractName - the name of the contract
 * @returns the contract address or a undefined if it does not exist
 */
export const readContractAddress = async (contractName: string, network = "default"): Promise<string> => {
  try {
    const result = await readJSONFile(contractAddressesStore);

    return result[network]?.[contractName] || "";
  } catch (error) {
    return "";
  }
};

/**
 * Delete the content of the contract address file
 */
export const resetContractAddresses = async (): Promise<void> => {
  await fs.promises.writeFile(contractAddressesStore, JSON.stringify({}, null, 4));
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
