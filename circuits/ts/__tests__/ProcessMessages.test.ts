import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { MaciState, MESSAGE_TREE_ARITY, Poll, STATE_TREE_ARITY } from "maci-core";
import { IncrementalQuinTree, hash2 } from "maci-crypto";
import { PrivKey, Keypair, PCommand, Message, Ballot, PubKey } from "maci-domainobjs";

import { IProcessMessagesInputs } from "../types";

import { STATE_TREE_DEPTH, duration, messageBatchSize, treeDepths, voiceCreditBalance } from "./utils/constants";
import { circomkitInstance } from "./utils/utils";

describe("ProcessMessage circuit", function test() {
  this.timeout(900000);

  const coordinatorKeypair = new Keypair();

  type ProcessMessageCircuitInputs = [
    "numSignUps",
    "batchEndIndex",
    "index",
    "maxVoteOptions",
    "pollEndTimestamp",
    "msgRoot",
    "msgs",
    "msgSubrootPathElements",
    "coordPrivKey",
    "coordinatorPublicKeyHash",
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

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("processMessages", {
      file: "./core/qv/processMessages",
      template: "ProcessMessages",
      params: [10, 2, 1, 2],
    });

    circuitNonQv = await circomkitInstance.WitnessTester("processMessagesNonQv", {
      file: "./core/non-qv/processMessages",
      template: "ProcessMessagesNonQv",
      params: [10, 2, 1, 2],
    });
  });

  describe("5 users, 1 messages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteWeight = BigInt(9);
    const voteOptionIndex = BigInt(1);
    let pollId: bigint;
    let poll: Poll;
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up and publish
      const users = new Array(5).fill(0).map(() => new Keypair());

      users.forEach((userKeypair) => {
        maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
      });

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const nothing = new Message([
        8370432830353022751713833565135785980866757267633941821328460903436894336785n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ]);

      const encP = new PubKey([
        10457101036533406547632367118273992217979173478358440826365724437999023779287n,
        19824078218392094440610104313265183977899662750282163392862422243483260492317n,
      ]);

      poll.publishMessage(nothing, encP);

      // First command (valid)
      const command = new PCommand(
        5n,
        users[4].pubKey,
        voteOptionIndex, // voteOptionIndex,
        voteWeight, // vote weight
        BigInt(2), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(users[4].privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);
    });

    it("should produce a proof", async () => {
      const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;

      // Calculate the witness
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
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
      const emptyBallot = new Ballot(
        MESSAGE_TREE_ARITY ** poll.treeDepths.voteOptionTreeDepth,
        poll.treeDepths.voteOptionTreeDepth,
      );
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash2);

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
    });

    it("should produce the correct state root and ballot root", async () => {
      // The current roots
      const emptyBallot = new Ballot(
        MESSAGE_TREE_ARITY ** poll.treeDepths.voteOptionTreeDepth,
        poll.treeDepths.voteOptionTreeDepth,
      );
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash2);

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
    });

    describe(`1 user, ${messageBatchSize * NUM_BATCHES} messages`, () => {
      it("should produce the correct state root and ballot root", async () => {
        const state = new MaciState(STATE_TREE_DEPTH);
        const userKeypair = new Keypair();
        const index = state.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));

        // Sign up and publish
        const id = state.deployPoll(
          BigInt(Math.floor(Date.now() / 1000) + duration),
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

        for (let i = 0; i < 2; i += 1) {
          const inputs = selectedPoll?.processMessages(id) as unknown as IProcessMessagesInputs;
          // eslint-disable-next-line no-await-in-loop
          const witness = await circuit.calculateWitness(inputs);
          // eslint-disable-next-line no-await-in-loop
          await circuit.expectConstraintPass(witness);
        }
      });
    });
  });

  describe("1 user, 2 messages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteOptionIndex = 1n;
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
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const nothing = new Message([
        8370432830353022751713833565135785980866757267633941821328460903436894336785n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ]);

      const encP = new PubKey([
        10457101036533406547632367118273992217979173478358440826365724437999023779287n,
        19824078218392094440610104313265183977899662750282163392862422243483260492317n,
      ]);

      poll.publishMessage(nothing, encP);

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        1n, // voteOptionIndex,
        2n, // vote weight
        2n, // nonce
        pollId,
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
        9n, // vote weight 9 ** 2 = 81
        1n, // nonce
        pollId,
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
      const emptyBallot = new Ballot(
        MESSAGE_TREE_ARITY ** poll.treeDepths.voteOptionTreeDepth,
        poll.treeDepths.voteOptionTreeDepth,
      );
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash2);

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

  describe("1 user, 2 messages in different batches", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteOptionIndex = 1n;
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
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const nothing = new Message([
        8370432830353022751713833565135785980866757267633941821328460903436894336785n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ]);

      const encP = new PubKey([
        10457101036533406547632367118273992217979173478358440826365724437999023779287n,
        19824078218392094440610104313265183977899662750282163392862422243483260492317n,
      ]);

      poll.publishMessage(nothing, encP);

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        1n, // voteOptionIndex,
        2n, // vote weight
        2n, // nonce
        pollId,
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      // fill the batch with nothing messages
      for (let i = 0; i < messageBatchSize - 1; i += 1) {
        poll.publishMessage(nothing, encP);
      }

      // Second command (valid) in second batch (which is first due to reverse processing)
      const command2 = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        9n, // vote weight 9 ** 2 = 81
        1n, // nonce
        pollId,
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
      const emptyBallot = new Ballot(
        MESSAGE_TREE_ARITY ** poll.treeDepths.voteOptionTreeDepth,
        poll.treeDepths.voteOptionTreeDepth,
      );
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash2);

      ballotTree.insert(emptyBallot.hash());

      poll.stateLeaves.forEach(() => {
        ballotTree.insert(emptyBallotHash);
      });

      while (poll.hasUnprocessedMessages()) {
        const currentStateRoot = poll.stateTree?.root;
        const currentBallotRoot = ballotTree.root;
        const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;

        // Calculate the witness
        // eslint-disable-next-line no-await-in-loop
        const witness = await circuit.calculateWitness(inputs);
        // eslint-disable-next-line no-await-in-loop
        await circuit.expectConstraintPass(witness);

        // The new roots, which should differ, since at least one of the
        // messages modified a Ballot or State Leaf
        const newStateRoot = poll.stateTree?.root;
        const newBallotRoot = poll.ballotTree?.root;

        expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
        expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());
      }
    });
  });

  describe("1 user, 3 messages in different batches", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const voteOptionIndex = 1n;
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
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const nothing = new Message([
        8370432830353022751713833565135785980866757267633941821328460903436894336785n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ]);

      const encP = new PubKey([
        10457101036533406547632367118273992217979173478358440826365724437999023779287n,
        19824078218392094440610104313265183977899662750282163392862422243483260492317n,
      ]);

      poll.publishMessage(nothing, encP);

      const commandFinal = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        1n, // voteOptionIndex,
        1n, // vote weight
        3n, // nonce
        pollId,
      );

      const signatureFinal = commandFinal.sign(userKeypair.privKey);

      const ecdhKeypairFinal = new Keypair();
      const sharedKeyFinal = Keypair.genEcdhSharedKey(ecdhKeypairFinal.privKey, coordinatorKeypair.pubKey);
      const messageFinal = commandFinal.encrypt(signatureFinal, sharedKeyFinal);
      messages.push(messageFinal);
      commands.push(commandFinal);

      poll.publishMessage(messageFinal, ecdhKeypairFinal.pubKey);

      // First command (valid)
      const command = new PCommand(
        stateIndex, // BigInt(1),
        userKeypair.pubKey,
        1n, // voteOptionIndex,
        2n, // vote weight
        2n, // nonce
        pollId,
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      // fill the batch with nothing messages
      for (let i = 0; i < messageBatchSize - 1; i += 1) {
        poll.publishMessage(nothing, encP);
      }

      // Second command (valid) in second batch (which is first due to reverse processing)
      const command2 = new PCommand(
        stateIndex,
        userKeypair.pubKey,
        voteOptionIndex, // voteOptionIndex,
        9n, // vote weight 9 ** 2 = 81
        1n, // nonce
        pollId,
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
      const emptyBallot = new Ballot(
        MESSAGE_TREE_ARITY ** poll.treeDepths.voteOptionTreeDepth,
        poll.treeDepths.voteOptionTreeDepth,
      );
      const emptyBallotHash = emptyBallot.hash();
      const ballotTree = new IncrementalQuinTree(STATE_TREE_DEPTH, emptyBallot.hash(), STATE_TREE_ARITY, hash2);

      ballotTree.insert(emptyBallot.hash());

      poll.stateLeaves.forEach(() => {
        ballotTree.insert(emptyBallotHash);
      });

      while (poll.hasUnprocessedMessages()) {
        const currentStateRoot = poll.stateTree?.root;
        const currentBallotRoot = ballotTree.root;
        const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;

        // Calculate the witness
        // eslint-disable-next-line no-await-in-loop
        const witness = await circuit.calculateWitness(inputs);
        // eslint-disable-next-line no-await-in-loop
        await circuit.expectConstraintPass(witness);

        // The new roots, which should differ, since at least one of the
        // messages modified a Ballot or State Leaf
        const newStateRoot = poll.stateTree?.root;
        const newBallotRoot = poll.ballotTree?.root;

        expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
        expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());
      }
    });
  });
});
