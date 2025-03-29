import { MaciState, Poll, STATE_TREE_ARITY, MESSAGE_BATCH_SIZE } from "@maci-protocol/core";
import { hash5, IncrementalQuinTree, poseidon } from "@maci-protocol/crypto";
import { PrivKey, Keypair, PCommand, Message, Ballot } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";

import { IProcessMessagesInputs, ITallyVotesInputs } from "../types";

import { maxVoteOptions } from "./utils/constants";
import { generateRandomIndex, circomkitInstance } from "./utils/utils";

describe("Ceremony param tests", () => {
  const params = {
    // processMessages and Tally
    stateTreeDepth: 14,
    // processMessages and Tally
    voteOptionTreeDepth: 3,
    // Tally
    stateLeafBatchDepth: 2,
  };

  const treeDepths = {
    intStateTreeDepth: 1,
    voteOptionTreeDepth: params.voteOptionTreeDepth,
  };

  const voiceCreditBalance = BigInt(100);
  const duration = 30;

  const coordinatorKeypair = new Keypair();

  describe("ProcessMessage circuit", function test() {
    this.timeout(900000);

    let circuit: WitnessTester<
      [
        "numSignUps",
        "batchEndIndex",
        "index",
        "inputBatchHash",
        "outputBatchHash",
        "msgs",
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
        "voteOptions",
      ]
    >;

    before(async () => {
      circuit = await circomkitInstance.WitnessTester("processMessages", {
        file: "./core/qv/processMessages",
        template: "ProcessMessages",
        params: [params.stateTreeDepth, MESSAGE_BATCH_SIZE, params.voteOptionTreeDepth],
      });
    });

    describe("1 user, 2 messages", () => {
      const maciState = new MaciState(params.stateTreeDepth);
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
        maciState.signUp(userKeypair.pubKey);

        pollId = maciState.deployPoll(
          BigInt(Math.floor(Date.now() / 1000) + duration),
          treeDepths,
          MESSAGE_BATCH_SIZE,
          coordinatorKeypair,
          maxVoteOptions,
        );

        poll = maciState.polls.get(pollId)!;

        // update the state
        poll.updatePoll(BigInt(maciState.pubKeys.length));

        // Join the poll
        const { privKey } = userKeypair;
        const { privKey: pollPrivKey, pubKey: pollPubKey } = new Keypair();

        const nullifier = poseidon([BigInt(privKey.rawPrivKey.toString())]);
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        stateIndex = BigInt(poll.joinPoll(nullifier, pollPubKey, voiceCreditBalance, timestamp));

        // First command (valid)
        const command = new PCommand(
          stateIndex, // BigInt(1),
          pollPubKey,
          voteOptionIndex, // voteOptionIndex,
          voteWeight, // vote weight
          BigInt(2), // nonce
          BigInt(pollId),
        );

        const signature = command.sign(pollPrivKey);

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
        const signature2 = command2.sign(pollPrivKey);

        const ecdhKeypair2 = new Keypair();
        const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);
        const message2 = command2.encrypt(signature2, sharedKey2);
        messages.push(message2);
        commands.push(command2);
        poll.publishMessage(message2, ecdhKeypair2.pubKey);
      });

      it("should produce the correct state root and ballot root", async () => {
        // The current roots
        const emptyBallot = new Ballot(poll.maxVoteOptions, poll.treeDepths.voteOptionTreeDepth);
        const emptyBallotHash = emptyBallot.hash();
        const ballotTree = new IncrementalQuinTree(params.stateTreeDepth, emptyBallot.hash(), STATE_TREE_ARITY, hash5);
        ballotTree.insert(emptyBallot.hash());

        poll.pollStateLeaves.forEach(() => {
          ballotTree.insert(emptyBallotHash);
        });

        const currentStateRoot = poll.pollStateTree?.root;
        const currentBallotRoot = ballotTree.root;

        const inputs = poll.processMessages(pollId) as unknown as IProcessMessagesInputs;

        // Calculate the witness
        const witness = await circuit.calculateWitness(inputs);
        await circuit.expectConstraintPass(witness);

        // The new roots, which should differ, since at least one of the
        // messages modified a Ballot or State Leaf
        const newStateRoot = poll.pollStateTree?.root;
        const newBallotRoot = poll.ballotTree?.root;

        expect(newStateRoot?.toString()).not.to.be.eq(currentStateRoot?.toString());
        expect(newBallotRoot?.toString()).not.to.be.eq(currentBallotRoot.toString());
      });
    });
  });

  describe("TallyVotes circuit", function test() {
    this.timeout(900000);

    let testCircuit: WitnessTester<
      [
        "stateRoot",
        "ballotRoot",
        "sbSalt",
        "sbCommitment",
        "index",
        "numSignUps",
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
      ]
    >;

    before(async () => {
      testCircuit = await circomkitInstance.WitnessTester("tallyVotes", {
        file: "./core/qv/tallyVotes",
        template: "TallyVotes",
        params: [14, 1, 3],
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
        maciState = new MaciState(params.stateTreeDepth);
        const messages: Message[] = [];
        const commands: PCommand[] = [];
        // Sign up and publish
        const userKeypair = new Keypair();
        maciState.signUp(userKeypair.pubKey);

        pollId = maciState.deployPoll(
          BigInt(Math.floor(Date.now() / 1000) + duration),
          treeDepths,
          MESSAGE_BATCH_SIZE,
          coordinatorKeypair,
          maxVoteOptions,
        );

        poll = maciState.polls.get(pollId)!;

        // update the state
        poll.updatePoll(BigInt(maciState.pubKeys.length));

        // Join the poll
        const { privKey } = userKeypair;
        const { privKey: pollPrivKey, pubKey: pollPubKey } = new Keypair();

        const nullifier = poseidon([BigInt(privKey.rawPrivKey.toString())]);
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        stateIndex = BigInt(poll.joinPoll(nullifier, pollPubKey, voiceCreditBalance, timestamp));

        // First command (valid)
        const command = new PCommand(
          stateIndex,
          pollPubKey,
          voteOptionIndex, // voteOptionIndex,
          voteWeight, // vote weight
          BigInt(1), // nonce
          BigInt(pollId),
        );

        const signature = command.sign(pollPrivKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        messages.push(message);
        commands.push(command);

        poll.publishMessage(message, ecdhKeypair.pubKey);

        // Process messages
        poll.processMessages(pollId);
      });

      it("should produce the correct result commitments", async () => {
        const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;
        const witness = await testCircuit.calculateWitness(generatedInputs);
        await testCircuit.expectConstraintPass(witness);
      });

      it("should produce the correct result if the initial tally is not zero", async () => {
        const generatedInputs = poll.tallyVotes() as unknown as ITallyVotesInputs;

        // Start the tally from non-zero value
        let randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
        while (randIdx === 0) {
          randIdx = generateRandomIndex(Object.keys(generatedInputs).length);
        }

        generatedInputs.currentResults[randIdx] = 1n;

        const witness = await testCircuit.calculateWitness(generatedInputs);
        await testCircuit.expectConstraintPass(witness);
      });
    });
  });
});
