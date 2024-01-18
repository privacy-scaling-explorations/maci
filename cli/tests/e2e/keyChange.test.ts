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
    pollId: 0,
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
    await deployVkRegistryContract(true);
    // we set the verifying keys
    await setVerifyingKeys(setVerifyingKeysArgs);
  });

  describe("keyChange and new vote (new vote has same nonce)", () => {
    after(() => {
      cleanVanilla();
    });

    const keypair1 = new Keypair();
    const keypair2 = new Keypair();
    const initialNonce = 1;
    const initialVoteOption = 0;
    const initialVoteAmount = 9;
    const pollId = 0;
    let stateIndex = 0;
    const expectedTally = initialVoteAmount - 1;
    const expectedPerVoteOptionTally = (initialVoteAmount - 1) ** 2;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = Number.parseInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }), 10);
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
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
        newVoteWeight: initialVoteAmount - 1,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
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
    const initialNonce = 1;
    const initialVoteOption = 0;
    const initialVoteAmount = 9;
    const pollId = 0;
    let stateIndex = 0;
    const expectedTally = initialVoteAmount;
    const expectedPerVoteOptionTally = initialVoteAmount ** 2;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = Number.parseInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }), 10);
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 1,
        nonce: initialNonce + 1,
        pollId,
        newVoteWeight: initialVoteAmount - 1,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
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
    const initialNonce = 1;
    const initialVoteOption = 0;
    const initialVoteAmount = 9;
    const pollId = 0;
    let stateIndex = 0;
    const expectedTally = initialVoteAmount - 3;
    const expectedPerVoteOptionTally = (initialVoteAmount - 3) ** 2;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(deployArgs);
      // deploy a poll contract
      await deployPoll(deployPollArgs);
      stateIndex = Number.parseInt(await signup({ maciPubKey: keypair1.pubKey.serialize() }), 10);
      await publish({
        pubkey: keypair1.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should publish a message to change the user maci key, and a new vote", async () => {
      await publish({
        pubkey: keypair2.pubKey.serialize(),
        stateIndex,
        voteOptionIndex: initialVoteOption + 2,
        nonce: initialNonce,
        pollId,
        newVoteWeight: initialVoteAmount - 3,
        maciContractAddress: maciAddresses.maciAddress,
        salt: genRandomSalt().toString(),
        privateKey: keypair1.privKey.serialize(),
      });
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
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
