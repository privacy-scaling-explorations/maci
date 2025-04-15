import { MaciState, Poll } from "@maci-protocol/core";
import { poseidon } from "@maci-protocol/crypto";
import { Keypair, Message, PCommand } from "@maci-protocol/domainobjs";
import { type WitnessTester } from "circomkit";

import { IPollJoiningInputs } from "../types";

import {
  STATE_TREE_DEPTH,
  duration,
  maxVoteOptions,
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
    "pollPubKey",
    "stateLeaf",
    "siblings",
    "indices",
    "nullifier",
    "stateRoot",
    "actualStateTreeDepth",
    "pollId",
  ];

  let circuit: WitnessTester<PollJoiningCircuitInputs>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("pollJoining", {
      file: "./voter/poll",
      template: "PollJoining",
      params: [STATE_TREE_DEPTH],
    });
  });

  describe(`${NUM_USERS} users, 1 join`, () => {
    const maciState = new MaciState(STATE_TREE_DEPTH);
    let pollId: bigint;
    let poll: Poll;
    let users: Keypair[];
    const messages: Message[] = [];
    const commands: PCommand[] = [];

    before(() => {
      // Sign up
      users = new Array(NUM_USERS).fill(0).map(() => new Keypair());

      users.forEach((userKeypair) => {
        maciState.signUp(userKeypair.pubKey);
      });

      pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + duration),
        treeDepths,
        messageBatchSize,
        coordinatorKeypair,
        maxVoteOptions,
      );

      poll = maciState.polls.get(pollId)!;
      poll.updatePoll(BigInt(maciState.pubKeys.length));

      // Join the poll
      const { privKey, pubKey } = users[0];

      const nullifier = poseidon([BigInt(privKey.rawPrivKey.toString())]);

      const stateIndex = BigInt(poll.joinPoll(nullifier, pubKey, voiceCreditBalance));

      // First command (valid)
      const command = new PCommand(
        stateIndex,
        pubKey,
        BigInt(0), // voteOptionIndex,
        BigInt(9), // vote weight
        BigInt(1), // nonce
        BigInt(pollId),
      );

      const signature = command.sign(privKey);

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
      const { privKey: privateKey, pubKey: pollPubKey } = users[0];
      const stateLeafIndex = BigInt(1);

      const inputs = poll.joiningCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex,
        pollPubKey,
      }) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should fail for fake witness", async () => {
      const { privKey: privateKey, pubKey: pollPubKey } = users[0];
      const stateLeafIndex = BigInt(1);

      const inputs = poll.joiningCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex,
        pollPubKey,
      }) as unknown as IPollJoiningInputs;
      const witness = await circuit.calculateWitness(inputs);

      const fakeWitness = Array(witness.length).fill(1n) as bigint[];
      await circuit.expectConstraintFail(fakeWitness);
    });
  });
});
