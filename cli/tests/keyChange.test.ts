import { isArm } from "maci-circuits";
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
} from "../ts/commands";
import {
  INT_STATE_TREE_DEPTH,
  MSG_BATCH_DEPTH,
  MSG_TREE_DEPTH,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  coordinatorPrivKey,
  coordinatorPubKey,
  processMessageTestZkeyPath,
  tallyVotesTestZkeyPath,
  testProcessMessagesWasmPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessPath,
} from "./constants";
import { Keypair } from "maci-domainobjs";
import { cleanVanilla } from "./utils";
import { readFileSync } from "fs";
import { expect } from "chai";
import { genRandomSalt } from "maci-crypto";
import { DeployedContracts } from "../ts";

describe("keyChange tests", function () {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    // we deploy the vk registry contract
    await deployVkRegistryContract(true);
    // we set the verifying keys
    await setVerifyingKeys(
      STATE_TREE_DEPTH,
      INT_STATE_TREE_DEPTH,
      MSG_TREE_DEPTH,
      VOTE_OPTION_TREE_DEPTH,
      MSG_BATCH_DEPTH,
      processMessageTestZkeyPath,
      tallyVotesTestZkeyPath,
    );
  });

  describe("keyChange and new vote (new vote has same nonce)", () => {
    after(async () => {
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
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      await deployPoll(
        90,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
      );
      stateIndex = parseInt(await signup(keypair1.pubKey.serialize()));
      await publish(
        keypair1.pubKey.serialize(),
        stateIndex,
        initialVoteOption,
        initialNonce,
        pollId,
        initialVoteAmount,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish(
        keypair2.pubKey.serialize(),
        stateIndex,
        initialVoteOption,
        initialNonce,
        pollId,
        initialVoteAmount - 1,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
      await mergeMessages(0);
      await mergeSignups(0);
      await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testTallyVotesWitnessPath,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify("0", testTallyFilePath);
    });
    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(readFileSync(testTallyFilePath).toString());
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has greater nonce and different vote option)", () => {
    after(async () => {
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
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      await deployPoll(
        90,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
      );
      stateIndex = parseInt(await signup(keypair1.pubKey.serialize()));
      await publish(
        keypair1.pubKey.serialize(),
        stateIndex,
        initialVoteOption,
        initialNonce,
        pollId,
        initialVoteAmount,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should publish a message to change the user maci key and cast a new vote", async () => {
      await publish(
        keypair2.pubKey.serialize(),
        stateIndex,
        initialVoteOption + 1,
        initialNonce + 1,
        pollId,
        initialVoteAmount - 1,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
      await mergeMessages(0);
      await mergeSignups(0);
      await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testTallyVotesWitnessPath,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify("0", testTallyFilePath);
    });
    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(readFileSync(testTallyFilePath).toString());
      expect(tallyData.results.tally[0]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[0]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });

  describe("keyChange and new vote (new vote has same nonce and different vote option)", () => {
    after(async () => {
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
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      await deployPoll(
        90,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
      );
      stateIndex = parseInt(await signup(keypair1.pubKey.serialize()));
      await publish(
        keypair1.pubKey.serialize(),
        stateIndex,
        initialVoteOption,
        initialNonce,
        pollId,
        initialVoteAmount,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should publish a message to change the user maci key, and a new vote", async () => {
      await publish(
        keypair2.pubKey.serialize(),
        stateIndex,
        initialVoteOption + 2,
        initialNonce,
        pollId,
        initialVoteAmount - 3,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        keypair1.privKey.serialize(),
      );
    });
    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(90, true);
      await mergeMessages(0);
      await mergeSignups(0);
      await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testTallyVotesWitnessPath,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify("0", testTallyFilePath);
    });
    it("should confirm the tally is correct", () => {
      const tallyData = JSON.parse(readFileSync(testTallyFilePath).toString());
      expect(tallyData.results.tally[2]).to.equal(expectedTally.toString());
      expect(tallyData.perVOSpentVoiceCredits.tally[2]).to.equal(expectedPerVoteOptionTally.toString());
    });
  });
});
