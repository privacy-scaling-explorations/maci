import { task } from "hardhat/config";
import { Contract } from "ethers";
import { verifyPoseidonContracts } from "./utils";
import { writeFileSync } from "fs";

// Check if tnArray contains only T2 to T7
const onlyContainsT2toT7 = (value) =>
  ["T2", "T3", "T4", "T5", "T6", "T7"].includes(value);

task("deploy-poseidon:EOA", "Deploy Poseidon Contracts by EOA")
  .addOptionalVariadicPositionalParam(
    "tnArray",
    "Kind of Poseidon contracts which want to be deployed (T2 to T7)"
  )
  .addOptionalParam(
    "output",
    "write deployed contract address(es) to given path"
  )
  .setAction(async ({ tnArray, output }, { ethers }) => {
    const TNs = [];

    switch (typeof tnArray) {
      case "object":
        if (!tnArray.every(onlyContainsT2toT7)) {
          throw new Error(
            `received wrong value of TN: ${tnArray}. Only values between T2~T7 could be deployed`
          );
        }

        // Ensure no duplicate TN
        const set = new Set(tnArray);
        if (tnArray.length != set.size) {
          throw new Error(`Duplicate TNs are not allowed: ${tnArray}`);
        }

        for (const TN of tnArray) {
          const T = TN.charAt(1);
          TNs.push(T);
        }
        break;

      default:
        for (let T = 2; T <= 7; T++) {
          TNs.push(T);
        }
    }

    const poseidonAddressBook = new Map();
    for (const TN of TNs) {
      try {
        const factory = await ethers.getContractFactory(`PoseidonT${TN}`);
        const contract = await factory.deploy();
        const address = contract.address;

        console.log(`PoseidonT${TN} deployed: ${address}`);

        poseidonAddressBook.set(`T${TN}`, address);
      } catch (e) {
        throw new Error(`failed to deploy contract: PoseidonT${TN} \n` + e);
      }
    }

    if (output) {
      // `contents` follows TOML syntax
      const contents = `[poseidonAddresses]
  T2 = "${poseidonAddressBook.get("T2")}"
  T3 = "${poseidonAddressBook.get("T3")}"
  T4 = "${poseidonAddressBook.get("T4")}"
  T5 = "${poseidonAddressBook.get("T5")}"
  T6 = "${poseidonAddressBook.get("T6")}"
  T7 = "${poseidonAddressBook.get("T7")}"`;

      writeFileSync(output, contents);
    }

    return poseidonAddressBook;
  });

task(
  "deploy-poseidon:callPoseidonFactory",
  "Deploy Poseidon Contract(s) by calling poseidonFactory"
)
  .addVariadicPositionalParam(
    "tnArray",
    "Kind of Poseidon contracts which want to be deployed (T2 to T7)"
  )
  .addParam(
    "factoryAddress",
    "An address of poseidonFactory provides multicall"
  )
  .addParam(
    "salt",
    "32-bytes long hexstring used to determine contract address"
  )
  .setAction(async ({ tnArray, factoryAddress, salt }, { ethers }) => {
    if (!tnArray.every(onlyContainsT2toT7)) {
      throw new Error(
        `received wrong value of TN: ${tnArray}. Only values between T2~T7 could be deployed`
      );
    }

    // Ensure no duplicate TN
    const set = new Set(tnArray);
    if (tnArray.length != set.size) {
      throw new Error(`Duplicate TNs are not allowed: ${tnArray}`);
    }

    const poseidonFactory: Contract = await ethers.getContractAt(
      "PoseidonFactory",
      factoryAddress
    );

    const calls = [];
    const poseidonAddressBook = new Map();
    try {
      for (const tn of tnArray) {
        // Calculate poseidon contract(s) address to be deployed
        const address = await poseidonFactory[`determinePoseidon${tn}`](salt);
        poseidonAddressBook.set(`${tn}`, address);

        // packing contract creation call(s) into an array
        const call = poseidonFactory.interface.encodeFunctionData(
          `deployPoseidon${tn}`,
          [salt]
        );
        calls.push(call);
      }
    } catch (e) {
      throw new Error("failed to call poseidonFactory: \n" + e);
    }

    try {
      // deploy contracts
      const results = await poseidonFactory.multicall(calls);
      console.log("multicall result: " + JSON.stringify(results));
    } catch (e) {
      throw new Error(
        "failed to process multicall. Contracts had not been deployed. Maybe salt has been already used to deploy poseidon: \n" +
          e
      );
    }

    // Verify contracts of given address could calculate hash correctly
    // by comparing its hashed value to reference implementation of `circomlibjs` (https://github.com/iden3/circomlibjs)
    try {
      await verifyPoseidonContracts(poseidonAddressBook);
    } catch (e) {
      throw new Error("failed to verify given Poseidon contracts: \n" + e);
    }

    console.log("\n\n Poseidon contracts are successfully deployed! \n\n");
    console.log("Contract addresses deployed by multicall: ", [
      ...poseidonAddressBook.entries(),
    ]);

    return poseidonAddressBook;
  });
