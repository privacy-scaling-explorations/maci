import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { MaciState, Poll, packProcessMessageSmallVals, STATE_TREE_ARITY } from "maci-core";
import { hash5, IncrementalQuinTree, NOTHING_UP_MY_SLEEVE, AccQueue } from "maci-crypto";
import { PrivKey, Keypair, PCommand, Message, Ballot } from "maci-domainobjs";

import { IProcessMessagesInputs } from "../types";

import {
  STATE_TREE_DEPTH,
  duration,
  maxValues,
  messageBatchSize,
  treeDepths,
  voiceCreditBalance,
} from "./utils/constants";
import { getSignal, circomkitInstance } from "./utils/utils";

describe("ProcessMessage circuit", function test() {
  this.timeout(900000);

  const coordinatorKeypair = new Keypair();

  type ProcessMessageCircuitInputs = [
    "inputHash",
    "packedVals",
    "pollEndTimestamp",
    "msgRoot",
    "msgs",
    "msgSubrootPathElements",
    "coordPrivKey",
    "coordPubKey",
    "encPubKeys",
    "currentStateRoot",
    "currentStateLeaves",
    "currentStateLeavesPathElements",
    "currentSbCommitment",
    "currentSbSalt",
    "newSbCommitment",
    "newSbSalt",
    "currentBallotRoot",
    "currentBallots",
    "currentBallotsPathElements",
    "currentVoteWeights",
    "currentVoteWeightsPathElements",
  ];

  let circuit: WitnessTester<ProcessMessageCircuitInputs>;

  let circuitNonQv: WitnessTester<ProcessMessageCircuitInputs>;

  let hasherCircuit: WitnessTester<
    ["packedVals", "coordPubKey", "msgRoot", "currentSbCommitment", "newSbCommitment", "pollEndTimestamp"],
    ["maxVoteOptions", "numSignUps", "batchStartIndex", "batchEndIndex", "hash"]
  >;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("processMessages", {
      file: "processMessages",
      template: "ProcessMessages",
      params: [10, 2, 1, 2],
    });

    circuitNonQv = await circomkitInstance.WitnessTester("processMessagesNonQv", {
      file: "processMessagesNonQv",
      template: "ProcessMessagesNonQv",
      params: [10, 2, 1, 2],
    });

    hasherCircuit = await circomkitInstance.WitnessTester("processMessageInputHasher", {
      file: "processMessages",
      template: "ProcessMessagesInputHasher",
    });
  });

  describe("1 user, 2 messages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(0);
    let stateIndex: bigint;
    let pollId: bigint;
    let poll: Poll;
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up and publish
      const userKeypair = new Keypair(new PrivKey(BigInt(1)));
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
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(2), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      // Second command (valid)
      const command2 = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        BigInt(1), // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );
      const signature2 = command2.sign(userKeypair.privKey);

      const ecdhKeypair2 = new Keypair();
      const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);
      const message2 = command2.encrypt(signature2, sharedKey2);
      messages.push(message2);
      commands.push(command2);
      poll.publishMessage(message2, ecdhKeypair2.pubKey);
      // Use the accumulator queue to compare the root of the message tree
      const accumulatorQueue: AccQueue = new AccQueue(
        treeDepths.messageTreeSubDepth,
        STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
      );
      accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
      accumulatorQueue.enqueue(message2.hash(ecdhKeypair2.pubKey));
      accumulatorQueue.mergeSubRoots(0);
      accumulatorQueue.merge(treeDepths.messageTreeDepth);

      expect(poll.messageTree.root.toString()).to.be.eq(
        accumulatorQueue.getMainRoots()[treeDepths.messageTreeDepth].toString(),
      );
    });

    it("should produce the correct state root and ballot root", async () => {
      // The current roots
      const emptyBallot = new Ballot(poll.maxValues.maxVoteOptions, poll.treeDepths.voteOptionTreeDepth);
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash5);

      ballotTree.insert(emptyBallot.hash());

      poll.stateLeaves.forEach(() => {
        ballotTree.insert(emptyBallotHash);
      });

      const currentStateRoot = poll.stateTree?.root;
      const currentBallotRoot = ballotTree.root;

      const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;

      // Calculate the witness
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);

      // The new roots, which should differ, since at least one of the
      // messages modified a Ballot or State Leaf
      const newStateRoot = poll.stateTree?.root;
      const newBallotRoot = poll.ballotTree?.root;

      expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
      expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());

      const packedVals = packProcessMessageSmallVals(
        BigInt(maxValues.maxVoteOptions),
        BigInt(poll.maciStateRef.numSignUps),
        0,
        2,
      );

      // Test the ProcessMessagesInputHasher circuit
      const hasherCircuitInputs = {
        packedVals,
        coordPubKey: inputs.coordPubKey,
        msgRoot: inputs.msgRoot,
        currentSbCommitment: inputs.currentSbCommitment,
        newSbCommitment: inputs.newSbCommitment,
        pollEndTimestamp: inputs.pollEndTimestamp,
      };

      const hasherWitness = await hasherCircuit.calculateWitness(hasherCircuitInputs);
      await hasherCircuit.expectConstraintPass(hasherWitness);
      const hash = await getSignal(hasherCircuit, hasherWitness, "hash");
      expect(hash.toString()).to.be.eq(inputs.inputHash.toString());
    });
  });

  describe("1 user, 2 messages (non-quadratic voting)", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(0);
    let stateIndex: bigint;
    let pollId: bigint;
    let poll: Poll;
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up and publish
      const userKeypair = new Keypair(new PrivKey(BigInt(1)));
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
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(2), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      // Second command (valid)
      const command2 = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        BigInt(1), // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );
      const signature2 = command2.sign(userKeypair.privKey);

      const ecdhKeypair2 = new Keypair();
      const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);
      const message2 = command2.encrypt(signature2, sharedKey2);
      messages.push(message2);
      commands.push(command2);
      poll.publishMessage(message2, ecdhKeypair2.pubKey);
    });

    it("should produce the correct state root and ballot root", async () => {
      // The current roots
      const emptyBallot = new Ballot(poll.maxValues.maxVoteOptions, poll.treeDepths.voteOptionTreeDepth);
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash5);

      ballotTree.insert(emptyBallot.hash());

      poll.stateLeaves.forEach(() => {
        ballotTree.insert(emptyBallotHash);
      });

      const currentStateRoot = poll.stateTree?.root;
      const currentBallotRoot = ballotTree.root;

      const inputs = poll.processMessages(pollId, false) as unknown as IProcessMessagesInputs;

      // Calculate the witness
      const witness = await circuitNonQv.calculateWitness(inputs);
      await circuitNonQv.expectConstraintPass(witness);

      // The new roots, which should differ, since at least one of the
      // messages modified a Ballot or State Leaf
      const newStateRoot = poll.stateTree?.root;
      const newBallotRoot = poll.ballotTree?.root;

      expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
      expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());

      const packedVals = packProcessMessageSmallVals(
        BigInt(maxValues.maxVoteOptions),
        BigInt(poll.maciStateRef.numSignUps),
        0,
        2,
      );

      // Test the ProcessMessagesInputHasher circuit
      const hasherCircuitInputs = {
        packedVals,
        coordPubKey: inputs.coordPubKey,
        msgRoot: inputs.msgRoot,
        currentSbCommitment: inputs.currentSbCommitment,
        newSbCommitment: inputs.newSbCommitment,
        pollEndTimestamp: inputs.pollEndTimestamp,
      };

      const hasherWitness = await hasherCircuit.calculateWitness(hasherCircuitInputs);
      await hasherCircuit.expectConstraintPass(hasherWitness);
      const hash = await getSignal(hasherCircuit, hasherWitness, "hash");
      expect(hash.toString()).to.be.eq(inputs.inputHash.toString());
    });
  });

  describe("2 users, 1 message", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    let pollId: bigint;
    let poll: Poll;
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up and publish
      const userKeypair = new Keypair(new PrivKey(BigInt(123)));
      const userKeypair2 = new Keypair(new PrivKey(BigInt(456)));

      maciState.signUp(
        userKeypair.pubKey,
        voiceCreditBalance,
        BigInt(1), // BigInt(Math.floor(Date.now() / 1000)),
      );
      maciState.signUp(
        userKeypair2.pubKey,
        voiceCreditBalance,
        BigInt(1), // BigInt(Math.floor(Date.now() / 1000)),
      );

      pollId = maciState.deployPoll(
        BigInt(2 + duration), // BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;

      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const command = new PCommand(
        BigInt(1),
        userKeypair.pubKey,
        BigInt(0), // voteOptionIndex,
        BigInt(1), // vote weight
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
        accumulatorQueue.getRoot(treeDepths.messageTreeDepth)?.toString(),
      );
    });

    it("should produce the correct state root and ballot root", async () => {
      // The current roots
      const emptyBallot = new Ballot(poll.maxValues.maxVoteOptions, poll.treeDepths.voteOptionTreeDepth);
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash5);

      ballotTree.insert(emptyBallot.hash());

      poll.stateLeaves.forEach(() => {
        ballotTree.insert(emptyBallotHash);
      });

      const currentStateRoot = poll.stateTree?.root;
      const currentBallotRoot = ballotTree.root;

      const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;
      // Calculate the witness
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);

      // The new roots, which should differ, since at least one of the
      // messages modified a Ballot or State Leaf
      const newStateRoot = poll.stateTree?.root;
      const newBallotRoot = poll.ballotTree?.root;

      expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
      expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());
    });
  });

  describe("1 user, key-change", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteWeight = BigInt(9);
    let stateIndex: number;
    let pollId: bigint;
    let poll: Poll;
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    const NUM_BATCHES = 2;

    before(() => {
      // Sign up and publish
      const userKeypair = new Keypair(new PrivKey(BigInt(123)));
      const userKeypair2 = new Keypair(new PrivKey(BigInt(456)));

      stateIndex = maciState.signUp(
        userKeypair.pubKey,
        voiceCreditBalance,
        BigInt(1), // BigInt(Math.floor(Date.now() / 1000)),
      );

      pollId = maciState.deployPoll(
        BigInt(2 + duration), // BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;

      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      // Vote for option 0
      const command = new PCommand(
        BigInt(stateIndex), // BigInt(1),
        userKeypair.pubKey,
        BigInt(0), // voteOptionIndex,
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

      // Vote for option 1
      const command2 = new PCommand(
        BigInt(stateIndex),
        userKeypair2.pubKey,
        BigInt(1), // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(2), // nonce
        BigInt(pollId),
      );
      const signature2 = command2.sign(userKeypair2.privKey);

      const ecdhKeypair2 = new Keypair();
      const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);
      const message2 = command2.encrypt(signature2, sharedKey2);
      messages.push(message2);
      commands.push(command2);
      poll.publishMessage(message2, ecdhKeypair2.pubKey);

      // Change key
      const command3 = new PCommand(
        BigInt(stateIndex), // BigInt(1),
        userKeypair2.pubKey,
        BigInt(1), // voteOptionIndex,
        BigInt(0), // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature3 = command3.sign(userKeypair.privKey);

      const ecdhKeypair3 = new Keypair();
      const sharedKey3 = Keypair.genEcdhSharedKey(ecdhKeypair3.privKey, coordinatorKeypair.pubKey);
      const message3 = command3.encrypt(signature3, sharedKey3);
      messages.push(message3);
      commands.push(command3);
      poll.publishMessage(message3, ecdhKeypair3.pubKey);
      // Use the accumulator queue to compare the root of the message tree
      const accumulatorQueue: AccQueue = new AccQueue(
        treeDepths.messageTreeSubDepth,
        STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
      );
      accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
      accumulatorQueue.enqueue(message2.hash(ecdhKeypair2.pubKey));
      accumulatorQueue.enqueue(message3.hash(ecdhKeypair3.pubKey));
      accumulatorQueue.mergeSubRoots(0);
      accumulatorQueue.merge(treeDepths.messageTreeDepth);

      expect(poll.messageTree.root.toString()).to.be.eq(
        accumulatorQueue.getRoot(treeDepths.messageTreeDepth)?.toString(),
      );
    });

    describe(`1 user, ${messageBatchSize * NUM_BATCHES} messages`, () => {
      it("should produce the correct state root and ballot root", async () => {
        const state = new MaciState(STATE_TREE_DEPTH);
        const userKeypair = new Keypair();
        const index = state.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));

        // Sign up and publish
        const id = state.deployPoll(
          BigInt(Math.floor(Date.now() / 1000) + duration),
          maxValues,
          treeDepths,
          messageBatchSize,
          coordinatorKeypair,
        );

        const selectedPoll = state.polls.get(id);

        selectedPoll?.updatePoll(BigInt(state.stateLeaves.length));

        // Second batch is not a full batch
        const numMessages = messageBatchSize * NUM_BATCHES - 1;
        for (let i = 0; i < numMessages; i += 1) {
          const command = new PCommand(
            BigInt(index),
            userKeypair.pubKey,
            BigInt(i), // vote option index
            BigInt(1), // vote weight
            BigInt(numMessages - i), // nonce
            BigInt(id),
          );

          const signature = command.sign(userKeypair.privKey);

          const ecdhKeypair = new Keypair();
          const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
          const message = command.encrypt(signature, sharedKey);
          selectedPoll?.publishMessage(message, ecdhKeypair.pubKey);
        }

        for (let i = 0; i < NUM_BATCHES; i += 1) {
          const inputs = selectedPoll?.processMessages(id) as unknown as IProcessMessagesInputs;
          // eslint-disable-next-line no-await-in-loop
          const witness = await circuit.calculateWitness(inputs);
          // eslint-disable-next-line no-await-in-loop
          await circuit.expectConstraintPass(witness);
        }
      });
    });
  });

  describe("1 user, 1 topup, 2 messages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteOptionIndex = BigInt(0);
    let stateIndex: bigint;
    let pollId: bigint;
    let poll: Poll;
    const userKeypair = new Keypair();

    before(() => {
      // Sign up and publish
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
      poll.updatePoll(BigInt(maciState.stateLeaves.length));
    });

    it("should work when publishing 2 vote messages and a topup (the second vote uses more than initial voice credit balance)", async () => {
      // First command (valid)
      const command1 = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        voteOptionIndex + 1n, // voteOptionIndex,
        5n, // vote weight
        BigInt(2), // nonce
        BigInt(pollId),
      );

      const signature1 = command1.sign(userKeypair.privKey);

      const ecdhKeypair1 = new Keypair();
      const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);
      const message1 = command1.encrypt(signature1, sharedKey1);

      poll.publishMessage(message1, ecdhKeypair1.pubKey);

      poll.topupMessage(new Message(2n, [BigInt(stateIndex), 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        10n, // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
    });
  });
});
