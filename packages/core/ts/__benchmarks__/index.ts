import { Keypair, VoteCommand } from "@maci-protocol/domainobjs";
import benny from "benny";

import { EMode, MaciState } from "..";
import { maxVoteOptions } from "../__tests__/utils/constants";

import {
  COORDINATOR_KEYPAIR,
  DURATION,
  MESSAGE_BATCH_SIZE,
  STATE_TREE_DEPTH,
  TREE_DEPTHS,
  VOICE_CREDIT_BALANCE,
} from "./utils/constants";

const NAME = "maci-core";

export default function runCore(): void {
  benny.suite(
    NAME,

    benny.add(`maci-core - Generate circuit inputs for 10 signups and 50 messages`, () => {
      const voteWeight = 9n;

      const users: Keypair[] = [];

      const maciState = new MaciState(STATE_TREE_DEPTH);
      // Sign up and vote
      for (let i = 0; i < MESSAGE_BATCH_SIZE - 1; i += 1) {
        const userKeypair = new Keypair();
        users.push(userKeypair);

        maciState.signUp(userKeypair.publicKey);
      }

      const pollId = maciState.deployPoll(
        BigInt(Math.floor(Date.now() / 1000) + DURATION),
        TREE_DEPTHS,
        MESSAGE_BATCH_SIZE,
        COORDINATOR_KEYPAIR,
        maxVoteOptions,
        EMode.QV,
      );
      const poll = maciState.polls.get(pollId)!;

      poll.updatePoll(BigInt(maciState.publicKeys.length));

      // 4 valid votes
      for (let i = 0; i < MESSAGE_BATCH_SIZE - 1; i += 1) {
        const userKeypair = users[i];

        const command = new VoteCommand(
          BigInt(i + 1),
          userKeypair.publicKey,
          BigInt(i), // vote option index
          voteWeight,
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(userKeypair.privateKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.generateEcdhSharedKey(ecdhKeypair.privateKey, COORDINATOR_KEYPAIR.publicKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.publicKey);
      }

      // 4 invalid votes
      for (let i = 0; i < MESSAGE_BATCH_SIZE - 1; i += 1) {
        const userKeypair = users[i];
        const command = new VoteCommand(
          BigInt(i + 1),
          userKeypair.publicKey,
          BigInt(i), // vote option index
          VOICE_CREDIT_BALANCE * 2n, // invalid vote weight
          1n,
          BigInt(pollId),
        );

        const signature = command.sign(userKeypair.privateKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.generateEcdhSharedKey(ecdhKeypair.privateKey, COORDINATOR_KEYPAIR.publicKey);
        const message = command.encrypt(signature, sharedKey);
        poll.publishMessage(message, ecdhKeypair.publicKey);
      }

      // Process messages
      poll.processMessages(pollId);

      // Process messages
      poll.processMessages(pollId);

      // Test processAllMessages
      poll.processAllMessages();
    }),

    benny.cycle(),
    benny.complete((results) => {
      results.results.forEach((result) => {
        // eslint-disable-next-line no-console
        console.log(`${result.name}: mean time: ${result.details.mean.toFixed(2)}`);
      });
    }),

    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, version: "1.0.0", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "chart.html", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "table.html", details: true }),
  );
}

runCore();
