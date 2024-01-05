import type { Provider } from "ethers";

/**
 * Small utility function to check whether a contract exists at a given address
 * @param provider - the provider to use to interact with the chain
 * @param address - the address of the contract to check
 * @returns a boolean indicating whether the contract exists
 */
export const contractExists = async (provider: Provider, address: string): Promise<boolean> => {
  const code = await provider.getCode(address);
  return code.length > 2;
};

/**
 * Small utility to retrieve the current block timestamp from the blockchain
 * @param provider the provider to use to interact with the chain
 * @returns the current block timestamp
 */
export const currentBlockTimestamp = async (provider: Provider): Promise<number> => {
  const blockNum = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNum);

  return Number(block?.timestamp);
};
