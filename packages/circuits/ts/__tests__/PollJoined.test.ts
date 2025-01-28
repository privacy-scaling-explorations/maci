import { type WitnessTester } from "circomkit";
import { MaciState, Poll } from "maci-core";
import { poseidon } from "maci-crypto";
import { Keypair, Message, PCommand } from "maci-domainobjs";

import type { IPollJoinedInputs } from "../types";

import { STATE_TREE_DEPTH, duration, messageBatchSize, treeDepths, voiceCreditBalance } from "./utils/constants";
import { circomkitInstance } from "./utils/utils";

describe("Poll Joined circuit", function test() {
  this.timeout(900000);
  const NUM_USERS = 50;

  const coordinatorKeypair = new Keypair();

  type PollJoinedCircuitInputs = [
    "privKey",
    "voiceCreditsBalance",
    "joinTimestamp",
    "stateLeaf",
    "pathElements",
    "pathIndices",
    "stateRoot",
    "actualStateTreeDepth",
  ];

  let circuit: WitnessTester<PollJoinedCircuitInputs>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("pollJoined", {
      file: "./anon/poll",
      template: "PollJoined",
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

    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    before(() => {
      // Sign up
      users = new Array(NUM_USERS).fill(0).map(() => new Keypair());

      users.forEach((userKeypair) => {
        maciState.signUp(userKeypair.pubKey);
      });

      pollId = maciState.deployPoll(timestamp + BigInt(duration), treeDepths, messageBatchSize, coordinatorKeypair);

      poll = maciState.polls.get(pollId)!;

      // Join the poll
      const { privKey, pubKey: pollPubKey } = users[0];

      const nullifier = poseidon([BigInt(privKey.rawPrivKey.toString())]);

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

      const signature = command.sign(privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      messages.push(message);
      commands.push(command);

      poll.publishMessage(message, ecdhKeypair.pubKey);

      poll.updatePoll(BigInt(maciState.pubKeys.length));

      // Process messages
      poll.processMessages(pollId);
    });

    it("should produce a proof", async () => {
      const { privKey: privateKey, pubKey: pollPubKey } = users[0];
      const nullifier = poseidon([BigInt(privateKey.asCircuitInputs()), poll.pollId]);

      const stateLeafIndex = poll.joinPoll(nullifier, pollPubKey, voiceCreditBalance, timestamp);

      const inputs = poll.joinedCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex: BigInt(stateLeafIndex),
        voiceCreditsBalance: voiceCreditBalance,
        joinTimestamp: timestamp,
      }) as unknown as IPollJoinedInputs;

      const witness = await circuit.calculateWitness(inputs);
      await circuit.expectConstraintPass(witness);
    });

    it("should fail for fake witness", async () => {
      const { privKey: privateKey, pubKey: pollPubKey } = users[1];
      const nullifier = poseidon([BigInt(privateKey.asCircuitInputs()), poll.pollId]);

      const stateLeafIndex = poll.joinPoll(nullifier, pollPubKey, voiceCreditBalance, timestamp);

      const inputs = poll.joinedCircuitInputs({
        maciPrivKey: privateKey,
        stateLeafIndex: BigInt(stateLeafIndex),
        voiceCreditsBalance: voiceCreditBalance,
        joinTimestamp: timestamp,
      }) as unknown as IPollJoinedInputs;
      const witness = await circuit.calculateWitness(inputs);

      const fakeWitness = Array(witness.length).fill(1n) as bigint[];
      await circuit.expectConstraintFail(fakeWitness);
    });
  });
});
