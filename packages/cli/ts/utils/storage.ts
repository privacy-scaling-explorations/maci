import fs from "fs";

import { contractAddressesStore } from "./constants";

/**
 * Read a JSON file from disk
 * @param path - the path of the file
 * @returns the JSON object
 */
export const readJSONFile = async (path: string): Promise<Record<string, Record<string, string> | undefined>> => {
  const isExists = fs.existsSync(path);

  if (!isExists) {
    throw new Error(`File ${path} does not exist`);
  }

  return fs.promises
    .readFile(path)
    .then((res) => JSON.parse(res.toString()) as Record<string, Record<string, string> | undefined>);
};

/**
 * Store a contract address to the local address store file
 * @param data the contract name - address object
 * @param network the network where the contracts are deployed
 */
export const storeContractAddresses = async (data: Record<string, string>, network = "default"): Promise<void> => {
  // if it does not exist yet, then create it
  const isContractAddressesStoreExists = fs.existsSync(contractAddressesStore);

  if (!isContractAddressesStoreExists) {
    await fs.promises.writeFile(contractAddressesStore, "{}");
  }

  const contractAddrs = await readJSONFile(contractAddressesStore);

  await fs.promises.writeFile(
    contractAddressesStore,
    JSON.stringify({ ...(contractAddrs[network] || {}), ...data }, null, 4),
  );
};

/**
 * Read a contract address from the local address store file
 * @param contractNames the names of the contracts
 * @param network the network where the contracts are deployed
 * @param defaultValues the default addresses for the contracts
 * @returns the contract address or a undefined if it does not exist
 */
export const readContractAddresses = async (
  contractNames: string[],
  network?: string,
  defaultValues?: (string | undefined)[],
): Promise<string[]> => {
  try {
    const result = await readJSONFile(contractAddressesStore);
    const data = { ...(result[network ?? "default"] || {}) };

    return contractNames.map((name, index) => defaultValues?.[index] ?? data[name]).filter(Boolean);
  } catch (error) {
    return defaultValues ? (defaultValues.filter(Boolean) as string[]) : [];
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
