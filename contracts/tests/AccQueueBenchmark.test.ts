import { expect } from "chai";
import { AccQueue, NOTHING_UP_MY_SLEEVE } from "maci-crypto";

import { deployPoseidonContracts, linkPoseidonLibraries } from "../ts/deploy";
import { getDefaultSigner } from "../ts/utils";
import { AccQueue as AccQueueContract } from "../typechain-types";

let aqContract: AccQueueContract;

const deploy = async (contractName: string, SUB_DEPTH: number, HASH_LENGTH: number, ZERO: bigint) => {
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
  const AccQueueFactory = await linkPoseidonLibraries(
    contractName,
    poseidonT3ContractAddress,
    poseidonT4ContractAddress,
    poseidonT5ContractAddress,
    poseidonT6ContractAddress,
    await getDefaultSigner(),
    true,
  );

  aqContract = (await AccQueueFactory.deploy(SUB_DEPTH)) as typeof aqContract;

  await aqContract.deploymentTransaction()?.wait();

  const aq = new AccQueue(SUB_DEPTH, HASH_LENGTH, ZERO);
  return { aq, aqContract };
};

const testMerge = async (
  aq: AccQueue,
  contract: AccQueueContract,
  NUM_SUBTREES: number,
  MAIN_DEPTH: number,
  NUM_MERGES: number,
) => {
  for (let i = 0; i < NUM_SUBTREES; i += 1) {
    const leaf = BigInt(123);
    // eslint-disable-next-line no-await-in-loop
    await contract.enqueue(leaf.toString(), { gasLimit: 200000 }).then((tx) => tx.wait());

    aq.enqueue(leaf);
    aq.fill();

    // eslint-disable-next-line no-await-in-loop
    await contract.fill({ gasLimit: 2000000 }).then((t) => t.wait());
  }

  if (NUM_MERGES === 0) {
    aq.mergeSubRoots(NUM_MERGES);
    const tx = await contract.mergeSubRoots(NUM_MERGES, { gasLimit: 8000000 });
    const receipt = await tx.wait();

    expect(receipt).to.not.eq(null);
    expect(receipt?.gasUsed.toString()).to.not.eq("");
    expect(receipt?.gasUsed.toString()).to.not.eq("0");
  } else {
    for (let i = 0; i < NUM_MERGES; i += 1) {
      const n = NUM_SUBTREES / NUM_MERGES;
      aq.mergeSubRoots(n);
      // eslint-disable-next-line no-await-in-loop
      const receipt = await contract.mergeSubRoots(n, { gasLimit: 8000000 }).then((tx) => tx.wait());

      expect(receipt).to.not.eq(null);
      expect(receipt?.gasUsed.toString()).to.not.eq("");
      expect(receipt?.gasUsed.toString()).to.not.eq("0");
    }
  }

  const expectedSmallSRTroot = aq.getSmallSRTroot();

  const contractSmallSRTroot = await contract.getSmallSRTroot();

  expect(expectedSmallSRTroot.toString()).to.eq(contractSmallSRTroot.toString());

  aq.merge(MAIN_DEPTH);
  const receipt = await contract.merge(MAIN_DEPTH, { gasLimit: 8000000 }).then((tx) => tx.wait());

  expect(receipt).to.not.eq(null);
  expect(receipt?.gasUsed.toString()).to.not.eq("");
  expect(receipt?.gasUsed.toString()).to.not.eq("0");

  const expectedMainRoot = aq.getMainRoots()[MAIN_DEPTH];
  const contractMainRoot = await contract.getMainRoot(MAIN_DEPTH);

  expect(expectedMainRoot.toString()).to.eq(contractMainRoot.toString());
};

const testOneShot = async (aq: AccQueue, contract: AccQueueContract, NUM_SUBTREES: number, MAIN_DEPTH: number) => {
  await testMerge(aq, contract, NUM_SUBTREES, MAIN_DEPTH, 0);
};

const testMultiShot = async (
  aq: AccQueue,
  contract: AccQueueContract,
  NUM_SUBTREES: number,
  MAIN_DEPTH: number,
  NUM_MERGES: number,
) => {
  await testMerge(aq, contract, NUM_SUBTREES, MAIN_DEPTH, NUM_MERGES);
};

