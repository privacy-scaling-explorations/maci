import { Interface, LogDescription, Provider, TransactionReceipt } from "ethers";

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

/**
 * Small utility to retrieve an event log from a transaction receipt.
 * Smart accounts could emit different events and we need to find them in the logs array.
 * @param receipt transaction receipt
 * @param iface interface of contract that emitted the event
 * @param eventName event name
 * @returns event log if found, null otherwise
 */
export const parseEventFromLogs = (
  receipt: TransactionReceipt,
  iface: Interface,
  eventName: string,
): LogDescription | null => {
  const { logs } = receipt;
  let eventLog: LogDescription | null = null;
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const log = logs[i];
    const parsedLog = iface.parseLog(log);
    if (parsedLog && parsedLog.name === eventName) {
      eventLog = parsedLog;
      break;
    }
  }
  return eventLog;
};
