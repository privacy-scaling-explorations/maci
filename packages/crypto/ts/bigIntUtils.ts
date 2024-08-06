import type { BigIntVariants, StringifiedBigInts } from "./types";

/**
 * Given an input containing string values, convert them
 * to bigint
 * @param input - The input to convert
 * @returns the input with string values converted to bigint
 */
export const unstringifyBigInts = (input: StringifiedBigInts): BigIntVariants => {
  if (typeof input === "string" && /^[0-9]+$/.test(input)) {
    return BigInt(input);
  }

  if (typeof input === "string" && /^0x[0-9a-fA-F]+$/.test(input)) {
    return BigInt(input);
  }

  if (Array.isArray(input)) {
    return input.map(unstringifyBigInts);
  }

  if (input === null) {
    return null;
  }

  if (typeof input === "object") {
    return Object.entries(input).reduce<Record<string, bigint>>((acc, [key, value]) => {
      acc[key] = unstringifyBigInts(value) as bigint;
      return acc;
    }, {});
  }

  return input;
};

/**
 * Converts a string to a bigint using the given radix
 * @param str - The string to convert
 * @param radix - The radix to use
 * @returns The converted string as a bigint
 */
export const fromString = (str: string, radix: number): bigint => {
  if (!radix || radix === 10) {
    return BigInt(str);
  }

  if (radix === 16) {
    if (str.startsWith("0x")) {
      return BigInt(str);
    }
    return BigInt(`0x${str}`);
  }

  return BigInt(str);
};

/**
 * Parses a buffer with Little Endian Representation
 * @param buff - The buffer to parse
 * @param o - The offset to start from
 * @param n8 - The byte length
 * @returns The parsed buffer as a string
 */
export const fromRprLE = (buff: ArrayBufferView, o = 0, n8: number = buff.byteLength): string => {
  const v = new Uint32Array(buff.buffer, buff.byteOffset + o, n8 / 4);
  const a: string[] = new Array<string>(n8 / 4);
  v.forEach((ch, i) => {
    a[a.length - i - 1] = ch.toString(16).padStart(8, "0");
  });
  return fromString(a.join(""), 16).toString();
};

/**
 * Given an input of bigint values, convert them to their string representations
 * @param input - The input to convert
 * @returns The input with bigint values converted to string
 */
export const stringifyBigInts = (input: BigIntVariants): StringifiedBigInts => {
  if (typeof input === "bigint") {
    return input.toString();
  }

  if (input instanceof Uint8Array) {
    return fromRprLE(input, 0);
  }

  if (Array.isArray(input)) {
    return input.map(stringifyBigInts);
  }

  if (input === null) {
    return null;
  }

  if (typeof input === "object") {
    return Object.entries(input).reduce<Record<string, StringifiedBigInts>>((acc, [key, value]) => {
      acc[key] = stringifyBigInts(value);
      return acc;
    }, {});
  }

  return input;
};

/**
 * Create a copy of a bigint array
 * @param arr - the array of bigints to copy
 * @returns a deep copy of the array
 */
export const deepCopyBigIntArray = (arr: bigint[]): bigint[] => arr.map((x) => BigInt(x.toString()));

/**
 * Sihft a left by n bits
 * @param a - The first bigint
 * @param n - The second bigint
 * @returns The result of shifting a right by n
 */
export const shiftRight = (a: bigint, n: bigint): bigint =>
  // eslint-disable-next-line no-bitwise
  a >> n;

/**
 * Convert a BigInt to a Buffer
 * @param i - the bigint to convert
 * @returns the buffer
 */
export const bigInt2Buffer = (i: bigint): Buffer => {
  let hex = i.toString(16);

  // Ensure even length.
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }
  return Buffer.from(hex, "hex");
};
