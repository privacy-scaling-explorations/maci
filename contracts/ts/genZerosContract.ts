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

export const genZerosContract = ({
  name,
  zeroVal,
  hashLength,
  numZeros,
  comment,
  useSha256,
  subDepth,
}: IGetZerosContractArgs): string => {
  assert(hashLength === 2 || hashLength === 5);

  const template = fs.readFileSync(path.resolve(__dirname, "..", "templates", "MerkleZeros.sol.template")).toString();

  const zeros: bigint[] = [zeroVal];
  for (let i = 1; i < numZeros; i += 1) {
    const z = zeros[i - 1];
    let hashed: bigint;

    if (useSha256 && i <= subDepth) {
      if (hashLength === 2) {
        hashed = sha256Hash([z, z]);
      } else {
        hashed = sha256Hash([z, z, z, z, z]);
      }
    } else if (hashLength === 2) {
      hashed = hashLeftRight(z, z);
    } else {
      hashed = hash5([z, z, z, z, z]);
    }

    zeros.push(hashed);
  }

  let z = "";
  for (let i = 0; i < zeros.length; i += 1) {
    z += `    zeros[${i}] = uint256(${zeros[i]});\n`;
  }

  const generated = template
    .replace("<% CONTRACT_NAME %>", name)
    .replace("<% NUM_ZEROS %>", numZeros.toString())
    .replace("<% ZEROS %>", `    ${z.trim()}`)
    .replace("<% COMMENT %>", comment.trim());

  return generated.trim();
};
