import benny from "benny";
import { genProof } from "maci-circuits";
import { CircuitInputs, MaciState } from "maci-core";
import { Keypair, PCommand } from "maci-domainobjs";

// import { homedir } from "os";
import path from "path";

import {
  STATE_TREE_DEPTH,
  DURATION,
  MAX_VALUES,
  TREE_DEPTHS,
  VOICE_CREDIT_BALANCE,
} from "../__tests__/utils/constants";

const NAME = "proof generation";

// eslint-disable-next-line @typescript-eslint/require-await
export default async function runBenchmarks(): Promise<void> {
  const coordinatorKeypair = new Keypair();

  const messageBatchSize = 5;

  const users = new Array<Keypair>(5).fill(new Keypair());

  const genProofWasm = {
    useWasm: true,
    wasmPath: path.resolve(
      __dirname,
      "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm",
    ),
    zkeyPath: path.resolve(
      __dirname,
      "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
    ),
  };

  // const genProofRapidsnark = {
  //     useWasm: false,
  //     rapidsnarkExePath: `${homedir()}/rapidsnark/build/prover`,
  //     witnessExePath: path.resolve(
  //       __dirname,
  //       "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_cpp/ProcessMessages_10-2-1-2_test",
  //     ),
  //     zkeyPath: path.resolve(
  //       __dirname,
  //       "../../../cli/zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey",
  //     ),
  // }

  benny.suite(
    NAME,
    // first benchmark suite 5 signups, 5 messages using wasm witness
    benny.add(`wasm genProof - 5 signups, 5 messages`, async () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(DURATION),
        MAX_VALUES,
        TREE_DEPTHS,
        messageBatchSize,
        coordinatorKeypair,
      );
      const poll = maciState.polls.get(pollId);

      // signup 5 users
      users.forEach((user) => {
        maciState.signUp(user.pubKey, VOICE_CREDIT_BALANCE, BigInt(Date.now()));
        // First command (valid)
        const command = new PCommand(
          BigInt(users.indexOf(user)) + 1n,
          user.pubKey,
          5n, // voteOptionIndex,
          7n, // vote weight
          2n, // nonce
          pollId,
        );

        const signature = command.sign(user.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll?.publishMessage(message, ecdhKeypair.pubKey);
      });

      while (poll?.hasUnprocessedMessages()) {
        const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

        // eslint-disable-next-line no-await-in-loop
        await genProof({
          ...genProofWasm,
          inputs: pmInputs,
        });
      }
    }),

    // second benchmark suite 5 signups, 5 messages using c witness
    // benny.add(`rapidsnark genProof - 5 signups, 5 messages`, async () => {
    //   const maciState = new MaciState(STATE_TREE_DEPTH);
    //   const pollId = maciState.deployPoll(
    //     BigInt(duration),
    //     maxValues,
    //     treeDepths,
    //     messageBatchSize,
    //     coordinatorKeypair,
    //   );
    //   const poll = maciState.polls.get(pollId);

    //   // signup 5 users and submit 5 messages
    //   users.forEach((user) => {
    //     maciState.signUp(user.pubKey, voiceCreditBalance, BigInt(Date.now()));
    //     // First command (valid)
    //     const command = new PCommand(
    //       BigInt(users.indexOf(user)) + 1n,
    //       user.pubKey,
    //       5n, // voteOptionIndex,
    //       7n, // vote weight
    //       2n, // nonce
    //       pollId,
    //     );

    //     const signature = command.sign(user.privKey);

    //     const ecdhKeypair = new Keypair();
    //     const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
    //     const message = command.encrypt(signature, sharedKey);
    //     poll?.publishMessage(message, ecdhKeypair.pubKey);
    //   });

    //   while (poll?.hasUnprocessedMessages()) {
    //     const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

    //     // eslint-disable-next-line no-await-in-loop
    //     await genProof({
    //       ...genProofRapidsnark,
    //       inputs: pmInputs,
    //     });
    //   }
    // }),

    // first benchmark suite 5 signups, 1 message using wasm witness
    benny.add(`wasm genProof - 5 signups, 1 message`, async () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(DURATION),
        MAX_VALUES,
        TREE_DEPTHS,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls.get(pollId);

      // signup 5 users
      users.forEach((user) => {
        maciState.signUp(user.pubKey, VOICE_CREDIT_BALANCE, BigInt(Date.now()));
      });

      const keypair = users[0];
      // First command (valid)
      const command = new PCommand(
        1n, // BigInt(1),
        keypair.pubKey,
        5n, // voteOptionIndex,
        7n, // vote weight
        2n, // nonce
        pollId,
      );

      const signature = command.sign(keypair.privKey);

      const ecdhKeypair = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
      const message = command.encrypt(signature, sharedKey);
      poll?.publishMessage(message, ecdhKeypair.pubKey);

      while (poll?.hasUnprocessedMessages()) {
        const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

        // eslint-disable-next-line no-await-in-loop
        await genProof({
          ...genProofWasm,
          inputs: pmInputs,
        });
      }
    }),

    // first benchmark suite 5 signups, 1 message using c witness
    // benny.add(`rapidnsark genProof - 5 signups, 1 message`, async () => {
    //   const maciState = new MaciState(STATE_TREE_DEPTH);
    //   const pollId = maciState.deployPoll(
    //     BigInt(duration),
    //     maxValues,
    //     treeDepths,
    //     messageBatchSize,
    //     coordinatorKeypair,
    //   );

    //   const poll = maciState.polls.get(pollId);

    //   // signup 5 users
    //   users.forEach((user) => {
    //     maciState.signUp(user.pubKey, voiceCreditBalance, BigInt(Date.now()));
    //   })

    //   const keypair = users[0];
    //   // First command (valid)
    //   const command = new PCommand(
    //     1n, // BigInt(1),
    //     keypair.pubKey,
    //     5n, // voteOptionIndex,
    //     7n, // vote weight
    //     2n, // nonce
    //     pollId,
    //   );

    //   const signature = command.sign(keypair.privKey);

    //   const ecdhKeypair = new Keypair();
    //   const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
    //   const message = command.encrypt(signature, sharedKey);
    //   poll?.publishMessage(message, ecdhKeypair.pubKey);

    //   while (poll?.hasUnprocessedMessages()) {
    //     const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

    //     // eslint-disable-next-line no-await-in-loop
    //     await genProof({
    //       ...genProofRapidsnark,
    //       inputs: pmInputs,

    //     });
    //   }
    // }),

    // first benchmark suite 1 signup, 5 messages using wasm witness
    benny.add(`wasm genProof - 1 signup, 5 messages`, async () => {
      const maciState = new MaciState(STATE_TREE_DEPTH);
      const pollId = maciState.deployPoll(
        BigInt(DURATION),
        MAX_VALUES,
        TREE_DEPTHS,
        messageBatchSize,
        coordinatorKeypair,
      );

      const poll = maciState.polls.get(pollId);

      maciState.signUp(users[0].pubKey, VOICE_CREDIT_BALANCE, BigInt(Date.now()));

      // submit 5 messages
      users.forEach((user) => {
        // First command (valid)
        const command = new PCommand(
          BigInt(users.indexOf(user)) + 1n,
          user.pubKey,
          5n, // voteOptionIndex,
          7n, // vote weight
          2n, // nonce
          pollId,
        );

        const signature = command.sign(user.privKey);

        const ecdhKeypair = new Keypair();
        const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
        const message = command.encrypt(signature, sharedKey);
        poll?.publishMessage(message, ecdhKeypair.pubKey);
      });

      while (poll?.hasUnprocessedMessages()) {
        const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

        // eslint-disable-next-line no-await-in-loop
        await genProof({
          ...genProofWasm,
          inputs: pmInputs,
        });
      }
    }),

    // first benchmark suite 1 signup, 5 messages using c witness
    // benny.add(`rapidnsark genProof - 1 signup, 5 messages`, async () => {
    //   const maciState = new MaciState(STATE_TREE_DEPTH);
    //   const pollId = maciState.deployPoll(
    //     BigInt(duration),
    //     maxValues,
    //     treeDepths,
    //     messageBatchSize,
    //     coordinatorKeypair,
    //   );

    //   const poll = maciState.polls.get(pollId);

    //   maciState.signUp(users[0].pubKey, voiceCreditBalance, BigInt(Date.now()));

    //   // submit 5 messages
    //   users.forEach((user) => {
    //     // First command (valid)
    //     const command = new PCommand(
    //       BigInt(users.indexOf(user)) + 1n,
    //       user.pubKey,
    //       5n, // voteOptionIndex,
    //       7n, // vote weight
    //       2n, // nonce
    //       pollId,
    //     );

    //     const signature = command.sign(user.privKey);

    //     const ecdhKeypair = new Keypair();
    //     const sharedKey = Keypair.genEcdhSharedKey(ecdhKeypair.privKey, coordinatorKeypair.pubKey);
    //     const message = command.encrypt(signature, sharedKey);
    //     poll?.publishMessage(message, ecdhKeypair.pubKey);
    //   })

    //   while (poll?.hasUnprocessedMessages()) {
    //     const pmInputs = poll.processMessages(pollId) as unknown as CircuitInputs;

    //     // eslint-disable-next-line no-await-in-loop
    //     await genProof({
    //       ...genProofRapidsnark,
    //       inputs: pmInputs,
    //     });
    //   }
    // }),

    benny.cycle(),
    benny.complete(),

    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, version: "1.0.0", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "chart.html", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "table.html", details: true }),
  );
}

(async () => {
  await runBenchmarks();
})();
