const { poseidonContract } = require("circomlibjs");

const buildPoseidon = async (numInputs: number) => {
  await overwriteArtifact(
    `PoseidonT${numInputs + 1}`,
    poseidonContract.createCode(numInputs)
  );
};

const buildPoseidonT2 = () => buildPoseidon(1);
const buildPoseidonT3 = () => buildPoseidon(2);
const buildPoseidonT4 = () => buildPoseidon(3);
const buildPoseidonT5 = () => buildPoseidon(4);
const buildPoseidonT6 = () => buildPoseidon(5);
const buildPoseidonT7 = () => buildPoseidon(6);

buildPoseidonT2();
buildPoseidonT3();
buildPoseidonT4();
buildPoseidonT5();
buildPoseidonT6();
buildPoseidonT7();
