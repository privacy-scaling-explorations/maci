import { expect } from "chai";
import { BigNumberish } from "ethers";
import { genRandomSalt } from "maci-crypto";

import { deployPoseidonContracts, linkPoseidonLibraries } from "../ts/deploy";
import { getDefaultSigner } from "../ts/utils";
import { HasherBenchmarks } from "../typechain-types";

describe("Hasher", () => {
  let hasherContract: HasherBenchmarks;
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
      "HasherBenchmarks",
      poseidonT3ContractAddress,
      poseidonT4ContractAddress,
      poseidonT5ContractAddress,
      poseidonT6ContractAddress,
      await getDefaultSigner(),
      true,
    );

    hasherContract = (await hasherContractFactory.deploy()) as HasherBenchmarks;
    await hasherContract.deploymentTransaction()?.wait();
  });

  it("hashLeftRight", async () => {
    const left = genRandomSalt();
    const right = genRandomSalt();

    const result = await hasherContract
      .hashLeftRightBenchmark(left.toString(), right.toString())
      .then((res) => Number(res));

    expect(result).to.not.eq(null);
  });

  it("hash5", async () => {
    const values = [];

    for (let i = 0; i < 5; i += 1) {
      values.push(genRandomSalt().toString());
    }

    const result = await hasherContract
      .hash5Benchmark(values as [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish])
      .then((res) => Number(res));

    expect(result).to.not.eq(null);
  });
});
