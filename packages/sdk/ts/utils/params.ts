import type { ICircuitParams } from "./types";
import type { BigNumberish } from "ethers";

/**
 * Validate the circuit parameters
 * @param params - The circuit parameters
 */
export const validateParams = ({
  stateTreeDepth,
  intStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
}: ICircuitParams): boolean => {
  // validate args
  if (stateTreeDepth < 1 || intStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < intStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  return true;
};

/**
 * Convert a value to its hex representation
 * @param value the value to convert
 * @returns the value converted as a hex string
 */
export const asHex = (value: BigNumberish): string => `0x${BigInt(value).toString(16)}`;
