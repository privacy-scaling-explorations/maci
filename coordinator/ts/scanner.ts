// Getting events
// https://github.com/ethers-io/ethers.js/issues/463

import * as maciContractDef from "maci-contracts/compiled/MACI.json";
import { ethers } from "ethers";
import { getContractAddresses } from "./settings";

import { decrypt, decryptAndVerify } from "maci-crypto";
import { createMerkleTree } from "maci-crypto/build/merkleTree";
import {
  ganacheConfig,
  coordinatorConfig,
  merkleTreeConfig
} from "maci-config";

const contractAddresses = getContractAddresses();

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(ganacheConfig.privateKey, provider);
const maciContract = new ethers.Contract(
  contractAddresses.MACI_CONTRACT_ADDRESS,
  maciContractDef.abi,
  wallet
);

const coordinatorPrivateKey = BigInt(coordinatorConfig.privateKey);

// Filter sign up events
const signUpFilter = maciContract.filters.SignedUp();
signUpFilter.fromBlock = 0;
signUpFilter.toBlock = "latest";

// Filter command published events
const commandPublishedFilter = maciContract.filters.CommandPublished();
commandPublishedFilter.fromBlock = 0;
commandPublishedFilter.toBlock = "latest";

// Get events
const main = async () => {
  // Get sign up logs
  const signUpLogsRaw = await provider.getLogs(signUpFilter);
  const signUpLogs = signUpLogsRaw.map(x => maciContract.interface.parseLog(x));

  // Get command published logs
  const commandPublishedLogsRaw = await provider.getLogs(
    commandPublishedFilter
  );
  const commandPublishedLogs = commandPublishedLogsRaw.map(x =>
    maciContract.interface.parseLog(x)
  );

  // Our merkleTrees
  const cmdTree = createMerkleTree(
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  );
  const stateTree = createMerkleTree(
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  );

  // Initialize state trees
  signUpLogs.forEach(signUpLog => {
    const encryptedMessage = signUpLog.values.encryptedMessage.map(x =>
      BigInt(x.toString())
    );
    const ecdhPublicKey = signUpLog.values.ecdhPublicKey.map(x =>
      BigInt(x.toString())
    );
    const hashedEncryptedMessage = BigInt(
      signUpLog.values.hashedEncryptedMessage.toString()
    );
    const newTreeRoot = signUpLog.values.newCmdTreeRoot.toString();

    // Decrypt values and verifier signer
    const decryptedMessage = decrypt(
      encryptedMessage,
      coordinatorPrivateKey,
      ecdhPublicKey
    );
    const signerPublicKey = decryptedMessage.slice(0, 2);
    const validSignature = decryptAndVerify(
      encryptedMessage,
      signerPublicKey,
      coordinatorPrivateKey,
      ecdhPublicKey
    );

    // If its not a valid signature
    // Ignore the vote count in SNARK
    // Not here
    if (!validSignature) {
      console.log("Invalid signature!");
    }

    // Insert into the merkletrees
    cmdTree.insert(hashedEncryptedMessage);

    stateTree.insert(hashedEncryptedMessage, decryptedMessage.slice(0, 3));

    if (cmdTree.root.toString() !== newTreeRoot) {
      throw new Error(
        "Invalid tree root - cmdTree does not match new tree root!"
      );
    }
  });

  // Voting process begins
  commandPublishedLogs.forEach(commandPublishedLog => {
    const encryptedMessage = commandPublishedLog.values.encryptedMessage.map(
      x => BigInt(x.toString())
    );
    const ecdhPublicKey = commandPublishedLog.values.ecdhPublicKey.map(x =>
      BigInt(x.toString())
    );
    const hashedEncryptedMessage = BigInt(
      commandPublishedLog.values.hashedEncryptedMessage.toString()
    );
    const newTreeRoot = commandPublishedLog.values.newCmdTreeRoot.toString();

    const decryptedMessage = decrypt(
      encryptedMessage,
      coordinatorPrivateKey,
      ecdhPublicKey
    );

    // Get user index
    const userIndex = Number(decryptedMessage.slice(0, 1));

    // Make sure user index is <= stateTree.leaves.length
    if (userIndex < stateTree.leavesRaw.length) {
      // Always use existing public key in tree to validate
      const signerPublicKey = stateTree.leavesRaw[userIndex].slice(0, 2);

      const validSignature = decryptAndVerify(
        encryptedMessage,
        signerPublicKey,
        coordinatorPrivateKey,
        ecdhPublicKey
      );

      if (validSignature) {
        console.log("Valid signature!");
        // Only update state tree if valid signature
        stateTree.update(
          userIndex,
          hashedEncryptedMessage,
          decryptedMessage.slice(1, 4) // don't wanna store user index
        );
      }
    }

    cmdTree.insert(hashedEncryptedMessage);

    if (cmdTree.root.toString() !== newTreeRoot) {
      throw new Error(
        "Invalid tree root - cmdTree does not match new tree root!"
      );
    }
  });
};

main();
