import { expect } from "chai";
import { BigNumberish } from "ethers";
import { sha256Hash, hashLeftRight, hash3, hash4, hash5, genRandomSalt } from "maci-crypto";

import { deployPoseidonContracts, linkPoseidonLibraries } from "../ts/deploy";
import { getDefaultSigner } from "../ts/utils";
import { Hasher } from "../typechain-types";

describe("Hasher", () => {
  let hasherContract: Hasher;

  before(async () => {
    const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
      await deployPoseidonContracts(await getDefaultSigner(), {}, true);
    const [poseidonT3ContractAddress, poseidonT4ContractAddress, poseidonT5ContractAddress, poseidonT6ContractAddress] =
      await Promise.all([
        PoseidonT3Contract.getAddress(),
        PoseidonT4Contract.getAddress(),
        PoseidonT5Contract.getAddress(),
        PoseidonT6Contract.getAddress(),
      ]);
    // Link Poseidon contracts
    const hasherContractFactory = await linkPoseidonLibraries(
      "Hasher",
      poseidonT3ContractAddress,
      poseidonT4ContractAddress,
      poseidonT5ContractAddress,
      poseidonT6ContractAddress,
      await getDefaultSigner(),
      true,
    );

    hasherContract = (await hasherContractFactory.deploy()) as Hasher;
    await hasherContract.deploymentTransaction()?.wait();
  });

  it("maci-crypto.sha256Hash should match hasher.sha256Hash", async () => {
    const values: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      values.push(genRandomSalt().toString());
      const hashed = sha256Hash(values.map(BigInt));

      // eslint-disable-next-line no-await-in-loop
      const onChainHash = await hasherContract.sha256Hash(values);
      expect(onChainHash.toString()).to.eq(hashed.toString());
    }
  });

  it("maci-crypto.hashLeftRight should match hasher.hashLeftRight", async () => {
    const left = genRandomSalt();
    const right = genRandomSalt();
    const hashed = hashLeftRight(left, right);

    const onChainHash = await hasherContract.hashLeftRight(left.toString(), right.toString());
    expect(onChainHash.toString()).to.eq(hashed.toString());
  });

  it("maci-crypto.hash3 should match hasher.hash3", async () => {
    const values: BigNumberish[] = [];
    for (let i = 0; i < 3; i += 1) {
      values.push(genRandomSalt().toString());
    }
    const hashed = hash3(values.map(BigInt));

    const onChainHash = await hasherContract.hash3(values as [BigNumberish, BigNumberish, BigNumberish]);
    expect(onChainHash.toString()).to.eq(hashed.toString());
  });

  it("maci-crypto.hash4 should match hasher.hash4", async () => {
    const values: BigNumberish[] = [];

    for (let i = 0; i < 4; i += 1) {
      values.push(genRandomSalt().toString());
    }
    const hashed = hash4(values.map(BigInt));

    const onChainHash = await hasherContract.hash4(values as [BigNumberish, BigNumberish, BigNumberish, BigNumberish]);
    expect(onChainHash.toString()).to.eq(hashed.toString());
  });

  it("maci-crypto.hash5 should match hasher.hash5", async () => {
    const values: BigNumberish[] = [];

    for (let i = 0; i < 5; i += 1) {
      values.push(genRandomSalt().toString());
    }
    const hashed = hash5(values.map(BigInt));

    const onChainHash = await hasherContract.hash5(
      values as [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    );
    expect(onChainHash.toString()).to.eq(hashed.toString());
  });
});
