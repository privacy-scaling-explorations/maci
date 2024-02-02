import { expect } from "chai";
import { PCommand, Message, Keypair, StateLeaf, PrivKey, Ballot } from "maci-domainobjs";

import { MaciState } from "../MaciState";
import { Poll } from "../Poll";
import { STATE_TREE_DEPTH } from "../utils/constants";

import {
  coordinatorKeypair,
  duration,
  maxValues,
  messageBatchSize,
  treeDepths,
  voiceCreditBalance,
} from "./utils/constants";

describe("Poll", function test() {
  this.timeout(90000);

  describe("processMessage", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls.get(pollId)!;

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    // copy the state from the MaciState ref
    poll.updatePoll(BigInt(maciState.stateLeaves.length));

    it("should throw if a message has an invalid state index", () => {
      const command = new PCommand(
        // invalid state index as it is one more than the number of state leaves
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        0n,
        1n,
        0n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid state leaf index");
    });

    it("should throw if a message has an invalid nonce", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, 0n, 0n, 0n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid nonce");
    });

    it("should throw if a message has an invalid signature", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, 0n, 0n, 0n, BigInt(pollId));

      const signature = command.sign(new PrivKey(0n));
      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid signature");
    });

    it("should throw if a message consumes more than the available voice credits for a user", () => {
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        0n,
        // voice credits spent would be this value ** this value
        BigInt(Math.sqrt(Number.parseInt(voiceCreditBalance.toString(), 10)) + 1),
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("insufficient voice credits");
    });

    it("should throw if a message has an invalid vote option index (>= max vote options)", () => {
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(maxValues.maxVoteOptions),
        // voice credits spent would be this value ** this value
        1n,
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid vote option index");
    });

    it("should throw if a message has an invalid vote option index (< 0)", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, -1n, 1n, 1n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid vote option index");
    });

    it("should throw when passed a message that cannot be decrypted (wrong encPubKey)", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, 0n, 1n, 1n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(new Keypair().privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      expect(() => {
        poll.processMessage(message, user1Keypair.pubKey);
      }).to.throw("failed decryption due to either wrong encryption public key or corrupted ciphertext");
    });

    it("should throw when passed a corrupted message", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, 0n, 1n, 1n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(user1Keypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      message.data[0] = 0n;

      expect(() => {
        poll.processMessage(message, user1Keypair.pubKey);
      }).to.throw("failed decryption due to either wrong encryption public key or corrupted ciphertext");
    });

    it("should throw when going over the voice credit limit (non qv)", () => {
      const command = new PCommand(
        // invalid state index as it is one more than the number of state leaves
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        0n,
        voiceCreditBalance + 1n,
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey, false);
      }).to.throw("insufficient voice credits");
    });

    it("should work when submitting a valid message (voteWeight === voiceCreditBalance and non qv)", () => {
      const command = new PCommand(
        // invalid state index as it is one more than the number of state leaves
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        0n,
        voiceCreditBalance,
        1n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.processMessage(message, ecdhKeypair.pubKey, false);
    });
  });

  describe("processMessages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls.get(pollId)!;
    poll.updatePoll(BigInt(maciState.stateLeaves.length));

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    it("should throw if this is the first batch and currentMessageBatchIndex is defined", () => {
      const command = new PCommand(BigInt(user1StateIndex), user1Keypair.pubKey, 0n, 1n, 0n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      // mock
      poll.currentMessageBatchIndex = 0;
      expect(() => poll.processMessages(pollId)).to.throw(
        "The current message batch index should not be defined if this is the first batch",
      );
      poll.currentMessageBatchIndex = undefined;
    });

    it("shuold throw if the state has not been copied prior to calling processMessages", () => {
      const tmpPoll = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );
      expect(() => maciState.polls.get(tmpPoll)?.processMessages(pollId)).to.throw(
        "You must update the poll with the correct data first",
      );
    });

    it("should succeed even if we send an invalid message", () => {
      const command = new PCommand(
        // we only signed up one user so the state index is invalid
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        0n,
        1n,
        0n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid state leaf index");

      // keep this call to complete processing
      // eslint-disable-next-line no-unused-expressions
      expect(() => poll.processMessages(pollId)).to.not.throw;
    });

    it("should correctly process a topup message and increase an user's voice credit balance", () => {
      const topupMessage = new Message(2n, [BigInt(user1StateIndex), 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);

      poll.topupMessage(topupMessage);

      const balanceBefore = poll.stateLeaves[user1StateIndex].voiceCreditBalance;

      poll.processMessages(pollId);

      // check balance
      expect(poll.stateLeaves[user1StateIndex].voiceCreditBalance.toString()).to.eq((balanceBefore + 50n).toString());
    });

    it("should throw when called after all messages have been processed", () => {
      expect(() => poll.processMessages(pollId)).to.throw("No more messages to process");
    });
  });

  describe("processAllMessages", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls.get(pollId)!;

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    poll.updatePoll(BigInt(maciState.stateLeaves.length));

    it("it should succeed even if send an invalid message", () => {
      const command = new PCommand(
        // we only signed up one user so the state index is invalid
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        0n,
        1n,
        0n,
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid state leaf index");

      expect(() => poll.processAllMessages()).to.not.throw();
    });

    it("should return the correct state leaves and ballots", () => {
      const command = new PCommand(BigInt(user1StateIndex + 1), user1Keypair.pubKey, 0n, 1n, 0n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      expect(() => {
        poll.processMessage(message, ecdhKeypair.pubKey);
      }).to.throw("invalid state leaf index");

      const { stateLeaves, ballots } = poll.processAllMessages();

      stateLeaves.forEach((leaf: StateLeaf, index: number) => expect(leaf.equals(poll.stateLeaves[index])).to.eq(true));
      ballots.forEach((ballot: Ballot, index: number) => expect(ballot.equals(poll.ballots[index])).to.eq(true));
    });

    it("should have processed all messages", () => {
      const command = new PCommand(BigInt(user1StateIndex + 1), user1Keypair.pubKey, 0n, 1n, 0n, BigInt(pollId));

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);

      // publish batch size + 1
      for (let i = 0; i <= messageBatchSize; i += 1) {
        poll.publishMessage(message, ecdhKeypair.pubKey);
      }

      poll.processAllMessages();

      expect(poll.hasUnprocessedMessages()).to.eq(false);
    });
  });

  describe("tallyVotes", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls.get(pollId)!;

    const user1Keypair = new Keypair();
    const user2Keypair = new Keypair();

    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    const user2StateIndex = maciState.signUp(
      user2Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    poll.updatePoll(BigInt(maciState.stateLeaves.length));

    const voteWeight = 5n;
    const voteOption = 0n;

    const command = new PCommand(
      BigInt(user1StateIndex),
      user1Keypair.pubKey,
      voteOption,
      voteWeight,
      1n,
      BigInt(pollId),
    );

    const signature = command.sign(user1Keypair.privKey);

    const ecdhKeypair = new Keypair();
    const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

    const message = command.encrypt(signature, sharedKey);
    poll.publishMessage(message, ecdhKeypair.pubKey);

    it("should throw if called before all messages have been processed", () => {
      expect(() => poll.tallyVotes()).to.throw("You must process the messages first");
    });

    it("should generate the correct results", () => {
      poll.processAllMessages();
      poll.tallyVotes();

      const spentVoiceCredits = poll.totalSpentVoiceCredits;
      const results = poll.tallyResult;
      expect(spentVoiceCredits).to.eq(voteWeight * voteWeight);
      expect(results[Number.parseInt(voteOption.toString(), 10)]).to.eq(voteWeight);
      expect(poll.perVOSpentVoiceCredits[Number.parseInt(voteOption.toString(), 10)]).to.eq(voteWeight * voteWeight);
    });

    it("should generate the correct results (non-qv)", () => {
      // deploy a second poll
      const secondPollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      const secondPoll = maciState.polls.get(secondPollId)!;
      secondPoll.updatePoll(BigInt(maciState.stateLeaves.length));

      const secondVoteWeight = 10n;
      const secondVoteOption = 1n;

      const secondCommand = new PCommand(
        BigInt(user2StateIndex),
        user2Keypair.pubKey,
        secondVoteOption,
        secondVoteWeight,
        1n,
        secondPollId,
      );

      const secondSignature = secondCommand.sign(user2Keypair.privKey);

      const secondEcdhKeypair = new Keypair();
      const secondSharedKey = Keypair.genEcdhSharedKey(secondEcdhKeypair.privKey, coordinatorKeypair.pubKey);

      const secondMessage = secondCommand.encrypt(secondSignature, secondSharedKey);
      secondPoll.publishMessage(secondMessage, secondEcdhKeypair.pubKey);

      secondPoll.processAllMessages();
      secondPoll.tallyVotes(false);

      const spentVoiceCredits = secondPoll.totalSpentVoiceCredits;
      const results = secondPoll.tallyResult;
      // spent voice credit is not vote weight * vote weight
      expect(spentVoiceCredits).to.eq(secondVoteWeight);
      expect(results[Number.parseInt(secondVoteOption.toString(), 10)]).to.eq(secondVoteWeight);
      // per VO spent voice credit is not vote weight * vote weight
      expect(secondPoll.perVOSpentVoiceCredits[Number.parseInt(secondVoteOption.toString(), 10)]).to.eq(
        secondVoteWeight,
      );
    });

    it("should throw when there are no more ballots to tally", () => {
      expect(() => poll.tallyVotes()).to.throw("No more ballots to tally");
    });
  });

  describe("subsidy", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls.get(pollId)!;

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    const voteWeight = 5n;
    const voteOption = 0n;

    const command = new PCommand(
      BigInt(user1StateIndex),
      user1Keypair.pubKey,
      voteOption,
      voteWeight,
      1n,
      BigInt(pollId),
    );

    const signature = command.sign(user1Keypair.privKey);

    const ecdhKeypair = new Keypair();
    const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

    const message = command.encrypt(signature, sharedKey);

    before(() => {
      poll.updatePoll(BigInt(maciState.stateLeaves.length));
      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.processAllMessages();
      poll.tallyVotes();
    });

    it("should calculate the subsidy", () => {
      const { rbi, cbi } = poll;
      expect(() => poll.subsidyPerBatch()).to.not.throw();
      const { rbi: newRbi, cbi: newCbi } = poll;
      expect(newRbi).to.eq(rbi + 1);
      expect(newCbi).to.eq(cbi + 1);
    });

    it("should throw when the subsidy was already calculated", () => {
      expect(() => poll.subsidyPerBatch()).to.throw("No more subsidy batches to calculate");
    });
  });

  describe("setCoordinatorKeypair", () => {
    it("should update the coordinator's Keypair", () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls.get(pollId)!;
      const newCoordinatorKeypair = new Keypair();
      poll.setCoordinatorKeypair(newCoordinatorKeypair.privKey.serialize());
      expect(poll.coordinatorKeypair.privKey.serialize()).to.deep.eq(newCoordinatorKeypair.privKey.serialize());
      expect(poll.coordinatorKeypair.pubKey.serialize()).to.deep.eq(newCoordinatorKeypair.pubKey.serialize());
    });
  });

  describe("setNumSignups", () => {
    it("should update the number of signups", () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      maciState.signUp(new Keypair().pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));

      const poll = maciState.polls.get(pollId)!;

      poll.updatePoll(BigInt(maciState.stateLeaves.length));

      expect(poll.getNumSignups()).to.eq(2n);

      // update it again
      poll.setNumSignups(3n);

      expect(poll.getNumSignups()).to.eq(3n);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON", () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls.get(pollId)!;
      const json = poll.toJSON();

      const pollFromJson = Poll.fromJSON(json, maciState);
      pollFromJson.setCoordinatorKeypair(coordinatorKeypair.privKey.serialize());
      expect(pollFromJson.equals(poll)).to.eq(true);
    });
  });
});
