import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import {
  sha256Hash,
  hashLeftRight,
  hash1,
  hash2,
  hash3,
  hash4,
  hash5,
  hash6,
  genRandomSalt,
} from "maci-crypto";
import {
  Factory,
  PoseidonT2,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  PoseidonT7,
} from "../typechain-types";
const { buildPoseidon } = require('circomlibjs');

// salt for `create2` opcode of EVM
const salt =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

// Same function of `scripts.deploy.ts`
// Declare here again to avoid nonce too low failure
const deployChildContracts = async (): Promise<{
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}> => {
  const _poseidonT2 = artifacts.readArtifactSync("PoseidonT2");
  const _poseidonT3 = artifacts.readArtifactSync("PoseidonT3");
  const _poseidonT4 = artifacts.readArtifactSync("PoseidonT4");
  const _poseidonT5 = artifacts.readArtifactSync("PoseidonT5");
  const _poseidonT6 = artifacts.readArtifactSync("PoseidonT6");
  const _poseidonT7 = artifacts.readArtifactSync("PoseidonT7");

  const PoseidonT2ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT2
  );
  const PoseidonT3ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT3
  );
  const PoseidonT4ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT4
  );
  const PoseidonT5ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT5
  );
  const PoseidonT6ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT6
  );
  const PoseidonT7ContractFactory = await ethers.getContractFactoryFromArtifact(
    _poseidonT7
  );

  const poseidonT2 = await PoseidonT2ContractFactory.deploy();
  const poseidonT3 = await PoseidonT3ContractFactory.deploy();
  const poseidonT4 = await PoseidonT4ContractFactory.deploy();
  const poseidonT5 = await PoseidonT5ContractFactory.deploy();
  const poseidonT6 = await PoseidonT6ContractFactory.deploy();
  const poseidonT7 = await PoseidonT7ContractFactory.deploy();

  return {
    poseidonT2,
    poseidonT3,
    poseidonT4,
    poseidonT5,
    poseidonT6,
    poseidonT7,
  };
};

const deployParentContractFactory = async (childContracts: {
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}): Promise<Factory> => {
  const contractFactory = await ethers.getContractFactory("Factory", {
    libraries: {
      PoseidonT2: childContracts.poseidonT2.address,
      PoseidonT3: childContracts.poseidonT3.address,
      PoseidonT4: childContracts.poseidonT4.address,
      PoseidonT5: childContracts.poseidonT5.address,
      PoseidonT6: childContracts.poseidonT6.address,
      PoseidonT7: childContracts.poseidonT7.address,
    },
  });

  const factoryContract = await contractFactory.deploy();
  return factoryContract;
};

const deployParentContract = async (childContracts: {
  poseidonT2: PoseidonT2;
  poseidonT3: PoseidonT3;
  poseidonT4: PoseidonT4;
  poseidonT5: PoseidonT5;
  poseidonT6: PoseidonT6;
  poseidonT7: PoseidonT7;
}) => {
  const factoryContract = await deployParentContractFactory(childContracts);

  await factoryContract.deploy(salt);

  const hasherAddress = await factoryContract.hasherAddress();
  const hasherContract = await ethers.getContractAt("Hasher", hasherAddress);
  return hasherContract;
};

