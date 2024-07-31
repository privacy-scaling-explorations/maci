import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { MaciState, Poll } from "maci-core";
import { Keypair } from "maci-domainobjs";

import { IPollJoiningInputs } from "../types";

import {
  STATE_TREE_DEPTH,
  duration,
  maxValues,
  messageBatchSize,
  treeDepths,
  voiceCreditBalance,
} from "./utils/constants";
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
    "inputHash",
  ];

  let circuit: WitnessTester<PollJoiningCircuitInputs>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("pollJoining", {
      file: "./core/qv/pollJoining",
      template: "PollJoining",
      params: [STATE_TREE_DEPTH],
    });
  });

  describe(`${NUM_USERS} users, 1 join`, () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    let pollId: bigint;
    let poll: Poll;
    let users: Keypair[];
    const pollKey = new Keypair();

    before(() => {
      // Sign up
      users = new Array(NUM_USERS).fill(0).map(() => new Keypair());

      users.forEach((userKeypair) => {
        maciState.signUp(userKeypair.pubKey, voiceCreditBalance, BigInt(Math.floor(Date.now() / 1000)));
      });

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        maxValues.maxVoteOptions,
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.stateLeaves.length));
    });

    it("should produce a proof", async () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(10);

      const inputs = poll.joiningCircuitInputs(
        privateKey,
        stateLeafIndex,
        credits,
        pollKey.privKey,
        pollKey.pubKey,
      ) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should fail for planted witness", async () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(10);

      const inputs = poll.joiningCircuitInputs(
        privateKey,
        stateLeafIndex,
        credits,
        pollKey.privKey,
        pollKey.pubKey,
      ) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await circuit.expectConstraintFail(Array(witness.length).fill(1n));
    });

    it("should fail for improper credits", () => {
      const privateKey = users[0].privKey;
      const stateLeafIndex = BigInt(1);
      const credits = BigInt(105);

      expect(() =>
        poll.joiningCircuitInputs(privateKey, stateLeafIndex, credits, pollKey.privKey, pollKey.pubKey),
      ).to.throw("Credits must be lower than signed up credits");
    });
  });
});
