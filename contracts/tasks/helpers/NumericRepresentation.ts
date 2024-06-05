import { parse as uuidParse } from "uuid";

/**
 * Converts a UUID string into a bigint.
 */
export function uuidToBigInt(v: string): bigint {
  // a uuid is just a particular representation of 16 bytes
  const bytes = uuidParse(v);
  return BigInt(`0x${Buffer.from(bytes).toString("hex")}`);
}