describe("Poseidon", function () {
  let childContracts: {
    poseidonT2: PoseidonT2;
    poseidonT3: PoseidonT3;
    poseidonT4: PoseidonT4;
    poseidonT5: PoseidonT5;
    poseidonT6: PoseidonT6;
    poseidonT7: PoseidonT7;
  };
  let hasherContract: any;
  let poseidon: any;

  this.beforeAll(async () => {
    childContracts = await loadFixture(deployChildContracts);
    hasherContract = await deployParentContract(childContracts);
    poseidon = await buildPoseidon();
  });

  // See https://github.com/privacy-scaling-explorations/poseidon_in_circomlib_check
  describe("Poseidon functionality", function () {
    it("T2 - [1]", async function () {
      expect((await childContracts.poseidonT2.poseidon(["1"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1"]))
      );
    });

    it("T3 - [1, 2]", async function () {
      expect((await childContracts.poseidonT3.poseidon(["1", "2"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2"]))
      );
    });

    it("T4 - [1, 2, 3]", async function () {
      expect((await childContracts.poseidonT4.poseidon(["1", "2", "3"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3"]))
      );
    });

    it("T5 - [1, 2, 3, 4]", async function () {
      expect(
        (await childContracts.poseidonT5.poseidon(["1", "2", "3", "4"])).toString()
      ).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3", "4"]))
      );
    });

    it("T6 - [1, 2, 3, 4, 5]", async function () {
      expect(
        (await childContracts.poseidonT6.poseidon(["1", "2", "3", "4", "5"])).toString()
      ).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3", "4", "5"]))
      );
    });

    it("T7 - [1, 2, 3, 4, 5, 6]", async function () {
      expect(
        (await childContracts.poseidonT7.poseidon(["1", "2", "3", "4", "5", "6"])).toString()
      ).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3", "4", "5", "6"]))
      );
    });
  });

  describe("Ensure Poseidon is working while using contract deployment pattern", function () {
    // `Hasher` contract of `contracts/poseidon.sol`
    it("Call libraries via Hasher contract", async function () {
      expect((await hasherContract.hash2(["1", "2"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2"]))
      );

      expect((await hasherContract.hash4(["1", "2", "3", "4"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3", "4"]))
      );
    });

    describe("Compare the results of maci-crypto", function () {
      it("maci-crypto.sha256Hash should match hasher.sha256Hash", async () => {
        const values: string[] = [];
        for (let i = 0; i < 5; i++) {
          values.push(genRandomSalt().toString());
          const hashed = sha256Hash(values.map(BigInt));

          const onChainHash = await hasherContract.sha256Hash(values);
          expect(onChainHash.toString()).to.equal(hashed.toString());
        }
      });

      it("maci-crypto.hashLeftRight should match hasher.hashLeftRight", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();
        const hashed = hashLeftRight(left, right);

        const onChainHash = await hasherContract.hashLeftRight(
          left.toString(),
          right.toString()
        );
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash1 should match hasher.hash1", async function () {
        const values: string[] = [];
        for (let i = 0; i < 1; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash1(values.map(BigInt));

        const onChainHash = await hasherContract.hash1(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash2 should match hasher.hash2", async function () {
        const values: string[] = [];
        for (let i = 0; i < 2; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash2(values.map(BigInt));

        const onChainHash = await hasherContract.hash2(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash3 should match hasher.hash3", async function () {
        const values: string[] = [];
        for (let i = 0; i < 3; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash3(values.map(BigInt));

        const onChainHash = await hasherContract.hash3(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash4 should match hasher.hash4", async function () {
        const values: string[] = [];
        for (let i = 0; i < 4; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash4(values.map(BigInt));

        const onChainHash = await hasherContract.hash4(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash5 should match hasher.hash5", async function () {
        const values: string[] = [];
        for (let i = 0; i < 5; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash5(values.map(BigInt));

        const onChainHash = await hasherContract.hash5(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });

      it("maci-crypto.hash6 should match hasher.hash6", async function () {
        const values: string[] = [];
        for (let i = 0; i < 6; i++) {
          values.push(genRandomSalt().toString());
        }
        const hashed = hash6(values.map(BigInt));

        const onChainHash = await hasherContract.hash6(values);
        expect(onChainHash.toString()).to.equal(hashed.toString());
      });
    });

    let expectedParentAddress: string;
    it("Case 1: Sequential deploy of Hasher contract", async function () {
      const childContracts = await loadFixture(deployChildContracts);
      const parentContract = await deployParentContract(childContracts);

      expectedParentAddress = parentContract.address;

      expect((await parentContract.hash2(["1", "2"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2"]))
      );

      expect((await parentContract.hash4(["1", "2", "3", "4"])).toString()).to.equal(
        poseidon.F.toString(poseidon(["1", "2", "3", "4"]))
      );
    });

    // Ensure `create2` works fine
    it("Ensure Hasher contract address is same even if there is a transaction in between contract deployment", async function () {
      const signers = await ethers.getSigners();
      const childContracts = await loadFixture(deployChildContracts);

      const factoryContract = await deployParentContractFactory(childContracts);

      const nonceBefore = await signers[0].getTransactionCount("latest");
      // send tx to increase nonce
      await signers[0].sendTransaction({
        to: "0x0000000000000000000000000000000000000000",
        value: ethers.utils.parseEther("1"),
      });
      const nonceAfter = await signers[0].getTransactionCount("latest");
      // Check that nonce increase correctly 
      expect(nonceBefore + 1).to.equal(nonceAfter);

      await factoryContract.deploy(salt);

      const hasherAddress = await factoryContract.hasherAddress();

      expect(hasherAddress).to.equal(expectedParentAddress);
    });
  });
});
