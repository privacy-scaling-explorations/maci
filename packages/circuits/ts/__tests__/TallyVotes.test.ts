import { MaciState, Poll } from "@maci-protocol/core";
import { poseidon } from "@maci-protocol/crypto";
import { Keypair, PCommand, Message } from "@maci-protocol/domainobjs";
import { type WitnessTester } from "circomkit";

import { ITallyVotesInputs } from "../types";

import { STATE_TREE_DEPTH, duration, maxVoteOptions, messageBatchSize, voiceCreditBalance } from "./utils/constants";
import { generateRandomIndex, circomkitInstance } from "./utils/utils";

describe("TallyVotes circuit", function test() {
  this.timeout(900000);

  const treeDepths = {
    intStateTreeDepth: 1,
    voteOptionTreeDepth: 2,
    stateTreeDepth: 10,
  };

  const coordinatorKeypair = new Keypair();

  type TallyVotesCircuitInputs = [
    "stateRoot",
    "ballotRoot",
    "sbSalt",
    "index",
    "numSignUps",
    "sbCommitment",
    "currentTallyCommitment",
    "newTallyCommitment",
    "ballots",
    "ballotPathElements",
    "votes",
    "currentResults",
    "currentResultsRootSalt",
    "currentSpentVoiceCreditSubtotal",
    "currentSpentVoiceCreditSubtotalSalt",
    "currentPerVOSpentVoiceCredits",
    "currentPerVOSpentVoiceCreditsRootSalt",
    "newResultsRootSalt",
    "newPerVOSpentVoiceCreditsRootSalt",
    "newSpentVoiceCreditSubtotalSalt",
  ];

  let circuit: WitnessTester<TallyVotesCircuitInputs>;

  let circuitNonQv: WitnessTester<TallyVotesCircuitInputs>;

  const userKeypair = new Keypair();
  const { privateKey, publicKey: pollPublicKey } = userKeypair;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("tallyVotes", {
      file: "./coordinator/qv/tallyVotes",
      template: "TallyVotes",
      params: [10, 1, 2],
    });

    circuitNonQv = await circomkitInstance.WitnessTester("tallyVotesNonQv", {
      file: "./coordinator/non-qv/tallyVotes",
      template: "TallyVotesNonQv",
      params: [10, 1, 2],
    });
  });

  describe("1 user, 2 messages", () => {
    let stateIndex: bigint;
    let pollId: bigint;
    let poll: Poll;
    let maciState: MaciState;
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(0);

    beforeEach(() => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      const messages: Message[] = [];
      const commands: PCommand[] = [];
      // Sign up and publish
      maciState.signUp(userKeypair.publicKey);

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        maxVoteOptions,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.pubKeys.length));

      // Join the poll
      const nullifier = poseidon([BigInt(privateKey.rawPrivKey.toString()), pollId]);

      stateIndex = BigInt(poll.joinPoll(nullifier, pollPublicKey, voiceCreditBalance));

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        pollPublicKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(privateKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privateKey, coordinatorKeypair.publicKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.publicKey);

      // Process messages
      poll.processMessages(pollId);
    });

    it("should produce the correct result commitments", async () => {
      const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;
      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should produce the correct result if the initial tally is not zero", async () => {
      const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;

      // Start the tally from non-zero value
      let randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
      while (randIdx === 0) {
        randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
      }

      generatedInputs.currentResults[randIdx] = 1n;
      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.expectConstraintPass(witness);
    });
  });

  describe("1 user, 2 messages (non quadratic-voting)", () => {
    let stateIndex: bigint;
    let pollId: bigint;
    let poll: Poll;
    let maciState: MaciState;
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(0);

    beforeEach(() => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      const messages: Message[] = [];
      const commands: PCommand[] = [];
      // Sign up and publish
      maciState.signUp(userKeypair.publicKey);

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        maxVoteOptions,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.pubKeys.length));

      // Join the poll
      const nullifier = poseidon([BigInt(privateKey.rawPrivKey.toString()), pollId]);

      stateIndex = BigInt(poll.joinPoll(nullifier, pollPublicKey, voiceCreditBalance));

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        pollPublicKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(privateKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privateKey, coordinatorKeypair.publicKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.publicKey);

      // Process messages
      poll.processMessages(pollId, false);
    });

    it("should produce the correct result commitments", async () => {
      const generatedInputs = poll.tallyVotesNonQv() as unknown as ITallyVotesInputs;

      const witness = await circuitNonQv.calculateWitness(generatedInputs);
      await circuitNonQv.expectConstraintPass(witness);
    });

    it("should produce the correct result if the initial tally is not zero", async () => {
      const generatedInputs = poll.tallyVotesNonQv() as unknown as ITallyVotesInputs;

      // Start the tally from non-zero value
      let randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
      while (randIdx === 0) {
        randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
      }

      generatedInputs.currentResults[randIdx] = 1n;
      const witness = await circuitNonQv.calculateWitness(generatedInputs);
      await circuitNonQv.expectConstraintPass(witness);
    });
  });

  const NUM_BATCHES = 2;
  const x = messageBatchSize * NUM_BATCHES;

  describe(`${x} users, ${x} messages`, () => {
    it("should produce the correct state root and ballot root", async () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const userKeypairs: Keypair[] = [];

      // Sign up
      for (let i = 0; i < x; i += 1) {
        const k = new Keypair();
        userKeypairs.push(k);
        maciState.signUp(k.publicKey);
      }

      // Deploy poll
      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        maxVoteOptions,
      );

      const poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.pubKeys.length));

      // Join the poll
      userKeypairs.forEach((user) => {
        const { privateKey: userPrivKey } = user;

        const nullifier = poseidon([BigInt(userPrivKey.rawPrivKey.toString())]);

        poll.joinPoll(nullifier, user.publicKey, voiceCreditBalance);
      });

      // Commands
      const numMessages = messageBatchSize * NUM_BATCHES;
      for (let i = 0; i < numMessages; i += 1) {
        const command = new PCommand(
          BigInt(i),
          userKeypairs[i].publicKey,
          BigInt(i), // vote option index
          BigInt(1), // vote weight
          BigInt(1), // nonce
          BigInt(pollId),
        );

        const signature = command.sign(userKeypairs[i].privateKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privateKey, coordinatorKeypair.publicKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.publicKey);
      }

      for (let i = 0; i < NUM_BATCHES; i += 1) {
        poll.processMessages(pollId);
      }

      for (let i = 0; i < NUM_BATCHES; i += 1) {
        const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;

        // For the 0th batch, the circuit should ignore currentResults,
        // currentSpentVoiceCreditSubtotal, and
        // currentPerVOSpentVoiceCredits
        if (i === 0) {
          generatedInputs.currentResults[0] = 123n;
          generatedInputs.currentSpentVoiceCreditSubtotal = 456n;
          generatedInputs.currentPerVOSpentVoiceCredits[0] = 789n;
        }

        // eslint-disable-next-line no-await-in-loop
        const witness = await circuit.calculateWitness(generatedInputs);
        // eslint-disable-next-line no-await-in-loop
        await circuit.expectConstraintPass(witness);
      }
    });
  });
});
