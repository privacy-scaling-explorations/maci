import { expect } from "chai";
import { PCommand, Message, Keypair, StateLeaf, PrivKey, Ballot } from "maci-domainobjs";

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";

import { MaciState } from "../MaciState";
import { STATE_TREE_DEPTH } from "../utils/constants";
import { IJsonMaciState } from "../utils/types";

import { coordinatorKeypair, duration, maxValues, messageBatchSize, treeDepths, voiceCreditBalance } from "./constants";

describe("MaciState", function test() {
  this.timeout(100000);

  describe("Deep copy", () => {
    let pollId: number;
    let m1: MaciState;
    const userKeypair = new Keypair();
    const stateFile = "./state.json";

    after(() => {
      if (existsSync(stateFile)) {
        unlinkSync(stateFile);
      }
    });

    before(() => {
      m1 = new MaciState(STATE_TREE_DEPTH);
      m1.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
      pollId = m1.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );
      const command = new PCommand(
        BigInt(0),
        userKeypair.pubKey,
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(pollId),
        BigInt(0),
      );

      const encKeypair = new Keypair();
      const signature = command.sign(encKeypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorKeypair.pubKey);
      const message: Message = command.encrypt(signature, sharedKey);

      m1.polls[pollId].publishMessage(message, encKeypair.pubKey);
    });

    it("should correctly deep-copy a MaciState object", () => {
      const m2 = m1.copy();

      // modify stateTreeDepth
      m2.stateTreeDepth += 1;
      expect(m1.equals(m2)).not.to.eq(true);

      // modify user.pubKey
      const m3 = m1.copy();
      m3.stateLeaves[0].pubKey = new Keypair().pubKey;
      expect(m1.equals(m3)).not.to.eq(true);

      // modify user.voiceCreditBalance
      const m4 = m1.copy();
      m4.stateLeaves[0].voiceCreditBalance = BigInt(m4.stateLeaves[0].voiceCreditBalance) + BigInt(1);
      expect(m1.equals(m4)).not.to.eq(true);

      // modify poll.coordinatorKeypair
      const m6 = m1.copy();
      m6.polls[pollId].coordinatorKeypair = new Keypair();
      expect(m1.equals(m6)).not.to.eq(true);

      // modify poll.treeDepths.intStateTreeDepth
      const m9 = m1.copy();
      m9.polls[pollId].treeDepths.intStateTreeDepth += 1;
      expect(m1.equals(m9)).not.to.eq(true);

      // modify poll.treeDepths.messageTreeDepth
      const m10 = m1.copy();
      m10.polls[pollId].treeDepths.messageTreeDepth += 1;
      expect(m1.equals(m10)).not.to.eq(true);

      // modify poll.treeDepths.messageTreeSubDepth
      const m11 = m1.copy();
      m11.polls[pollId].treeDepths.messageTreeSubDepth += 1;
      expect(m1.equals(m11)).not.to.eq(true);

      // modify poll.treeDepths.voteOptionTreeDepth
      const m12 = m1.copy();
      m12.polls[pollId].treeDepths.voteOptionTreeDepth += 1;
      expect(m1.equals(m12)).not.to.eq(true);

      // modify poll.batchSizes.tallyBatchSize
      const m13 = m1.copy();
      m13.polls[pollId].batchSizes.tallyBatchSize += 1;
      expect(m1.equals(m13)).not.to.eq(true);

      // modify poll.batchSizes.messageBatchSize
      const m14 = m1.copy();
      m14.polls[pollId].batchSizes.messageBatchSize += 1;
      expect(m1.equals(m14)).not.to.eq(true);

      // modify poll.maxValues.maxMessages
      const m16 = m1.copy();
      m16.polls[pollId].maxValues.maxMessages += 1;
      expect(m1.equals(m16)).not.to.eq(true);

      // modify poll.maxValues.maxVoteOptions
      const m17 = m1.copy();
      m17.polls[pollId].maxValues.maxVoteOptions += 1;
      expect(m1.equals(m17)).not.to.eq(true);

      // modify poll.messages
      const m20 = m1.copy();
      m20.polls[pollId].messages[0].data[0] = BigInt(m20.polls[pollId].messages[0].data[0]) + BigInt(1);
      expect(m1.equals(m20)).not.to.eq(true);

      // modify poll.encPubKeys
      const m21 = m1.copy();
      m21.polls[pollId].encPubKeys[0] = new Keypair().pubKey;
      expect(m1.equals(m21)).not.to.eq(true);
    });

    it("should create a JSON object from a MaciState object", () => {
      const json = m1.toJSON();
      writeFileSync(stateFile, JSON.stringify(json, null, 4));
      const content = JSON.parse(readFileSync(stateFile).toString()) as IJsonMaciState;
      const state = MaciState.fromJSON(content);
      state.polls.forEach((poll) => {
        poll.setCoordinatorKeypair(coordinatorKeypair.privKey.serialize());
        expect(poll.coordinatorKeypair.equals(coordinatorKeypair)).to.eq(true);
      });

      expect(state.equals(m1)).to.eq(true);
    });
  });

  describe("processMessage", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );

    const poll = maciState.polls[pollId];

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    // copy the state from the MaciState ref
    poll.copyStateFromMaci();

    it("should throw if a message has an invalid state index", () => {
      const command = new PCommand(
        // invalid state index as it is one more than the number of state leaves
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
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
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(pollId),
      );

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
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(pollId),
      );

      const signature = command.sign(new PrivKey(BigInt(0)));
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
        BigInt(0),
        // voice credits spent would be this value ** this value
        BigInt(Math.sqrt(Number.parseInt(voiceCreditBalance.toString(), 10)) + 1),
        BigInt(1),
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
        BigInt(1),
        BigInt(1),
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
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(-1),
        BigInt(1),
        BigInt(1),
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

    it("should throw when passed a message that cannot be decrypted (wrong encPubKey)", () => {
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(1),
        BigInt(pollId),
      );

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
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(1),
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(user1Keypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);

      message.data[0] = BigInt(0);

      expect(() => {
        poll.processMessage(message, user1Keypair.pubKey);
      }).to.throw("failed decryption due to either wrong encryption public key or corrupted ciphertext");
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

    const poll = maciState.polls[pollId];

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    it("should throw if this is the first batch and currentMessageBatchIndex is defined", () => {
      const command = new PCommand(
        BigInt(user1StateIndex),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
        BigInt(pollId),
      );

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

    it("should succeed even if send an invalid message", () => {
      const command = new PCommand(
        // we only signed up one user so the state index is invalid
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
        BigInt(pollId),
      );

      const signature = command.sign(user1Keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);

      const message = command.encrypt(signature, sharedKey);

      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.publishMessage(message, ecdhKeypair.pubKey);
      poll.copyStateFromMaci();
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

    const poll = maciState.polls[pollId];

    const user1Keypair = new Keypair();
    // signup the user
    const user1StateIndex = maciState.signUp(
      user1Keypair.pubKey,
      voiceCreditBalance,
      BigInt(Math.floor(Date.now() / 1000)),
    );

    it("it should succeed even if send an invalid message", () => {
      const command = new PCommand(
        // we only signed up one user so the state index is invalid
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
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
      const command = new PCommand(
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
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

      const { stateLeaves, ballots } = poll.processAllMessages();

      stateLeaves.forEach((leaf: StateLeaf, index: number) => expect(leaf.equals(poll.stateLeaves[index])).to.eq(true));
      ballots.forEach((ballot: Ballot, index: number) => expect(ballot.equals(poll.ballots[index])).to.eq(true));
    });

    it("should have processed all messages", () => {
      const command = new PCommand(
        BigInt(user1StateIndex + 1),
        user1Keypair.pubKey,
        BigInt(0),
        BigInt(1),
        BigInt(0),
        BigInt(pollId),
      );

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

  describe("topup", () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    const pollId = maciState.deployPoll(
      BigInt(Math.floor(Date.now() / 1000) + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinatorKeypair,
    );
    const poll = maciState.polls[pollId];

    it("should allow to publish a topup message", () => {
      const user1Keypair = new Keypair();
      // signup the user
      const user1StateIndex = maciState.signUp(
        user1Keypair.pubKey,
        voiceCreditBalance,
        BigInt(Math.floor(Date.now() / 1000)),
      );

      const message = new Message(2n, [BigInt(user1StateIndex), 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);

      poll.topupMessage(message);

      expect(poll.messages.length).to.eq(1);
    });

    it("should throw if the message has an invalid message type", () => {
      const message = new Message(1n, [1n, 50n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);

      expect(() => {
        poll.topupMessage(message);
      }).to.throw("A Topup message must have msgType 2");
    });
  });
});
