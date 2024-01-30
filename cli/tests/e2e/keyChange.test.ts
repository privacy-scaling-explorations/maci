import { expect } from "chai";
import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import fs from "fs";

import { DeployedContracts, TallyData } from "../../ts";
import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genProofs,
  mergeMessages,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  verify,
} from "../../ts/commands";
import { GenProofsArgs } from "../../ts/utils";
import {
  coordinatorPrivKey,
  deployArgs,
  deployPollArgs,
  processMessageTestZkeyPath,
  mergeMessagesArgs,
  mergeSignupsArgs,
  setVerifyingKeysArgs,
  tallyVotesTestZkeyPath,
  testProcessMessagesWasmPath,
  testProcessMessagesWitnessDatPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessDatPath,
  testTallyVotesWitnessPath,
  proveOnChainArgs,
  verifyArgs,
  timeTravelArgs,
} from "../constants";
import { cleanVanilla, isArm } from "../utils";

describe("keyChange tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;

  deployPollArgs.pollDuration = 90;

  const genProofsArgs: GenProofsArgs = {
    outputDir: testProofsDirPath,
    tallyFile: testTallyFilePath,
    tallyZkey: tallyVotesTestZkeyPath,
    processZkey: processMessageTestZkeyPath,
    pollId: 0n,
    rapidsnark: testRapidsnarkPath,
    processWitgen: testProcessMessagesWitnessPath,
    processDatFile: testProcessMessagesWitnessDatPath,
    tallyWitgen: testTallyVotesWitnessPath,
    tallyDatFile: testTallyVotesWitnessDatPath,
    coordinatorPrivKey,
    processWasm: testProcessMessagesWasmPath,
    tallyWasm: testTallyVotesWasmPath,
    useWasm,
  };

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    // we deploy the vk registry contract
    await deployVkRegistryContract({});
    // we set the verifying keys
    await setVerifyingKeys(setVerifyingKeysArgs);
  });

  describe("keyChange and new vote (new vote has same nonce)", () => {
    after(() => {
      cleanVanilla();
    });

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount - 1n;
    const expectedPerVoteOptionTally = (initialVoteAmount - 1n) ** 2n;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = BigInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }));
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(timeTravelArgs);
      await mergeMessages(mergeMessagesArgs);
      await mergeSignups(mergeSignupsArgs);
      await genProofs(genProofsArgs);
      await proveOnChain(proveOnChainArgs);
      await verify(verifyArgs);
    });

    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(fs.readFileSync(testTallyFilePath).toString()) as TallyData;
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has greater nonce and different vote option)", () => {
    after(() => {
      cleanVanilla();
    });

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount;
    const expectedPerVoteOptionTally = initialVoteAmount ** 2n;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = BigInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }));
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 1n,
        nonce: initialNonce + 1n,
        pollId,
        newVoteWeight: initialVoteAmount - 1n,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(timeTravelArgs);
      await mergeMessages(mergeMessagesArgs);
      await mergeSignups(mergeSignupsArgs);
      await genProofs(genProofsArgs);
      await proveOnChain(proveOnChainArgs);
      await verify(verifyArgs);
    });

    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(fs.readFileSync(testTallyFilePath).toString()) as TallyData;
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has same nonce and different vote option)", () => {
    after(() => {
      cleanVanilla();
    });

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
    const initialNonce = 1n;
    const initialVoteOption = 0n;
    const initialVoteAmount = 9n;
    const pollId = 0n;
    let stateIndex = 0n;
    const expectedTally = initialVoteAmount - 3n;
    const expectedPerVoteOptionTally = (initialVoteAmount - 3n) ** 2n;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = BigInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }));
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should publish a message to change the user maci key, and a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 2n,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 3n,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(timeTravelArgs);
      await mergeMessages(mergeMessagesArgs);
      await mergeSignups(mergeSignupsArgs);
      await genProofs(genProofsArgs);
      await proveOnChain(proveOnChainArgs);
      await verify(verifyArgs);
    });

    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(fs.readFileSync(testTallyFilePath).toString()) as TallyData;
      expect(tallyData.results.tally[2]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[2]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });
});
