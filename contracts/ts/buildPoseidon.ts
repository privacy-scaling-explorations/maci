import { poseidonContract } from "circomlibjs";
import hre from "hardhat";

type ExtendedHre = typeof hre & { overwriteArtifact: (name: string, code: unknown) => Promise<void> };

const buildPoseidon = async (numInputs: number) => {
  await (hre as ExtendedHre).overwriteArtifact(`PoseidonT${numInputs + 1}`, poseidonContract.createCode(numInputs));
};

export const buildPoseidonT3 = (): Promise<void> => buildPoseidon(2);
export const buildPoseidonT4 = (): Promise<void> => buildPoseidon(3);
export const buildPoseidonT5 = (): Promise<void> => buildPoseidon(4);
export const buildPoseidonT6 = (): Promise<void> => buildPoseidon(5);

if (require.main === module) {
  buildPoseidonT3();
  buildPoseidonT4();
  buildPoseidonT5();
  buildPoseidonT6();
}
