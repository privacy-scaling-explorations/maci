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
} from "../ts/commands";
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
  testProcessMessagesWitnessPath,
  testProofsDirPath,
  testRapidsnarkPath,
  testSubsidyFilePath,
  testSubsidyWasmPath,
  testSubsidyWitnessPath,
  testTallyFilePath,
  testTallyVotesWasmPath,
  testTallyVotesWitnessPath,
} from "./constants";
import { cleanSubsidy, isArm } from "./utils";
import { genRandomSalt } from "maci-crypto";
import { DeployedContracts, PollContracts } from "../ts/utils";

describe("e2e with Subsidy tests", function () {
  const useWasm = isArm();
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;
  let vkRegistryContractAddress: string;

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
  describe("test1", () => {
    const user1Key = new Keypair();
    after(async () => {
      cleanSubsidy();
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
      );
    });

    it("should signup one user", async () => {
      await signup(user1Key.pubKey.serialize());
    });

    it("should publish one message", async () => {
      await publish(
        user1Key.pubKey.serialize(),
        1,
        0,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        user1Key.privKey.serialize(),
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test2", () => {
    after(() => cleanSubsidy());

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
      );
    });

    it("should signup four users", async () => {
      for (const user of users) await signup(user.pubKey.serialize());
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test3", () => {
    after(() => cleanSubsidy());

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
      );
    });

    it("should signup nine users", async () => {
      for (const user of users) await signup(user.pubKey.serialize());
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test4", () => {
    after(() => cleanSubsidy());

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
      );
    });

    it("should signup eight users (same pub key)", async () => {
      for (let i = 0; i < 8; i++) await signup(user.pubKey.serialize());
    });

    it("should publish 12 messages with the same nonce", async () => {
      for (let i = 0; i < 12; i++)
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test5", () => {
    after(() => cleanSubsidy());

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
      );
    });

    it("should signup four users", async () => {
      for (const user of users) await signup(user.pubKey.serialize());
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test6", () => {
    after(() => cleanSubsidy());

    const users = [new Keypair(), new Keypair(), new Keypair(), new Keypair(), new Keypair()];

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
      );
    });

    it("should signup five users", async () => {
      for (const user of users) await signup(user.pubKey.serialize());
    });

    it("should publish five messages", async () => {
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
        users[4].pubKey.serialize(),
        5,
        4,
        1,
        0,
        9,
        maciAddresses.maciAddress,
        genRandomSalt().toString(),
        users[4].privKey.serialize(),
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("test7", () => {
    after(() => {
      cleanSubsidy();
    });

    const user = new Keypair();

    const publishArgs = [
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 6,
        voteOptionIndex: 5,
        nonce: 1,
        newVoteWeight: 6,
        pollId: 0,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 5,
        voteOptionIndex: 5,
        nonce: 2,
        newVoteWeight: 5,
        pollId: 0,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 5,
        voteOptionIndex: 4,
        nonce: 1,
        pollId: 0,
        newVoteWeight: 5,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 4,
        voteOptionIndex: 4,
        nonce: 2,
        pollId: 0,
        newVoteWeight: 4,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 4,
        voteOptionIndex: 3,
        nonce: 1,
        pollId: 0,
        newVoteWeight: 4,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 3,
        voteOptionIndex: 3,
        nonce: 2,
        pollId: 0,
        newVoteWeight: 3,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 2,
        voteOptionIndex: 2,
        nonce: 2,
        pollId: 0,
        newVoteWeight: 2,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 2,
        voteOptionIndex: 1,
        nonce: 1,
        pollId: 0,
        newVoteWeight: 2,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 1,
        voteOptionIndex: 1,
        nonce: 2,
        pollId: 0,
        newVoteWeight: 1,
      },
      {
        quiet: true,
        pubkey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        stateIndex: 1,
        voteOptionIndex: 0,
        nonce: 1,
        pollId: 0,
        newVoteWeight: 1,
      },
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
      );
    });

    it("should signup an user", async () => {
      for (let i = 0; i < 6; i++) await signup(publishArgs[i].pubkey);
    });

    it("should publish all messages", async () => {
      for (const arg of publishArgs)
        await publish(
          arg.pubkey,
          arg.stateIndex,
          arg.voteOptionIndex,
          arg.nonce,
          arg.pollId,
          arg.newVoteWeight,
          maciAddresses.maciAddress,
          genRandomSalt().toString(),
          arg.privateKey,
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
    });
  });

  describe("multiplePolls1", () => {
    after(() => cleanSubsidy());

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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
        testTallyFilePath,
        tallyData,
        maciAddresses.maciAddress,
        pollAddresses.tally,
        pollAddresses.subsidy,
        testSubsidyFilePath,
      );
      cleanSubsidy();
    });

    it("should deploy a new poll", async () => {
      pollAddresses = await deployPoll(
        pollDuration,
        maxMessages,
        maxVoteOptions,
        INT_STATE_TREE_DEPTH,
        MSG_BATCH_DEPTH,
        MSG_TREE_DEPTH,
        VOTE_OPTION_TREE_DEPTH,
        coordinatorPubKey,
      );
    });
    it("should publish a new message", async () => {
      await publish(user.pubKey.serialize(), 1, 0, 1, 1, 7, undefined, undefined, user.privKey.serialize());
    });
    it("should generate proofs and verify them", async () => {
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("1", testProofsDirPath);
      await verify(
        "1",
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
      );
      // signup
      for (let i = 0; i < 7; i++) await signup(users[i].pubKey.serialize());
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
        coordinatorPrivKey,
        maciAddresses.maciAddress,
        undefined,
        testProcessMessagesWasmPath,
        testTallyVotesWasmPath,
        testSubsidyWasmPath,
        useWasm,
      );
      await proveOnChain("0", testProofsDirPath);
      await verify(
        "0",
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
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
        maciAddresses.maciAddress,
        pollAddresses.messageProcessor,
        pollAddresses.tally,
        pollAddresses.subsidy,
      );
      await verify(
        "1",
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
        testTallyVotesWitnessPath,
        testSubsidyWitnessPath,
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
        maciAddresses.maciAddress,
        secondPollAddresses.messageProcessor,
        secondPollAddresses.tally,
        secondPollAddresses.subsidy,
      );
      await verify(
        "2",
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
