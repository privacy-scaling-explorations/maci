import { genRandomSalt } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import {
  checkVerifyingKeys,
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
  subsidyTestZkeyPath,
  tallyVotesTestZkeyPath,
  testProcessMessagesWasmPath,
  testProcessMessagesWitnessDatPath,
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testSubsidyFilePath,
  testSubsidyWasmPath,
  testSubsidyWitnessDatPath,
  testSubsidyWitnessPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessDatPath,
  testTallyVotesWitnessPath,
} from "../constants";
import { cleanSubsidy, isArm } from "../utils";

describe("e2e with Subsidy tests", function test() {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;
  let vkRegistryContractAddress: string;

  const subsidyEnabled = true;

  before(async () => {
    // we deploy the vk registry contract
    vkRegistryContractAddress = await deployVkRegistryContract(true);
    // we set the verifying keys
    await setVerifyingKeys(
      STATE_TREE_DEPTH,
      INT_STATE_TREE_DEPTH,
      MSG_TREE_DEPTH,
      VOTE_OPTION_TREE_DEPTH,
      MSG_BATCH_DEPTH,
      processMessageTestZkeyPath,
      tallyVotesTestZkeyPath,
      undefined,
      subsidyTestZkeyPath,
    );
  });

  describe("4 signups, 6 messages", () => {
    after(() => {
      cleanSubsidy();
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
      await timeTravel(pollDuration, true);
      await mergeMessages(0);
      await mergeSignups(0);
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("9 signups, 1 message", () => {
    after(() => {
      cleanSubsidy();
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
      await timeTravel(pollDuration, true);
      await mergeMessages(0);
      await mergeSignups(0);
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("8 signups (same key), 12 messages (same message)", () => {
    after(() => {
      cleanSubsidy();
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
      await timeTravel(pollDuration, true);
      await mergeMessages(0);
      await mergeSignups(0);
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
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
      cleanSubsidy();
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
      const tallyData = await genProofs(
        testProofsDirPath,
        testTallyFilePath,
        tallyVotesTestZkeyPath,
        processMessageTestZkeyPath,
        0,
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath, subsidyEnabled);
      await verify(
        "0",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
      cleanSubsidy();
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
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain(
        "1",
        testProofsDirPath,
        subsidyEnabled,
        maciAddresses.maciAddress,
        pollAddresses.messageProcessor,
        pollAddresses.tally,
        pollAddresses.subsidy,
      );
      await verify(
        "1",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
      cleanSubsidy();
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
        testSubsidyFilePath,
        subsidyTestZkeyPath,
        testRapidsnarkPath,
        testProcessMessagesWitnessPath,
        testProcessMessagesWitnessDatPath,
        testTallyVotesWitnessPath,
        testTallyVotesWitnessDatPath,
        testSubsidyWitnessPath,
        testSubsidyWitnessDatPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain(
        "2",
        testProofsDirPath,
        subsidyEnabled,
        maciAddresses.maciAddress,
        secondPollAddresses.messageProcessor,
        secondPollAddresses.tally,
        secondPollAddresses.subsidy,
      );
      await verify(
        "2",
        subsidyEnabled,
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        secondPollAddresses.tally,
        secondPollAddresses.subsidy,
        testSubsidyFilePath,
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
        vkRegistryContractAddress,
        subsidyTestZkeyPath,
      );
    });
  });
});
