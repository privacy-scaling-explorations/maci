import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import fs from "fs";

import {
  airdrop,
  checkVerifyingKeys,
  deploy,
  deployPoll,
  deployVkRegistryContract,
  genLocalState,
  genProofs,
  mergeMessages,
  mergeSignups,
  proveOnChain,
  publish,
  setVerifyingKeys,
  signup,
  timeTravel,
  topup,
  verify,
} from "../../ts/commands";
import { DeployedContracts, PollContracts } from "../../ts/utils";
import {
  INT_STATE_TREE_DEPTH,
  MSG_BATCH_DEPTH,
  MSG_TREE_DEPTH,
  STATE_TREE_DEPTH,
  VOTE_OPTION_TREE_DEPTH,
  coordinatorPrivKey,
  coordinatorPubKey,
  maxMessages,
  maxVoteOptions,
  pollDuration,
  processMessageTestZkeyPath,
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
} from "../constants";
import { cleanVanilla, isArm } from "../utils";

/**
 Test scenarios:
    1 signup, 1 message
    4 signups, 6 messages
    5 signups, 1 message
    8 signups, 10 messages
    4 signups, 4 messages
    test if keys are set correctly given a set of files
    1 signup and 1 valid message for multiple polls
    7 signups and 1 message, another polls and 6 messages
    1 signup, 1 topup message and 1 vote message
 */
