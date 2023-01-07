import { task, subtask } from "hardhat/config";
import { Contract, ContractFactory } from "ethers";
import { readFileSync } from "fs";
import toml from "@ltd/j-toml";

import { verifyPoseidonContracts } from "./utils";

// # A example of poseidonAddressBookFile
//
// - file name: example.toml
//
// - contents:
// [poseidonAddresses]
// T2 = "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0"
// T3 = "0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da"
// T4 = "0x345cA3e014Aaf5dcA488057592ee47305D9B3e10"
// T5 = "0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF"
// T6 = "0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F"
// T7 = "0x9FBDa871d559710256a2502A2517b794B482Db40"
task("deploy-poseidonFactory", "Deploy a poseidonFactory contract")
  .addParam(
    "poseidonAddressBookFilePath",
    "A path for file which contains poseidon addresses written in TOML format"
  )
  .setAction(async ({ poseidonAddressBookFilePath }, { ethers, run }) => {
    const _factory: ContractFactory = await ethers.getContractFactory(
      "PoseidonFactory"
    );

    // `addresses` is an array of Poseidon contracts
    const addresses = await run("getposeidonAddressBook", {
      path: poseidonAddressBookFilePath,
    });

    const poseidonAddressBook = new Map();
    for (let TN = 2; TN <= 7; TN++) {
      const i = TN - 2;
      poseidonAddressBook.set(`T${TN}`, addresses[i]);
    }

    // Verify contracts of given address could calculate hash correctly
    // by comparing its hashed value to reference implementation of `circomlibjs` (https://github.com/iden3/circomlibjs)
    try {
      await verifyPoseidonContracts(poseidonAddressBook);
    } catch (e) {
      throw new Error("failed to verify given Poseidon contracts: \n" + e);
    }

    let poseidonFactory: Contract;
    try {
      poseidonFactory = await _factory.deploy(...addresses);
      console.log(`PoseidonFactory deployed: ${poseidonFactory.address}`);
    } catch (e) {
      throw new Error(`failed to deploy contract: PoseidonFactory \n` + e);
    }

    return poseidonFactory.address;
  });

subtask("getposeidonAddressBook")
  .addParam("path")
  .setAction(async ({ path }) => {
    try {
      const bookFile = readFileSync(path, "utf8");
      const book = toml.parse(bookFile);

      const addresses = Object.values(book.poseidonAddresses);
      return addresses;
    } catch (e) {
      throw new Error(
        `failed to get poseidon addresses. File could not read from path '${path}': \n` +
          e
      );
    }
  });