describe("AccQueue gas benchmarks", () => {
  describe("Binary enqueues", () => {
    const SUB_DEPTH = 3;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    before(async () => {
      const r = await deploy("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract;
    });

    it(`should enqueue to a subtree of depth ${SUB_DEPTH}`, async () => {
      for (let i = 0; i < HASH_LENGTH ** SUB_DEPTH; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const receipt = await aqContract.enqueue(i, { gasLimit: 400000 }).then((tx) => tx.wait());

        expect(receipt).to.not.eq(null);
        expect(receipt?.gasUsed.toString()).to.not.eq("");
        expect(receipt?.gasUsed.toString()).to.not.eq("0");
      }
    });
  });

  describe("Binary fills", () => {
    const SUB_DEPTH = 3;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    before(async () => {
      const r = await deploy("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract;
    });

    it(`should fill to a subtree of depth ${SUB_DEPTH}`, async () => {
      for (let i = 0; i < 2; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await aqContract.enqueue(i, { gasLimit: 800000 }).then((tx) => tx.wait());
        // eslint-disable-next-line no-await-in-loop
        const receipt = await aqContract.fill({ gasLimit: 800000 }).then((tx) => tx.wait());

        expect(receipt).to.not.eq(null);
        expect(receipt?.gasUsed.toString()).to.not.eq("");
        expect(receipt?.gasUsed.toString()).to.not.eq("0");
      }
    });
  });

  describe("Quinary enqueues", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    before(async () => {
      const r = await deploy("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract;
    });

    it(`should enqueue to a subtree of depth ${SUB_DEPTH}`, async () => {
      for (let i = 0; i < HASH_LENGTH ** SUB_DEPTH; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const receipt = await aqContract.enqueue(i, { gasLimit: 800000 }).then((tx) => tx.wait());

        expect(receipt).to.not.eq(null);
        expect(receipt?.gasUsed.toString()).to.not.eq("");
        expect(receipt?.gasUsed.toString()).to.not.eq("0");
      }
    });
  });

  describe("Quinary fills", () => {
    const SUB_DEPTH = 2;
    const HASH_LENGTH = 5;
    const ZERO = NOTHING_UP_MY_SLEEVE;
    before(async () => {
      const r = await deploy("AccQueueQuinaryMaci", SUB_DEPTH, HASH_LENGTH, ZERO);
      aqContract = r.aqContract;
    });

    it(`should fill a subtree of depth ${SUB_DEPTH}`, async () => {
      for (let i = 0; i < 2; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await aqContract.enqueue(i, { gasLimit: 800000 }).then((tx) => tx.wait());
        // eslint-disable-next-line no-await-in-loop
        const receipt = await aqContract.fill({ gasLimit: 800000 }).then((tx) => tx.wait());

        expect(receipt).to.not.eq(null);
        expect(receipt?.gasUsed.toString()).to.not.eq("");
        expect(receipt?.gasUsed.toString()).to.not.eq("0");
      }
    });
  });

  describe("Binary AccQueue0 one-shot merge", () => {
    const SUB_DEPTH = 4;
    const MAIN_DEPTH = 32;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 32;
    let aq: AccQueue;
    before(async () => {
      const r = await deploy("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract;
    });

    it(`should merge ${NUM_SUBTREES} subtrees`, async () => {
      await testOneShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH);
    });
  });

  describe("Binary AccQueue0 multi-shot merge", () => {
    const SUB_DEPTH = 4;
    const MAIN_DEPTH = 32;
    const HASH_LENGTH = 2;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 32;
    const NUM_MERGES = 4;
    let aq: AccQueue;
    before(async () => {
      const r = await deploy("AccQueueBinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract;
    });

    it(`should merge ${NUM_SUBTREES} subtrees in ${NUM_MERGES}`, async () => {
      await testMultiShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH, NUM_MERGES);
    });
  });

  describe("Quinary AccQueue0 one-shot merge", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 32;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 25;
    let aq: AccQueue;
    before(async () => {
      const r = await deploy("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract;
    });

    it(`should merge ${NUM_SUBTREES} subtrees`, async () => {
      await testOneShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH);
    });
  });

  describe("Quinary AccQueue0 multi-shot merge", () => {
    const SUB_DEPTH = 2;
    const MAIN_DEPTH = 32;
    const HASH_LENGTH = 5;
    const ZERO = BigInt(0);
    const NUM_SUBTREES = 20;
    const NUM_MERGES = 4;
    let aq: AccQueue;

    before(async () => {
      const r = await deploy("AccQueueQuinary0", SUB_DEPTH, HASH_LENGTH, ZERO);
      aq = r.aq;
      aqContract = r.aqContract;
    });

    it(`should merge ${NUM_SUBTREES} subtrees in ${NUM_MERGES}`, async () => {
      await testMultiShot(aq, aqContract, NUM_SUBTREES, MAIN_DEPTH, NUM_MERGES);
    });
  });
});