describe("e2e tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;

  const subsidyEnabled = false;

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

  describe("1 signup, 1 message", () => {
    after(() => {
      cleanVanilla();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup one user", async () => {
      await signup(user.pubKey.serialize());
    });

    it("should publish one message", async () => {
      await publish(
        user.pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user.privKey.serialize(),
      );
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(0, maciAddresses.maciAddress);
      await mergeSignups(0, maciAddresses.maciAddress);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyFileData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
      );
    });
  });

  describe("4 signups, 4 messages", () => {
    after(() => {
      cleanVanilla();
    });

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair()];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup(users[i].pubKey.serialize());
      }
    });

    it("should publish four messages", async () => {
      await publish(
        users[0].pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
      await publish(
        users[1].pubKey.serialize(),
        2,
        1,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[1].privKey.serialize(),
      );
      await publish(
        users[2].pubKey.serialize(),
        3,
        2,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[2].privKey.serialize(),
      );
      await publish(
        users[3].pubKey.serialize(),
        4,
        3,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(0, maciAddresses.maciAddress);
      await mergeSignups(0, maciAddresses.maciAddress);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyFileData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
      );
    });
  });

  describe("4 signups, 6 messages", () => {
    after(() => {
      cleanVanilla();
    });

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair()];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup four users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup(users[i].pubKey.serialize());
      }
    });

    it("should publish six messages", async () => {
      await publish(
        users[0].pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
      await publish(
        users[1].pubKey.serialize(),
        2,
        1,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[1].privKey.serialize(),
      );
      await publish(
        users[2].pubKey.serialize(),
        3,
        2,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[2].privKey.serialize(),
      );
      await publish(
        users[3].pubKey.serialize(),
        4,
        3,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[3].privKey.serialize(),
      );
      await publish(
        users[3].pubKey.serialize(),
        4,
        3,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[3].privKey.serialize(),
      );
      await publish(
        users[3].pubKey.serialize(),
        4,
        3,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[3].privKey.serialize(),
      );
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(0, maciAddresses.maciAddress);
      await mergeSignups(0, maciAddresses.maciAddress);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyFileData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
      );
    });
  });

  describe("5 signups, 1 message", () => {
    after(() => {
      cleanVanilla();
    });

    const users = [
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
    ];

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup nine users", async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup(users[i].pubKey.serialize());
      }
    });

    it("should publish one message", async () => {
      await publish(
        users[0].pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(0, maciAddresses.maciAddress);
      await mergeSignups(0, maciAddresses.maciAddress);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyFileData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
      );
    });
  });

  describe("8 signups (same key), 12 messages (same message)", () => {
    after(() => {
      cleanVanilla();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup eight users (same pub key)", async () => {
      for (let i = 0; i < 8; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup(user.pubKey.serialize());
      }
    });

    it("should publish 12 messages with the same nonce", async () => {
      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await publish(
          user.pubKey.serialize(),
          1,
          0,
          1,
          0,
          9,
          maciAddresses.maciAddress,
          genRandomSalt().toString(),
          user.privKey.serialize(),
        );
      }
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration);
      await mergeMessages(0, maciAddresses.maciAddress);
      await mergeSignups(0, maciAddresses.maciAddress);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyFileData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
      );
    });
  });

  describe("checkKeys", () => {
    before(async () => {
      // deploy maci as we need the address
      await deploy(STATE_TREE_DEPTH);
    });
    it("should check if the verifying keys have been set correctly", async () => {
      await checkVerifyingKeys(
        STATE_TREE_DEPTH,
        INT_STATE_TREE_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        processMessageTestZkeyPath,
        tallyVotesTestZkeyPath,
      );
    });
  });

  describe("multiplePolls1", () => {
    after(() => {
      cleanVanilla();
    });

    const user = new Keypair();

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
      // signup
      await signup(user.pubKey.serialize());
      // publish
      await publish(
        user.pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user.privKey.serialize(),
      );
      // time travel
      await timeTravel(pollDuration, true);
      // generate proofs
      await mergeMessages(0);
      await mergeSignups(0);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        undefined,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify("0", subsidyEnabled, testTallyFilePath, tallyFileData);
      cleanVanilla();
    });

    it("should deploy a new poll", async () => {
      pollAddresses = await deployPoll(
        pollDuration,
        25,
        25,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });
    it("should publish a new message", async () => {
      await publish(
        user.pubKey.serialize(),
        1,
        0,
        1,
        1,
        7,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user.privKey.serialize(),
      );
    });
    it("should generate proofs and verify them", async () => {
      await timeTravel(pollDuration, true);
      await mergeMessages(1);
      await mergeSignups(1);
      await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        1,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        undefined,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("1", testProofsDirPath, subsidyEnabled);
      await verify("1", subsidyEnabled, testTallyFilePath);
    });
  });

  describe("multiplePolls2", () => {
    const users = [
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
      new Keypair(),
    ];

    let secondPollAddresses: PollContracts;

    after(() => {
      cleanVanilla();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
    });

    it("should run the first poll", async () => {
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );

      // signup
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < users.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await signup(users[i].pubKey.serialize());
      }

      // publish
      await publish(
        users[0].pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
      // time travel
      await timeTravel(pollDuration, true);
      // generate proofs
      await mergeMessages(0);
      await mergeSignups(0);
      const tallyFileData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        undefined,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify("0", subsidyEnabled, testTallyFilePath, tallyFileData);
      cleanVanilla();
    });

    it("should deploy two more polls", async () => {
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
      secondPollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should publish messages to the second poll", async () => {
      await publish(
        users[0].pubKey.serialize(),
        1,
        0,
        1,
        1,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[0].privKey.serialize(),
      );
      await publish(
        users[1].pubKey.serialize(),
        2,
        2,
        1,
        1,
        2,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[1].privKey.serialize(),
      );
      await publish(
        users[2].pubKey.serialize(),
        3,
        3,
        1,
        1,
        3,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[2].privKey.serialize(),
      );
    });

    it("should publish messages to the third poll", async () => {
      await publish(
        users[3].pubKey.serialize(),
        1,
        1,
        1,
        2,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[3].privKey.serialize(),
      );

      await publish(
        users[4].pubKey.serialize(),
        2,
        2,
        1,
        2,
        5,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[4].privKey.serialize(),
      );

      await publish(
        users[5].pubKey.serialize(),
        5,
        5,
        1,
        2,
        5,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[5].privKey.serialize(),
      );
    });

    it("should complete the second poll", async () => {
      await timeTravel(pollDuration, true);
      await mergeMessages(1);
      await mergeSignups(1);
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        1,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain(
        "1",
        testProofsDirPath,
        subsidyEnabled,
        maciAddresses.maciAddress,
        pollAddresses.messageProcessor,
        pollAddresses.tally,
      );
      await verify("1", subsidyEnabled, testTallyFilePath, tallyData, maciAddresses.maciAddress, pollAddresses.tally);
      cleanVanilla();
    });

    it("should complete the third poll", async () => {
      await mergeMessages(2);
      await mergeSignups(2);
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        2,
        undefined,
        undefined,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        undefined,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain(
        "2",
        testProofsDirPath,
        subsidyEnabled,
        maciAddresses.maciAddress,
        secondPollAddresses.messageProcessor,
        secondPollAddresses.tally,
      );
      await verify(
        "2",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        secondPollAddresses.tally,
      );
    });
  });

  describe("pre fetch logs", () => {
    const stateOutPath = "./state.json";

    const user = new Keypair();

    after(() => {
      cleanVanilla();

      if (fs.existsSync(stateOutPath)) {
        fs.unlinkSync(stateOutPath);
      }
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup one user", async () => {
      await signup(user.pubKey.serialize());
    });

    it("should publish one message", async () => {
      await publish(
        user.pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user.privKey.serialize(),
      );
    });

    it("should generate zk-SNARK proofs and verify them", async () => {
      await timeTravel(pollDuration, true);
      await mergeMessages(0);
      await mergeSignups(0);
      await genLocalState(
        stateOutPath,
        0,
        maciAddresses.maciAddress,
        coordinatorPrivKey,
        undefined,
        undefined,
        undefined,
        50,
      );
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
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
        stateOutPath,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify("0", subsidyEnabled, testTallyFilePath);
    });
  });

  describe("topup message", () => {
    const user = new Keypair();
    const tokenAmount = 100;
    let stateIndex: number | undefined;

    after(() => {
      cleanVanilla();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy(STATE_TREE_DEPTH);
      // deploy a poll contract
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
        subsidyEnabled,
      );
    });

    it("should signup one user", async () => {
      stateIndex = Number.parseInt(await signup(user.pubKey.serialize()), 10);
    });

    it("should airdrop topup tokens to the coordinator user", async () => {
      await airdrop(tokenAmount, maciAddresses.topupCreditAddress, 0, maciAddresses.maciAddress, true);
    });

    it("should publish one topup message", async () => {
      await topup(tokenAmount, stateIndex!, 0, maciAddresses.maciAddress, true);
    });

    it("should publish one vote message", async () => {
      await publish(
        user.pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user.privKey.serialize(),
      );
    });

    it("should generate proofs and verify them", async () => {
      await timeTravel(pollDuration, true);
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
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        undefined,
        undefined,
        coordinatorPrivKey,
        undefined,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        undefined,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify("0", subsidyEnabled, testTallyFilePath);
    });
  });
});
