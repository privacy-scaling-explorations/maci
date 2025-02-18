/**
 * Converts an IPFS CIDv1 to a bytes32-compatible hex string.
 *
 * This function:
 * - Decodes the Base32-encoded CIDv1
 * - Extracts the SHA-256 digest from the multihash
 * - Converts it to a Solidity-compatible `bytes32` format
 *
 * @param hash - The CIDv1 string
 * @returns A `bytes32`-compatible hex string (e.g., `0x...`)
 */
export const cidToBytes32 = async (hash: string): Promise<string> => {
  const [{ CID }, { ethers }] = await Promise.all([import("multiformats/cid"), import("ethers")]);

  return ethers.hexlify(CID.parse(hash).multihash.digest);
};

/**
 * Creates a CID (Content Identifier) from an object by encoding the object into JSON and
 * hashing it using the SHA-256 algorithm, and then creating a CID using the Multiformats CID library.
 *
 * @template T
 * @param {T} data The input object to be encoded and hashed to generate the CID.
 * @returns A CID generated from the hashed JSON-encoded object.
 *
 */
export const createCidFromObject = async <T>(data: T): Promise<string> => {
  const [{ CID }, json, { sha256 }] = await Promise.all([
    import("multiformats/cid"),
    import("multiformats/codecs/json"),
    import("multiformats/hashes/sha2"),
  ]);

  const hash = await sha256.digest(json.encode(data));

  return CID.create(1, json.code, hash).toString();
};
