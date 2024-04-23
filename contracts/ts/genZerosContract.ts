import { sha256Hash, hashLeftRight, hash5 } from "maci-crypto";

import assert from "assert";
import fs from "fs";
import path from "path";

interface IGetZerosContractArgs {
  name: string;
  zeroVal: bigint;
  hashLength: number;
  numZeros: number;
  comment: string;
  useSha256: boolean;
  subDepth: number;
}

export const genZerosContract = async ({
  name,
  zeroVal,
  hashLength,
  numZeros,
  comment,
  useSha256,
  subDepth,
}: IGetZerosContractArgs): Promise<string> => {
  assert(hashLength === 2 || hashLength === 5);

  const template = await fs.promises
    .readFile(path.resolve(__dirname, "..", "templates", "MerkleZeros.sol.template"))
    .then((res) => res.toString());

  const hashes: bigint[] = [zeroVal];

  for (let index = 1; index < numZeros; index += 1) {
    const zero = hashes[index - 1];
    let hashed: bigint;

    if (useSha256 && index <= subDepth) {
      hashed = sha256Hash([zero, zero, zero, zero, zero].slice(0, hashLength));
    } else if (hashLength === 2) {
      hashed = hashLeftRight(zero, zero);
    } else {
      hashed = hash5([zero, zero, zero, zero, zero]);
    }

    hashes.push(hashed);
  }

  const zeros = hashes.map((hash, index) => `${"".padStart(4)}zeros[${index}] = uint256(${hash.toString()});`);

  return template
    .replace("<% CONTRACT_NAME %>", name)
    .replace("<% NUM_ZEROS %>", numZeros.toString())
    .replace("<% ZEROS %>", zeros.join("\n"))
    .replace("<% COMMENT %>", comment.trim())
    .trim();
};
