import chai, { expect } from "chai";
import hre from "hardhat";
import { writeFileSync, unlinkSync } from "fs";

import {
  genSalt,
  getAllSubsets,
  verifyPoseidonContracts,
} from "../tasks/utils";
import chaiAsPromised from "chai-as-promised";

const { buildPoseidonOpt } = require("circomlibjs");

chai.use(chaiAsPromised);

const deployPoseidonFactory = async (poseidonAddressBook: any) => {
  const poseidonAddressBookFilePath = "./PoseidonAddressBook.test.toml";
  // `contents` follows TOML syntax
  const contents = `[poseidonAddresses]
      T2 = "${poseidonAddressBook.get("T2")}"
      T3 = "${poseidonAddressBook.get("T3")}"
      T4 = "${poseidonAddressBook.get("T4")}"
      T5 = "${poseidonAddressBook.get("T5")}"
      T6 = "${poseidonAddressBook.get("T6")}"
      T7 = "${poseidonAddressBook.get("T7")}"`;

  writeFileSync(poseidonAddressBookFilePath, contents);
  const factoryAddress = await hre.run("deploy-poseidonFactory", {
    poseidonAddressBookFilePath: poseidonAddressBookFilePath,
  });
  unlinkSync(poseidonAddressBookFilePath);

  return factoryAddress;
};

// Reference implementation: https://github.com/iden3/circomlibjs/blob/main/src/poseidon_opt.js
describe("Check Poseidon contracts", function () {
  let addressBook: any;
  let factoryAddress: any;

  this.beforeAll(async () => {
    await buildPoseidonOpt();
    addressBook = await hre.run("deploy-poseidon:EOA");
    factoryAddress = await deployPoseidonFactory(addressBook);
  });

  describe("Check Poseidon contracts deployed by EOA", function () {
    it("Verify  Poseidon T2, T3, ..., T7", async function () {
      await verifyPoseidonContracts(addressBook);
    });
  });

  describe("Check Poseidon contracts deployed by multicall", function () {
    const arr = ["T2", "T3", "T4", "T5", "T6", "T7"];
    const powerSet = getAllSubsets(arr);

    const saltMap = new Map();

    for (const set of powerSet) {
      if (set.length === 0) {
        continue;
      }

      it(`Deploy ${set} by multicall`, async function () {
        let salt = genSalt();
        while (saltMap.get(salt)) {
          salt = genSalt();
        }
        saltMap.set(salt, true);

        const addresses = await hre.run("deploy-poseidon:callPoseidonFactory", {
          tnArray: set,
          factoryAddress: factoryAddress,
          salt: salt,
        });

        await verifyPoseidonContracts(addresses);
      });
    }
  });

  describe("Catch failure cases", function () {
    it("Should not process T1", async function () {
      const salt = genSalt();

      const promise1 = hre.run("deploy-poseidon:EOA", {
        tnArray: ["T1"],
      });
      expect(promise1).to.eventually.throw();

      const promise2 = hre.run("deploy-poseidon:callPoseidonFactory", {
        tnArray: ["T1"],
        factoryAddress: factoryAddress,
        salt: salt,
      });
      expect(promise2).to.eventually.throw();
    });

    it("Should not process T8", async function () {
      const salt = genSalt();

      const promise1 = hre.run("deploy-poseidon:EOA", {
        tnArray: ["T8"],
      });
      expect(promise1).to.eventually.throw();

      const promise2 = hre.run("deploy-poseidon:callPoseidonFactory", {
        tnArray: ["T8"],
        factoryAddress: factoryAddress,
        salt: salt,
      });
      expect(promise2).to.eventually.throw();
    });

    it("No duplicate TNs: [T2, T2]", async function () {
      const promise1 = hre.run("deploy-poseidon:EOA", {
        tnArray: ["T2", "T2"],
      });
      expect(promise1).to.eventually.throw();

      const salt = genSalt();
      const promise2 = hre.run("deploy-poseidon:callPoseidonFactory", {
        tnArray: ["T2", "T2"],
        factoryAddress: factoryAddress,
        salt: salt,
      });
      expect(promise2).to.eventually.throw();
    });

    it("No duplicate TNs: [T6, T7, T6]", async function () {
      const promise1 = hre.run("deploy-poseidon:EOA", {
        tnArray: ["T6", "T7", "T6"],
      });
      expect(promise1).to.eventually.throw();

      const salt = genSalt();
      const promise2 = hre.run("deploy-poseidon:callPoseidonFactory", {
        tnArray: ["T6", "T7", "T6"],
        factoryAddress: factoryAddress,
        salt: salt,
      });
      expect(promise2).to.eventually.throw();
    });
  });
});
