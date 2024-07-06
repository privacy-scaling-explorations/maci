---
title: Poll Finalization
description: How to finalize a MACI Poll
sidebar_label: Poll Finalization
sidebar_position: 4
---

As a coordinator, first you need to merge signups and messages (votes). Messages are stored in a queue so when the poll is over, the coordinator needs to create the tree from the queue ([AccQueue](/docs/core-concepts/merkle-trees#accumulator-queue)). This optimization is needed to reduce gas cost for voters. Then coordinator generates proofs for the message processing, and tally calculations. This allows to publish the poll results on-chain and then everyone can verify the results when the poll is over.

This could be done using `maci-cli` or by running commands in the `contracts` folder.

## Finalize in `maci/contracts`

```bash
pnpm merge:[network] --poll 0
pnpm run prove:[network] --poll 0 \
    --coordinator-private-key "macisk.1751146b59d32e3c0d7426de411218172428263f93b2fc4d981c036047a4d8c0" \
    --tally-file ../cli/tally.json \
    --output-dir ../cli/proofs/ \
    --start-block 12946802
```

:::info
If the poll was configured to use quadratic voting, please ensure your prove command has the flag `--use-quadratic-voting`. Omitting the flag will make it work with non quadratic voting only. We also suggest including the `--start-block` flag, proving requires fetching all events from the smart contracts and by default starts from block zero, this would take a lot of time and is error-prone due to RPC provider limitations.
:::

The network options are: **_localhost, optimism, arbitrum, scroll, sepolia, optimism-sepolia, arbitrum-sepolia and scroll-sepolia_**, and the tasks flags and parameters are as follows:

| Command | Flags                                                            | Options                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| merge   |                                                                  | `--poll <pollId>`: the poll id <br/> `--queue-ops <queueOps>`: The number of queue operations to perform <br/> `--prove <prove>`: Run prove command after merging or not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| prove   | `--use-quadratic-voting`: Whether to use quadratic voting or not | `--poll <pollId>`: the poll id <br/> `--output-dir <outputDir>`: Output directory for proofs <br /> `--coordinator-private-key <coordinatorPrivateKey>`: Coordinator maci private key <br /> `--rapid-snark <rapidSnark>`: Rapidsnark binary path <br /> `--process-zkey <processKey>`: Process zkey file path <br /> `--process-witgen <processWitgen>`: Process witgen binary path <br /> `--process-wasm <processWasm>`: Process wasm file path <br /> `--tally-file <tallyFile>`: The file to store the tally proof <br /> `--tally-zkey <tallyZkey>`: Tally zkey file path <br /> `--tally-witgen <tallyWitgen>`: Tally witgen binary path <br /> `--tally-wasm <tallyWasm>`: Tally wasm file path <br /> `--state-file <stateFile>`: The file with the serialized maci state <br /> `--start-block <startBlock>`: The block number to start fetching logs from <br /> `--blocks-per-batch <blocksPerBatch>`: The number of blocks to fetch logs from <br /> `--end-block <endBlock>`: The block number to stop fetching logs from <br /> `--transaction-hash <transactionHash>`: The transaction hash of the first transaction |

## Via `maci-cli`

```bash
maci-cli mergeSignups --poll-id 0
maci-cli mergeMessages --poll-id 0
maci-cli genProofs \
    --privkey coordinator-private-key \
    --poll-id 0 \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey \
    --tally-file tally.json \
    --output proofs/ \
    --tally-wasm ./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test_js/TallyVotes_10-1-2_test.wasm \
    --process-wasm ./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test_js/ProcessMessages_10-2-1-2_test.wasm \
    --wasm \
    --useQuadraticVoting true
maci-cli proveOnChain \
    --poll-id 0 \
    --proof-dir proofs/
maci-cli verify \
    --poll-id 0 \
    --tally-file tally.json # this file is generated in genProofs
```

## Tally

After proofs are generated, and results tallied, the results (Tally) is written to a file. This file contains the result of a Poll. Let's take a look at one:

```json
{
  "maci": "0xd54b47F8e6A1b97F3A84f63c867286272b273b7C",
  "pollId": "0",
  "network": "localhost",
  "chainId": "31337",
  "isQuadratic": true,
  "tallyAddress": "0xD4fbAF1dFe100d07f8Ef73d8c92e93d0Bcf7b45D",
  "newTallyCommitment": "0x2f55cc85f7f141098ba791a9f6a646f8773b9bb4f5852ccc33b5a28e7b0756e5",
  "results": {
    "tally": [
      "9",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ],
    "salt": "0x2e9cd240b86cf456fa4deced8e7420c45e3c16941d2dcec308f8b6d48264dda3",
    "commitment": "0x296eac2a7289974f23497bebd39e86599d0b7032796fb84dcc1f6bbda38262ca"
  },
  "totalSpentVoiceCredits": {
    "spent": "81",
    "salt": "0x24f57b75c227987727c13d1e83409d70478b42bdc12a4a4df8129c72fbaf5aaf",
    "commitment": "0xb4ebe68b0da828c0b978ddee86ba934b8e215499ac766491f236ad85fd606de"
  },
  "perVOSpentVoiceCredits": {
    "tally": [
      "81",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ],
    "salt": "0x2590434ea2d600f7bd2396ba7fa454ad4c975c29424ee481561d9786538a5e48",
    "commitment": "0x54ec996599886da21c4b07c25d1de544292a8b7c38b79726995c869c9e95db"
  }
}
```

We see that there is an array named results, this contains the aggregated votes for each option, where each option is represented by an index in the array. In this case above, the first option (index 0) received a total of 9 votes, where every other option did not receive any votes.

The `totalSpentVoiceCredits` object contains the total amount of voice credits spent in the poll. This is the sum of all voice credits spent by all voters, and in quadratic voting, is the sum of the squares of all votes.

The `perVOSpentVoiceCredits` will contain the amount of voice credits spent per vote option. In this case, the first option received 81 voice credits, and every other option received 0 voice credits. This is because there was only one valid vote casted, with a weight of 9. Given the quadratic voting formula, the total amount of voice credits spent is 81.
