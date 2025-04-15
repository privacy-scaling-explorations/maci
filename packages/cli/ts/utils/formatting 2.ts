import type { BigNumberish } from "ethers";

/**
 * Convert a value to its hex representation
 * @param val - the value to convert
 * @returns the value converted as a hex string
 */
export const asHex = (val: BigNumberish): string => `0x${BigInt(val).toString(16)}`;
