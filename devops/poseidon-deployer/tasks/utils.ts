import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { randomBytes } from "node:crypto";

const { buildPoseidonOpt } = require("circomlibjs");

export const getAllSubsets = (theArray) =>
  theArray.reduce(
    (subsets, value) => subsets.concat(subsets.map((set) => [...set, value])),
    [[]]
  );

export const genSalt = () => "0x" + randomBytes(32).toString("hex");

export const verifyPoseidonContracts = async (
  addressBook: Map<string, string>
) => {
  // `poseidonReference` is a reference implementation of `circomlibjs` (https://github.com/iden3/circomlibjs)
  const poseidonReference = await buildPoseidonOpt();

  const poseidonContracts = new Map();
  for (const [TN, address] of addressBook.entries()) {
    try {
      poseidonContracts[`${TN}`] = await ethers.getContractAt(
        `Poseidon${TN}`,
        address
      );
    } catch (e) {
      throw new Error(
        `failed to get Contracts (name: Poseidon${TN}, address: value) \n` + e
      );
    }

    const input = [];
    const N = TN.charAt(1);
    for (let i = 1; i < Number(N); i++) {
      input.push(i);
    }

    // # Expected hash values for each Poseidon contracts
    //
    //  Contract  |      Input(s)        |  expected value
    // PoseidonT2 | [ 1 ]                | 0x29176100eaa962bdc1fe6c654d6a3c130e96a4d1168b33848b897dc502820133
    // PoseidonT3 | [ 1, 2 ]             | 0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
    // PoseidonT4 | [ 1, 2, 3 ]          | 0xe7732d89e6939c0ff03d5e58dab6302f3230e269dc5b968f725df34ab36d732
    // PoseidonT5 | [ 1, 2, 3, 4 ]       | 0x299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465
    // PoseidonT6 | [ 1, 2, 3, 4, 5 ]    | 0xdab9449e4a1398a15224c0b15a49d598b2174d305a316c918125f8feeb123c0
    // PoseidonT7 | [ 1, 2, 3, 4, 5, 6 ] | 0x2d1a03850084442813c8ebf094dea47538490a68b05f2239134a4cca2f6302e1
    const expectedHash = poseidonReference.F.toString(poseidonReference(input));
    let hash;
    try {
      hash = await poseidonContracts[`${TN}`].poseidon(input);
      expect(hash).to.equal(expectedHash);
    } catch (e) {
      throw new Error(`given address(${address}) is not valid poseidon${TN} contract. \n
                      expected: ${expectedHash} \n
                      actual: ${hash} \n
                      input: ${input} \n
                      ${e}`);
    }
  }

  return true;
};
