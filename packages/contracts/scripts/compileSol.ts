import { poseidonContract } from "circomlibjs";
import hre from "hardhat";

import fs from "fs";
import path from "path";

import { genZerosContract } from "../ts/genZerosContract";

const PATHS = [
  path.resolve(__dirname, "..", "artifacts"),
  path.resolve(__dirname, "..", "cache"),
  path.resolve(__dirname, "..", "typechain-types"),
];

const NOTHING_UP_MY_SLEEVE_MACI_NUMS = 8370432830353022751713833565135785980866757267633941821328460903436894336785n;
const BLANK_STATE_LEAF = 6769006970205099520508948723718471724660867171122235270773600567925038008762n;
const NUM_ZEROS = 33;

const ZERO_TREES = [
  {
    name: "MerkleBinary0",
    zero: 0n,
    hashLength: 2,
    comment: "Binary tree zeros (0)",
  },
  {
    name: "MerkleBinaryMaci",
    zero: NOTHING_UP_MY_SLEEVE_MACI_NUMS,
    hashLength: 2,
    comment: "Binary tree zeros (Keccak hash of 'Maci')",
  },
  {
    name: "MerkleBinaryBlankSl",
    zero: BLANK_STATE_LEAF,
    hashLength: 2,
    comment: "Binary tree zeros (hash of a blank state leaf)",
  },
  {
    name: "MerkleQuinary0",
    zero: 0n,
    hashLength: 5,
    comment: "Quinary tree zeros (0)",
  },
  {
    name: "MerkleQuinaryMaci",
    zero: NOTHING_UP_MY_SLEEVE_MACI_NUMS,
    hashLength: 5,
    comment: "Quinary tree zeros (Keccak hash of 'Maci')",
  },
  {
    name: "MerkleQuinaryBlankSl",
    zero: BLANK_STATE_LEAF,
    hashLength: 5,
    comment: "Quinary tree zeros (hash of a blank state leaf)",
  },
];

type ExtendedHre = typeof hre & { overwriteArtifact: (name: string, code: unknown) => Promise<void> };

const buildPoseidon = async (numInputs: number) => {
  await (hre as ExtendedHre).overwriteArtifact(`PoseidonT${numInputs + 1}`, poseidonContract.createCode(numInputs));
};

const buildPoseidonT3 = (): Promise<void> => buildPoseidon(2);
const buildPoseidonT4 = (): Promise<void> => buildPoseidon(3);
const buildPoseidonT5 = (): Promise<void> => buildPoseidon(4);
const buildPoseidonT6 = (): Promise<void> => buildPoseidon(5);

async function main(): Promise<void> {
  await Promise.all(PATHS.map((filepath) => fs.existsSync(filepath) && fs.promises.rm(filepath, { recursive: true })));

  await Promise.all(
    ZERO_TREES.map(({ name, zero, hashLength, comment }) =>
      genZerosContract({
        name,
        zeroVal: zero,
        hashLength,
        numZeros: NUM_ZEROS,
        comment,
        useSha256: false,
        subDepth: 0,
      }).then((text) =>
        fs.promises.writeFile(path.resolve(__dirname, "..", "contracts/trees/zeros", `${name}.sol`), `${text}\n`),
      ),
    ),
  );

  await hre.run("compile");

  await Promise.all([buildPoseidonT3(), buildPoseidonT4(), buildPoseidonT5(), buildPoseidonT6()]);
}

main();
