import type { ICircuitParams } from "./types";

/**
 * Validate the circuit parameters
 * @param params - The circuit parameters
 */
export const validateParams = ({
  stateTreeDepth,
  tallyProcessingStateTreeDepth,
  voteOptionTreeDepth,
  messageBatchSize,
}: ICircuitParams): boolean => {
  // validate args
  if (stateTreeDepth < 1 || tallyProcessingStateTreeDepth < 1 || voteOptionTreeDepth < 1 || messageBatchSize < 1) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (stateTreeDepth < tallyProcessingStateTreeDepth) {
    throw new Error("Invalid state tree depth or intermediate state tree depth");
  }

  return true;
};
