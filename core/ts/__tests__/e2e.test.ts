import { expect } from "chai";
import { hash5, NOTHING_UP_MY_SLEEVE, IncrementalQuinTree, AccQueue } from "maci-crypto";
import { PCommand, Keypair, StateLeaf, blankStateLeafHash } from "maci-domainobjs";

import { MaciState } from "../MaciState";
import { Poll } from "../Poll";
import { STATE_TREE_DEPTH, STATE_TREE_ARITY } from "../utils/constants";
import { packProcessMessageSmallVals, unpackProcessMessageSmallVals } from "../utils/utils";

import {
  coordinatorKeypair,
  duration,
  maxValues,
  messageBatchSize,
  treeDepths,
  voiceCreditBalance,
} from "./utils/constants";
import { TestHarness, calculateTotal } from "./utils/utils";

describe("MaciState/Poll e2e", function test() {
  this.timeout(300000);

  describe("key changes", () => {
    const user1Keypair = new Keypair();
    const user2Keypair = new Keypair();
    const user1SecondKeypair = new Keypair();
    const user2SecondKeypair = new Keypair();
    let pollId: bigint;
    let user1StateIndex: number;
    let user2StateIndex: number;
    const user1VoteOptionIndex = 0n;
    const user2VoteOptionIndex = 1n;
    const user1VoteWeight = 9n;
    const user2VoteWeight = 3n;
    const user1NewVoteWeight = 5n;
    const user2NewVoteWeight = 7n;

    describe("only user 1 changes key", () => {
      const maciState: MaciState = new MaciState(STATE_TREE_DEPTH);

      before(() => {
        // Sign up
        user1StateIndex = maciState.signUp(
          user1Keypair.pubKey,
          voiceCreditBalance,
          BigInt(Math.floor(Date.now() / 1000)),
        );
        user2StateIndex = maciState.signUp(
          user2Keypair.pubKey,
          voiceCreditBalance,
          BigInt(Math.floor(Date.now() / 1000)),
        );

        // deploy a poll
        pollId = maciState.deployPoll(
          BigInt(Math.floor(Date.now() / 1000) + duration),
          maxValues,
          treeDepths,
          messageBatchSize,
          coordinatorKeypair,
        );

        maciState.polls.get(pollId)?.updatePoll(BigInt(maciState.stateLeaves.length));
      });

      it("should submit a vote for each user", () => {
        const poll = maciState.polls.get(pollId)!;
        const command1 = new PCommand(
          BigInt(user1StateIndex),
          user1Keypair.pubKey,
          user1VoteOptionIndex,
          user1VoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature1 = command1.sign(user1Keypair.privKey);

        const ecdhKeypair1 = new Keypair();
        const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);

        const message1 = command1.encrypt(signature1, sharedKey1);
        poll.publishMessage(message1, ecdhKeypair1.pubKey);

        const command2 = new PCommand(
          BigInt(user2StateIndex),
          user2Keypair.pubKey,
          user2VoteOptionIndex,
          user2VoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature2 = command2.sign(user2Keypair.privKey);

        const ecdhKeypair2 = new Keypair();
        const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);

        const message2 = command2.encrypt(signature2, sharedKey2);
        poll.publishMessage(message2, ecdhKeypair2.pubKey);
      });

      it("user1 sends a keychange message with a new vote", () => {
        const poll = maciState.polls.get(pollId)!;
        const command = new PCommand(
          BigInt(user1StateIndex),
          user1SecondKeypair.pubKey,
          user1VoteOptionIndex,
          user1NewVoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(user1Keypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      });

      it("should perform the processing and tallying correctly", () => {
        const poll = maciState.polls.get(pollId)!;
        poll.processMessages(pollId);
        poll.tallyVotes();
        expect(poll.perVOSpentVoiceCredits[0].toString()).to.eq((user1NewVoteWeight * user1NewVoteWeight).toString());
        expect(poll.perVOSpentVoiceCredits[1].toString()).to.eq((user2VoteWeight * user2VoteWeight).toString());
      });

      it("should confirm that the user key pair was changed (user's 2 one has not)", () => {
        const poll = maciState.polls.get(pollId)!;
        const stateLeaf1 = poll.stateLeaves[user1StateIndex];
        const stateLeaf2 = poll.stateLeaves[user2StateIndex];
        expect(stateLeaf1.pubKey.equals(user1SecondKeypair.pubKey)).to.eq(true);
        expect(stateLeaf2.pubKey.equals(user2Keypair.pubKey)).to.eq(true);
      });
    });

    describe("both users change key", () => {
      const maciState: MaciState = new MaciState(STATE_TREE_DEPTH);
      let poll: Poll;

      before(() => {
        // Sign up
        user1StateIndex = maciState.signUp(
          user1Keypair.pubKey,
          voiceCreditBalance,
          BigInt(Math.floor(Date.now() / 1000)),
        );
        user2StateIndex = maciState.signUp(
          user2Keypair.pubKey,
          voiceCreditBalance,
          BigInt(Math.floor(Date.now() / 1000)),
        );

        // deploy a poll
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
      it("should submit a vote for each user", () => {
        const command1 = new PCommand(
          BigInt(user1StateIndex),
          user1Keypair.pubKey,
          user1VoteOptionIndex,
          user1VoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature1 = command1.sign(user1Keypair.privKey);

        const ecdhKeypair1 = new Keypair();
        const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);

        const message1 = command1.encrypt(signature1, sharedKey1);
        poll.publishMessage(message1, ecdhKeypair1.pubKey);

        const command2 = new PCommand(
          BigInt(user2StateIndex),
          user2Keypair.pubKey,
          user2VoteOptionIndex,
          user2VoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature2 = command2.sign(user2Keypair.privKey);

        const ecdhKeypair2 = new Keypair();
        const sharedKey2 = Keypair.genEcdhSharedKey(ecdhKeypair2.privKey, coordinatorKeypair.pubKey);

        const message2 = command2.encrypt(signature2, sharedKey2);
        poll.publishMessage(message2, ecdhKeypair2.pubKey);
      });

      it("user1 sends a keychange message with a new vote", () => {
        const command = new PCommand(
          BigInt(user1StateIndex),
          user1SecondKeypair.pubKey,
          user1VoteOptionIndex,
          user1NewVoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(user1Keypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      });

      it("user2 sends a keychange message with a new vote", () => {
        const command = new PCommand(
          BigInt(user2StateIndex),
          user2SecondKeypair.pubKey,
          user2VoteOptionIndex,
          user2NewVoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(user2Keypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      });

      it("should perform the processing and tallying correctly", () => {
        poll.processMessages(pollId);
        poll.tallyVotes();
        expect(poll.perVOSpentVoiceCredits[0].toString()).to.eq((user1NewVoteWeight * user1NewVoteWeight).toString());
        expect(poll.perVOSpentVoiceCredits[1].toString()).to.eq((user2NewVoteWeight * user2NewVoteWeight).toString());
      });

      it("should confirm that the users key pairs were changed", () => {
        const stateLeaf1 = poll.stateLeaves[user1StateIndex];
        const stateLeaf2 = poll.stateLeaves[user2StateIndex];
        expect(stateLeaf1.pubKey.equals(user1SecondKeypair.pubKey)).to.eq(true);
        expect(stateLeaf2.pubKey.equals(user2SecondKeypair.pubKey)).to.eq(true);
      });
    });

    describe("user1 changes key, but messages are in different batches", () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      let poll: Poll;

      before(() => {
        // Sign up
        user1StateIndex = maciState.signUp(
          user1Keypair.pubKey,
          voiceCreditBalance,
          BigInt(Math.floor(Date.now() / 1000)),
        );

        // deploy a poll
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

      it("should submit a vote for one user in one batch", () => {
        const command1 = new PCommand(
          BigInt(user1StateIndex),
          user1Keypair.pubKey,
          user1VoteOptionIndex,
          user1VoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature1 = command1.sign(user1Keypair.privKey);

        const ecdhKeypair1 = new Keypair();
        const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);

        const message1 = command1.encrypt(signature1, sharedKey1);
        poll.publishMessage(message1, ecdhKeypair1.pubKey);
      });

      it("should fill the batch with random messages", () => {
        for (let i = 0; i < messageBatchSize - 1; i += 1) {
          const command = new PCommand(
            1n,
            user1Keypair.pubKey,
            user1VoteOptionIndex,
            user1VoteWeight,
            2n,
            BigInt(pollId),
          );

          const signature = command.sign(user1Keypair.privKey);

          const ecdhKeypair = new Keypair();
          const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

          const message = command.encrypt(signature, sharedKey);
          poll.publishMessage(message, ecdhKeypair.pubKey);
        }
      });

      it("should submit a new message in a new batch", () => {
        const command1 = new PCommand(
          BigInt(user1StateIndex),
          user1SecondKeypair.pubKey,
          user1VoteOptionIndex,
          user1NewVoteWeight,
          1n,
          BigInt(pollId),
        );

        const signature1 = command1.sign(user1Keypair.privKey);

        const ecdhKeypair1 = new Keypair();
        const sharedKey1 = Keypair.genEcdhSharedKey(ecdhKeypair1.privKey, coordinatorKeypair.pubKey);

        const message1 = command1.encrypt(signature1, sharedKey1);
        poll.publishMessage(message1, ecdhKeypair1.pubKey);
      });

      it("should perform the processing and tallying correctly", () => {
        poll.processAllMessages();
        poll.tallyVotes();
        expect(poll.perVOSpentVoiceCredits[0].toString()).to.eq((user1NewVoteWeight * user1NewVoteWeight).toString());
      });

      it("should confirm that the user key pair was changed", () => {
        const stateLeaf1 = poll.stateLeaves[user1StateIndex];
        expect(stateLeaf1.pubKey.equals(user1SecondKeypair.pubKey)).to.eq(true);
      });
    });
  });

  describe("Process and tally 1 message from 1 user", () => {
    let maciState: MaciState;
    let pollId: bigint;
    let poll: Poll;
    let msgTree: IncrementalQuinTree;
    let stateTree: IncrementalQuinTree;
    const voteWeight = 9n;
    const voteOptionIndex = 0n;
    let stateIndex: number;
    const userKeypair = new Keypair();

    before(() => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      msgTree = new IncrementalQuinTree(treeDepths.messageTreeDepth, NOTHING_UP_MY_SLEEVE, 5, hash5);
      stateTree = new IncrementalQuinTree(STATE_TREE_DEPTH, blankStateLeafHash, STATE_TREE_ARITY, hash5);

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
    });

    // The end result should be that option 0 gets 3 votes
    // because the user spends 9 voice credits on it
    it("the state root should be correct", () => {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      const stateLeaf = new StateLeaf(userKeypair.pubKey, voiceCreditBalance, timestamp);

      stateIndex = maciState.signUp(userKeypair.pubKey, voiceCreditBalance, timestamp);
      stateTree.insert(blankStateLeafHash);
      stateTree.insert(stateLeaf.hash());

      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      expect(stateIndex.toString()).to.eq("1");
      expect(stateTree.root.toString()).to.eq(poll.stateTree?.root.toString());
    });

    it("the message root should be correct", () => {
      const command = new PCommand(
        BigInt(stateIndex),
        userKeypair.pubKey,
        voteOptionIndex,
        voteWeight,
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      msgTree.insert(message.hash(ecdhKeypair.pubKey));

      // Use the accumulator queue to compare the root of the message tree
      const accumulatorQueue: AccQueue = new AccQueue(
        treeDepths.messageTreeSubDepth,
        STATE_TREE_ARITY,
        NOTHING_UP_MY_SLEEVE,
      );
      accumulatorQueue.enqueue(message.hash(ecdhKeypair.pubKey));
      accumulatorQueue.mergeSubRoots(0);
      accumulatorQueue.merge(treeDepths.messageTreeDepth);

      expect(accumulatorQueue.getRoot(treeDepths.messageTreeDepth)?.toString()).to.eq(msgTree.root.toString());
    });

    it("packProcessMessageSmallVals and unpackProcessMessageSmallVals", () => {
      const maxVoteOptions = 1n;
      const numUsers = 2n;
      const batchStartIndex = 5;
      const batchEndIndex = 10;
      const packedVals = packProcessMessageSmallVals(maxVoteOptions, numUsers, batchStartIndex, batchEndIndex);

      const unpacked = unpackProcessMessageSmallVals(packedVals);
      expect(unpacked.maxVoteOptions.toString()).to.eq(maxVoteOptions.toString());
      expect(unpacked.numUsers.toString()).to.eq(numUsers.toString());
      expect(unpacked.batchStartIndex.toString()).to.eq(batchStartIndex.toString());
      expect(unpacked.batchEndIndex.toString()).to.eq(batchEndIndex.toString());
    });

    it("Process a batch of messages (though only 1 message is in the batch)", () => {
      poll.processMessages(pollId);

      // Check the ballot
      expect(poll.ballots[1].votes[Number(voteOptionIndex)].toString()).to.eq(voteWeight.toString());
      // Check the state leaf in the poll
      expect(poll.stateLeaves[1].voiceCreditBalance.toString()).to.eq(
        (voiceCreditBalance - voteWeight * voteWeight).toString(),
      );
    });

    it("Tally ballots", () => {
      const initialTotal = calculateTotal(poll.tallyResult);
      expect(initialTotal.toString()).to.eq("0");

      expect(poll.hasUntalliedBallots()).to.eq(true);

      poll.tallyVotes();

      const finalTotal = calculateTotal(poll.tallyResult);
      expect(finalTotal.toString()).to.eq(voteWeight.toString());
    });
  });

  describe(`Process and tally ${messageBatchSize * 2} messages from ${messageBatchSize} users`, () => {
    let maciState: MaciState;
    let pollId: bigint;
    let poll: Poll;
    const voteWeight = 9n;

    const users: Keypair[] = [];

    before(() => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      // Sign up and vote
      for (let i = 0; i < messageBatchSize - 1; i += 1) {
        const userKeypair = new Keypair();
        users.push(userKeypair);

        maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
      }

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

    it("should process votes correctly", () => {
      // 24 valid votes
      for (let i = 0; i < messageBatchSize - 1; i += 1) {
        const userKeypair = users[i];

        const command = new PCommand(
          BigInt(i + 1),
          userKeypair.pubKey,
          BigInt(i), // vote option index
          voteWeight,
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(userKeypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      }

      expect(poll.messages.length).to.eq(messageBatchSize - 1);

      // 24 invalid votes
      for (let i = 0; i < messageBatchSize - 1; i += 1) {
        const userKeypair = users[i];
        const command = new PCommand(
          BigInt(i + 1),
          userKeypair.pubKey,
          BigInt(i), // vote option index
          voiceCreditBalance * 2n, // invalid vote weight
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(userKeypair.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.pubKey);
      }

      // 48 messages in total
      expect(poll.messages.length).to.eq(2 * (messageBatchSize - 1));

      expect(poll.currentMessageBatchIndex).to.eq(undefined);
      expect(poll.numBatchesProcessed).to.eq(0);

      // Process messages
      poll.processMessages(pollId);

      // currentMessageBatchIndex is 0 because the current batch starts
      // with index 0.
      expect(poll.currentMessageBatchIndex).to.eq(0);
      expect(poll.numBatchesProcessed).to.eq(1);

      // Process messages
      poll.processMessages(pollId);

      expect(poll.currentMessageBatchIndex).to.eq(0);
      expect(poll.numBatchesProcessed).to.eq(2);

      for (let i = 1; i < messageBatchSize; i += 1) {
        const leaf = poll.ballots[i].votes[i - 1];
        expect(leaf.toString()).to.eq(voteWeight.toString());
      }

      // Test processAllMessages
      const r = poll.processAllMessages();

      expect(r.stateLeaves.length).to.eq(poll.stateLeaves.length);

      expect(r.ballots.length).to.eq(poll.ballots.length);

      expect(r.ballots.length).to.eq(r.stateLeaves.length);

      for (let i = 0; i < r.stateLeaves.length; i += 1) {
        expect(r.stateLeaves[i].equals(poll.stateLeaves[i])).to.eq(true);

        expect(r.ballots[i].equals(poll.ballots[i])).to.eq(true);
      }
    });

    it("should tally ballots correctly", () => {
      // Start with tallyResult = [0...0]
      const total = calculateTotal(poll.tallyResult);
      expect(total.toString()).to.eq("0");

      // Check that there are untallied results
      expect(poll.hasUntalliedBallots()).to.eq(true);

      // First batch tally
      poll.tallyVotes();

      // Recall that each user `i` cast the same number of votes for
      // their option `i`
      for (let i = 0; i < poll.tallyResult.length - 1; i += 1) {
        expect(poll.tallyResult[i].toString()).to.eq(voteWeight.toString());
      }

      expect(poll.hasUntalliedBallots()).to.eq(false);

      expect(() => {
        poll.tallyVotes();
      }).to.throw();
    });
  });

  describe("Process and tally with non quadratic voting", () => {
    let maciState: MaciState;
    let pollId: bigint;
    let poll: Poll;
    let msgTree: IncrementalQuinTree;
    let stateTree: IncrementalQuinTree;
    const voteWeight = 9n;
    const voteOptionIndex = 0n;
    let stateIndex: number;
    const userKeypair = new Keypair();
    const useQv = false;

    before(() => {
      maciState = new MaciState(STATE_TREE_DEPTH);
      msgTree = new IncrementalQuinTree(treeDepths.messageTreeDepth, NOTHING_UP_MY_SLEEVE, 5, hash5);
      stateTree = new IncrementalQuinTree(STATE_TREE_DEPTH, blankStateLeafHash, STATE_TREE_ARITY, hash5);

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;

      const timestamp = BigInt(Math.floor(Date.now() / 1000));
      const stateLeaf = new StateLeaf(userKeypair.pubKey, voiceCreditBalance, timestamp);

      stateIndex = maciState.signUp(userKeypair.pubKey, voiceCreditBalance, timestamp);
      stateTree.insert(blankStateLeafHash);
      stateTree.insert(stateLeaf.hash());

      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      const command = new PCommand(
        BigInt(stateIndex),
        userKeypair.pubKey,
        voteOptionIndex,
        voteWeight,
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(userKeypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      msgTree.insert(message.hash(ecdhKeypair.pubKey));
    });

    it("Process a batch of messages (though only 1 message is in the batch)", () => {
      poll.processMessages(pollId, useQv);

      // Check the ballot
      expect(poll.ballots[1].votes[Number(voteOptionIndex)].toString()).to.eq(voteWeight.toString());
      // Check the state leaf in the poll
      expect(poll.stateLeaves[1].voiceCreditBalance.toString()).to.eq((voiceCreditBalance - voteWeight).toString());
    });

    it("Tally ballots", () => {
      const initialTotal = calculateTotal(poll.tallyResult);
      expect(initialTotal.toString()).to.eq("0");

      expect(poll.hasUntalliedBallots()).to.eq(true);

      poll.tallyVotes(useQv);

      const finalTotal = calculateTotal(poll.tallyResult);
      expect(finalTotal.toString()).to.eq(voteWeight.toString());

      // check that the perVOSpentVoiceCredits is correct
      expect(poll.perVOSpentVoiceCredits[0].toString()).to.eq(voteWeight.toString());

      // check that the totalSpentVoiceCredits is correct
      expect(poll.totalSpentVoiceCredits.toString()).to.eq(voteWeight.toString());
    });
  });

  describe("Sanity checks", () => {
    let testHarness: TestHarness;
    let poll: Poll;

    beforeEach(() => {
      testHarness = new TestHarness();

      poll = testHarness.poll;
    });

    it("should process a valid message", () => {
      const voteOptionIndex = 0n;
      const voteWeight = 9n;
      const nonce = 1n;

      const users = testHarness.createUsers(1);
      testHarness.vote(users[0], testHarness.getStateIndex(users[0]), voteOptionIndex, voteWeight, nonce);
      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 9n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    it("should not process messages twice", () => {
      const voteOptionIndex = 0n;
      const voteWeight = 9n;
      const nonce = 1n;

      const users = testHarness.createUsers(1);
      testHarness.vote(users[0], testHarness.getStateIndex(users[0]), voteOptionIndex, voteWeight, nonce);

      poll.updatePoll(BigInt(testHarness.maciState.stateLeaves.length));
      poll.processMessages(testHarness.pollId);

      expect(() => {
        poll.processMessages(testHarness.pollId);
      }).to.throw("No more messages to process");

      poll.tallyVotes();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 9n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    it("should not process a message with an incorrect nonce", () => {
      const voteOptionIndex = 0n;
      const voteWeight = 9n;

      const users = testHarness.createUsers(5);
      // generate a bunch of invalid votes with nonces that are not 1
      let nonce: bigint;
      users.forEach((user) => {
        do {
          nonce = BigInt(Math.floor(Math.random() * 100) - 50);
        } while (nonce === 1n);

        testHarness.vote(user, testHarness.getStateIndex(user), voteOptionIndex, voteWeight, nonce);
      });

      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 0n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    // note: When voting, the voice credit is used. The amount of voice credit used is
    // the square of the vote weight. Since the maximum voice credit is 100 here,
    // the vote weight can only be a value between 1 and 10
    // (as these are the square roots of numbers up to 100).
    it("should not process a message with an incorrect vote weight", () => {
      const voteOptionIndex = 0n;
      const nonce = 1n;

      const users = testHarness.createUsers(5);

      // generate a bunch of invalid votes with vote weights that are not between 1 and 10
      let voteWeight: bigint;
      users.forEach((user) => {
        do {
          voteWeight = BigInt(Math.floor(Math.random() * 100) - 50);
        } while (voteWeight >= 1n && voteWeight <= 10n);

        testHarness.vote(user, testHarness.getStateIndex(user), voteOptionIndex, voteWeight, nonce);
      });

      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 0n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    it("should not process a message with an incorrect state tree index", () => {
      const voteOptionIndex = 0n;
      const nonce = 1n;
      const voteWeight = 9n;
      const numVotes = 5;

      const users = testHarness.createUsers(5);

      users.forEach((user) => {
        // generate a bunch of invalid votes with incorrect state tree index
        testHarness.vote(user, testHarness.getStateIndex(user) + 1, voteOptionIndex, voteWeight, nonce);
      });

      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = numVotes;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 0n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    it("should not process a message with an incorrect signature", () => {
      const voteOptionIndex = 0n;
      const voteWeight = 9n;
      const nonce = 1n;

      const users = testHarness.createUsers(2);

      const { command } = testHarness.createCommand(
        users[0],
        testHarness.getStateIndex(users[0]),
        voteOptionIndex,
        voteWeight,
        nonce,
      );

      // create an invalid signature
      const { signature: invalidSignature } = testHarness.createCommand(
        users[1],
        testHarness.getStateIndex(users[0]),
        voteOptionIndex,
        voteWeight,
        nonce,
      );

      // sign the command with the invalid signature
      const { message, encPubKey } = testHarness.createMessage(
        command,
        invalidSignature,
        testHarness.coordinatorKeypair,
      );

      testHarness.poll.publishMessage(message, encPubKey);
      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length - 1;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 0n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });

    it("should not process a message with an invalid coordinator key", () => {
      const voteOptionIndex = 0n;
      const voteWeight = 9n;
      const nonce = 1n;

      const users = testHarness.createUsers(1);

      const { command, signature } = testHarness.createCommand(
        users[0],
        testHarness.getStateIndex(users[0]),
        voteOptionIndex,
        voteWeight,
        nonce,
      );

      const { message, encPubKey } = testHarness.createMessage(command, signature, new Keypair());

      testHarness.poll.publishMessage(message, encPubKey);
      testHarness.finalizePoll();

      const messageLengthResult = poll.messages.length;
      const expectedNumVotes = users.length;
      expect(messageLengthResult).to.eq(expectedNumVotes);

      const tallyResult = poll.tallyResult[0];
      const expectedTallyResult = 0n;
      expect(tallyResult).to.eq(expectedTallyResult);
    });
  });
});
