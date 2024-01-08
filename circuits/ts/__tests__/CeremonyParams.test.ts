import { expect } from "chai";
import tester from "circom_tester";
import { MaciState, Poll, packProcessMessageSmallVals, STATE_TREE_ARITY } from "maci-core";
import { hash5, IncrementalQuinTree, stringifyBigInts, NOTHING_UP_MY_SLEEVE, AccQueue } from "maci-crypto";
import { PrivKey, Keypair, PCommand, Message, Ballot } from "maci-domainobjs";

import path from "path";

import { generateRandomIndex, getSignal } from "./utils/utils";

describe("Ceremony param tests", () => {
  const params = {
    // processMessages and Tally
    stateTreeDepth: 6,
    // processMessages
    messageTreeDepth: 8,
    // processMessages
    messageBatchTreeDepth: 2,
    // processMessages and Tally
    voteOptionTreeDepth: 3,
    // Tally
    stateLeafBatchDepth: 2,
  };

  const maxValues = {
    maxUsers: STATE_TREE_ARITY ** params.stateTreeDepth,
    maxMessages: STATE_TREE_ARITY ** params.messageTreeDepth,
    maxVoteOptions: STATE_TREE_ARITY ** params.voteOptionTreeDepth,
  };

  const treeDepths = {
    intStateTreeDepth: params.messageBatchTreeDepth,
    messageTreeDepth: params.messageTreeDepth,
    messageTreeSubDepth: params.messageBatchTreeDepth,
    voteOptionTreeDepth: params.voteOptionTreeDepth,
  };

  const messageBatchSize = STATE_TREE_ARITY ** params.messageBatchTreeDepth;

  const voiceCreditBalance = BigInt(100);
  const duration = 30;

  const coordinatorKeypair = new Keypair();

  describe("ProcessMessage circuit", function test() {
    this.timeout(900000);

    let circuit: tester.WasmTester;
    let hasherCircuit: tester.WasmTester;

    before(async () => {
      const circuitPath = path.resolve(__dirname, "../../circom/test/ceremonyParams", `processMessages_test.circom`);
      circuit = await tester.wasm(circuitPath);
      const hasherCircuitPath = path.resolve(__dirname, "../../circom/test/", `processMessagesInputHasher_test.circom`);
      hasherCircuit = await tester.wasm(hasherCircuitPath);
    });

    describe("1 user, 2 messages", () => {
      const maciState = new MaciState(params.stateTreeDepth);
      const voteWeight = BigInt(9);
      const voteOptionIndex = BigInt(0);
      let stateIndex: bigint;
      let pollId: number;
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

        poll = maciState.polls[pollId];

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
          params.messageTreeDepth,
          STATE_TREE_ARITY,
          NOTHING_UP_MY_SLEEVE,
        );
        accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
        accumulatorQueue.enqueue(message2.hash(ecdhKeypair2.pubKey));
        accumulatorQueue.mergeSubRoots(0);
        accumulatorQueue.merge(params.messageTreeDepth);

        expect(poll.messageTree.root.toString()).to.be.eq(
          accumulatorQueue.mainRoots[params.messageTreeDepth].toString(),
        );
      });

      it("should produce the correct state root and ballot root", async () => {
        // The current roots
        const emptyBallot = new Ballot(poll.maxValues.maxVoteOptions, poll.treeDepths.voteOptionTreeDepth);
        const emptyBallotHash = emptyBallot.hash();
        const ballotTree = new IncrementalQuinTree(params.stateTreeDepth, emptyBallot.hash(), STATE_TREE_ARITY, hash5);
        ballotTree.insert(emptyBallot.hash());

        poll.stateLeaves.forEach(() => {
          ballotTree.insert(emptyBallotHash);
        });

        const currentStateRoot = maciState.stateTree.root;
        const currentBallotRoot = ballotTree.root;

        const generatedInputs = poll.processMessages(pollId);

        // Calculate the witness
        const witness = await circuit.calculateWitness(generatedInputs, true);
        await circuit.checkConstraints(witness);

        // The new roots, which should differ, since at least one of the
        // messages modified a Ballot or State Leaf
        const newStateRoot = poll.stateTree?.root;
        const newBallotRoot = poll.ballotTree?.root;

        expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot.toString());
        expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());

        const packedVals = packProcessMessageSmallVals(
          BigInt(maxValues.maxVoteOptions),
          BigInt(poll.maciStateRef.numSignUps),
          0,
          2,
        );

        // Test the ProcessMessagesInputHasher circuit
        const hasherCircuitInputs = stringifyBigInts({
          packedVals,
          coordPubKey: generatedInputs.coordPubKey,
          msgRoot: generatedInputs.msgRoot,
          currentSbCommitment: generatedInputs.currentSbCommitment,
          newSbCommitment: generatedInputs.newSbCommitment,
          pollEndTimestamp: generatedInputs.pollEndTimestamp,
        });

        const hasherWitness = await hasherCircuit.calculateWitness(hasherCircuitInputs, true);
        await hasherCircuit.checkConstraints(hasherWitness);
        const hash = await getSignal(hasherCircuit, hasherWitness, "hash");
        expect(hash.toString()).to.be.eq(generatedInputs.inputHash.toString());
      });
    });

    describe("TallyVotes circuit", function test() {
      this.timeout(900000);

      let testCircuit: tester.WasmTester;

      before(async () => {
        const circuitPath = path.resolve(__dirname, "../../circom/test/ceremonyParams", `tallyVotes_test.circom`);
        testCircuit = await tester.wasm(circuitPath);
      });

      describe("1 user, 2 messages", () => {
        let stateIndex: bigint;
        let pollId: number;
        let poll: Poll;
        let maciState: MaciState;
        const voteWeight = BigInt(9);
        const voteOptionIndex = BigInt(0);

        beforeEach(() => {
          maciState = new MaciState(params.stateTreeDepth);
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

          poll = maciState.polls[pollId];

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
            params.messageTreeDepth,
            STATE_TREE_ARITY,
            NOTHING_UP_MY_SLEEVE,
          );
          accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
          accumulatorQueue.mergeSubRoots(0);
          accumulatorQueue.merge(params.messageTreeDepth);

          expect(poll.messageTree.root.toString()).to.be.eq(
            accumulatorQueue.mainRoots[params.messageTreeDepth].toString(),
          );
          // Process messages
          poll.processMessages(pollId);
        });

        it("should produce the correct result commitments", async () => {
          const generatedInputs = poll.tallyVotes();
          const witness = await testCircuit.calculateWitness(generatedInputs);
          await testCircuit.checkConstraints(witness);
        });

        it("should produce the correct result if the inital tally is not zero", async () => {
          const generatedInputs = poll.tallyVotes();

          // Start the tally from non-zero value
          let randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
          while (randIdx === 0) {
            randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
          }

          generatedInputs.currentResults[randIdx] = "1";
          const witness = await testCircuit.calculateWitness(generatedInputs);
          await testCircuit.checkConstraints(witness);
        });
      });
    });
  });
});
