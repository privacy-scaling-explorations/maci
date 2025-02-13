import { DIVISOR, EXTRA_GAS_LIMIT_PERCENTAGE } from "./constants";

/**
 * Estimate the extra gas limit
 *
 * @param callGasLimit The gas limit of the call
 * @returns The extra gas limit
 */
export const estimateExtraGasLimit = (callGasLimit: bigint): bigint =>
  (callGasLimit * EXTRA_GAS_LIMIT_PERCENTAGE) / DIVISOR;
