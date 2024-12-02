import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { MaciState, Poll } from "maci-core";
import { poseidon } from "maci-crypto";
import { Keypair, Message, PCommand } from "maci-domainobjs";

import { IPollJoiningInputs } from "../types";

import { STATE_TREE_DEPTH, duration, messageBatchSize, treeDepths, voiceCreditBalance } from "./utils/constants";
import { circomkitInstance } from "./utils/utils";

describe("Poll Joining circuit", function test() {
  this.timeout(900000);
  const NUM_USERS = 50;

  const coordinatorKeypair = new Keypair();

  type PollJoiningCircuitInputs = [
    "privKey",
    "pollPrivKey",
    "pollPubKey",
    "stateLeaf",
    "siblings",
    "indices",
    "nullifier",
    "credits",
    "stateRoot",
    "actualStateTreeDepth",
  ];

  let circuit: WitnessTester<PollJoiningCircuitInputs>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("pollJoining", {
      file: "./anon/pollJoining",
      template: "PollJoining",
      params: [STATE_TREE_DEPTH],
    });
  });

  describe(`${NUM_USERS} users, 1 join`, () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    let pollId: bigint;
    let poll: Poll;
    let users: Keypair[];
    const { privKey: pollPrivKey, pubKey: pollPubKey } = new Keypair();
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up
      users = new Array(NUM_USERS).fill(0).map(() => new Keypair());

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

      // Join the poll
      const { privKey } = users[0];

      const nullifier = poseidon([BigInt(privKey.rawPrivKey.toString())]);
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      const stateIndex = BigInt(poll.joinPoll(nullifier, pollPubKey, voiceCreditBalance, timestamp));

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        pollPubKey,
        BigInt(0), // voteOptionIndex,
        BigInt(9), // vote weight
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

    it("should produce a proof", async () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(10);

      const inputs = poll.joiningCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex,
        credits,
        pollPrivKey,
        pollPubKey,
      }) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should fail for fake witness", async () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(10);

      const inputs = poll.joiningCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex,
        credits,
        pollPrivKey,
        pollPubKey,
      }) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);

      const fakeWitness = Array(witness.length).fill(1n) as bigint[];
      await circuit.expectConstraintFail(fakeWitness);
    });

    it("should fail for improper credits", () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(105);

      expect(() =>
        poll.joiningCircuitInputs({ maciPrivKey: privateKey, stateLeafIndex, credits, pollPrivKey, pollPubKey }),
      ).to.throw("Credits must be lower than signed up credits");
    });
  });
});
