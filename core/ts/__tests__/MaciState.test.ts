import { expect } from "chai";
import { PCommand, Message, Keypair } from "maci-domainobjs";

import fs from "fs";

import { MaciState } from "../MaciState";
import { STATE_TREE_DEPTH } from "../utils/constants";
import { IJsonMaciState } from "../utils/types";

import {
  coordinatorKeypair,
  duration,
  maxValues,
  messageBatchSize,
  treeDepths,
  voiceCreditBalance,
} from "./utils/constants";

describe("MaciState", function test() {
  this.timeout(100000);

  describe("copy", () => {
    let pollId: bigint;
    let m1: MaciState;
    const userKeypair = new Keypair();
    const stateFile = "./state.json";

    after(() => {
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
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
      const command = new PCommand(0n, userKeypair.pubKey, 0n, 0n, 0n, BigInt(pollId), 0n);

      const encKeypair = new Keypair();
      const signature = command.sign(encKeypair.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorKeypair.pubKey);
      const message: Message = command.encrypt(signature, sharedKey);

      m1.polls.get(pollId)!.publishMessage(message, encKeypair.pubKey);
      m1.polls.get(pollId)!.publishMessage(message, encKeypair.pubKey);
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
      m4.stateLeaves[0].voiceCreditBalance = BigInt(m4.stateLeaves[0].voiceCreditBalance) + 1n;
      expect(m1.equals(m4)).not.to.eq(true);

      // modify poll.coordinatorKeypair
      const m6 = m1.copy();
      m6.polls.get(pollId)!.coordinatorKeypair = new Keypair();
      expect(m1.equals(m6)).not.to.eq(true);

      // modify poll.treeDepths.intStateTreeDepth
      const m9 = m1.copy();
      m9.polls.get(pollId)!.treeDepths.intStateTreeDepth += 1;
      expect(m1.equals(m9)).not.to.eq(true);

      // modify poll.treeDepths.messageTreeDepth
      const m10 = m1.copy();
      m10.polls.get(pollId)!.treeDepths.messageTreeDepth += 1;
      expect(m1.equals(m10)).not.to.eq(true);

      // modify poll.treeDepths.messageTreeSubDepth
      const m11 = m1.copy();
      m11.polls.get(pollId)!.treeDepths.messageTreeSubDepth += 1;
      expect(m1.equals(m11)).not.to.eq(true);

      // modify poll.treeDepths.voteOptionTreeDepth
      const m12 = m1.copy();
      m12.polls.get(pollId)!.treeDepths.voteOptionTreeDepth += 1;
      expect(m1.equals(m12)).not.to.eq(true);

      // modify poll.batchSizes.tallyBatchSize
      const m13 = m1.copy();
      m13.polls.get(pollId)!.batchSizes.tallyBatchSize += 1;
      expect(m1.equals(m13)).not.to.eq(true);

      // modify poll.batchSizes.messageBatchSize
      const m14 = m1.copy();
      m14.polls.get(pollId)!.batchSizes.messageBatchSize += 1;
      expect(m1.equals(m14)).not.to.eq(true);

      // modify poll.maxValues.maxMessages
      const m16 = m1.copy();
      m16.polls.get(pollId)!.maxValues.maxMessages += 1;
      expect(m1.equals(m16)).not.to.eq(true);

      // modify poll.maxValues.maxVoteOptions
      const m17 = m1.copy();
      m17.polls.get(pollId)!.maxValues.maxVoteOptions += 1;
      expect(m1.equals(m17)).not.to.eq(true);

      // modify poll.messages
      const m20 = m1.copy();
      m20.polls.get(pollId)!.messages[0].data[0] = BigInt(m20.polls.get(pollId)!.messages[0].data[0]) + 1n;
      expect(m1.equals(m20)).not.to.eq(true);

      // modify poll.encPubKeys
      const m21 = m1.copy();
      m21.polls.get(pollId)!.encPubKeys[0] = new Keypair().pubKey;
      expect(m1.equals(m21)).not.to.eq(true);
    });

    it("should create a JSON object from a MaciState object", () => {
      // test loading a topup message
      m1.polls.get(pollId)!.topupMessage(new Message(2n, [0n, 5n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]));

      // mock a message with invalid message type
      m1.polls.get(pollId)!.messages[1].msgType = 3n;
      const json = m1.toJSON();
      fs.writeFileSync(stateFile, JSON.stringify(json, null, 4));
      const content = JSON.parse(fs.readFileSync(stateFile).toString()) as IJsonMaciState;
      const state = MaciState.fromJSON(content);
      state.polls.forEach((poll) => {
        poll.setCoordinatorKeypair(coordinatorKeypair.privKey.serialize());
        expect(poll.coordinatorKeypair.equals(coordinatorKeypair)).to.eq(true);
      });

      expect(state.equals(m1)).to.eq(true);
    });
  });

  describe("deployNullPoll ", () => {
    it("should deploy a Poll that is null", () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      maciState.deployNullPoll();
      expect(maciState.polls.get(0n)).to.eq(null);
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
    const poll = maciState.polls.get(pollId)!;

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
