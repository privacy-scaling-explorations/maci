import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { MaciState, Poll, STATE_TREE_ARITY } from "maci-core";
import { AccQueue, NOTHING_UP_MY_SLEEVE } from "maci-crypto";
import { Keypair, PCommand, Message } from "maci-domainobjs";

import { ITallyVotesInputs } from "../types";

import { STATE_TREE_DEPTH, duration, maxValues, messageBatchSize, voiceCreditBalance } from "./utils/constants";
import { generateRandomIndex, circomkitInstance } from "./utils/utils";

describe("TallyVotes circuit", function test() {
  this.timeout(900000);

  const treeDepths = {
    intStateTreeDepth: 1,
    messageTreeDepth: 2,
    messageTreeSubDepth: 1,
    voteOptionTreeDepth: 2,
  };

  const coordinatorKeypair = new Keypair();

  type TallyVotesCircuitInputs = [
    "stateRoot",
    "ballotRoot",
    "sbSalt",
    "packedVals",
    "sbCommitment",
    "currentTallyCommitment",
    "newTallyCommitment",
    "inputHash",
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

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("tallyVotes", {
      file: "tallyVotes",
      template: "TallyVotes",
      params: [10, 1, 2],
    });

    circuitNonQv = await circomkitInstance.WitnessTester("tallyVotesNonQv", {
      file: "tallyVotesNonQv",
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
      const userKeypair = new Keypair();
      stateIndex = BigInt(
        maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000))),
      );

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(stateIndex);

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      // Use the accumulator queue to compare the root of the message tree
      const accumulatorQueue: AccQueue = new AccQueue(
        treeDepths.messageTreeSubDepth,
        STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
      );
      accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
      accumulatorQueue.mergeSubRoots(0);
      accumulatorQueue.merge(treeDepths.messageTreeDepth);

      expect(poll.messageTree.root.toString()).to.be.eq(
        accumulatorQueue.getMainRoots()[treeDepths.messageTreeDepth].toString(),
      );
      // Process messages
      poll.processMessages(pollId);
    });

    it("should produce the correct result commitments", async () => {
      const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;
      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should produce the correct result if the inital tally is not zero", async () => {
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

  describe("1 user, 2 messages (non qv)", () => {
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
      const userKeypair = new Keypair();
      stateIndex = BigInt(
        maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000))),
      );

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(stateIndex);

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      // Use the accumulator queue to compare the root of the message tree
      const accumulatorQueue: AccQueue = new AccQueue(
        treeDepths.messageTreeSubDepth,
        STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
      );
      accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
      accumulatorQueue.mergeSubRoots(0);
      accumulatorQueue.merge(treeDepths.messageTreeDepth);

      expect(poll.messageTree.root.toString()).to.be.eq(
        accumulatorQueue.getMainRoots()[treeDepths.messageTreeDepth].toString(),
      );
      // Process messages
      poll.processMessages(pollId, false);
    });

    it("should produce the correct result commitments", async () => {
      const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;
      const witness = await circuit.calculateWitness(generatedInputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should produce the correct result if the inital tally is not zero", async () => {
      const generatedInputs = poll.tallyVotes(false) as unknown as ITallyVotesInputs;

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
      for (let i = 0; i < x; i += 1) {
        const k = new Keypair();
        userKeypairs.push(k);
        maciState.signUp(k.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000) + duration));
      }

      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const numMessages = messageBatchSize * NUM_BATCHES;
      for (let i = 0; i < numMessages; i += 1) {
        const command = new PCommand(
          BigInt(i),
          userKeypairs[i].pubKey,
          BigInt(i), // vote option index
          BigInt(1), // vote weight
          BigInt(1), // nonce
          BigInt(pollId),
        );

        const signature = command.sign(userKeypairs[i].privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
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
