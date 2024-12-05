import { poseidonContract } from "circomlibjs";
import hre from "hardhat";

import fs from "fs";
import path from "path";

const PATHS = [
  path.resolve(__dirname, "..", "artifacts"),
  path.resolve(__dirname, "..", "cache"),
  path.resolve(__dirname, "..", "typechain-types"),
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

  await hre.run("compile");

  await Promise.all([buildPoseidonT3(), buildPoseidonT4(), buildPoseidonT5(), buildPoseidonT6()]);
}

main();
