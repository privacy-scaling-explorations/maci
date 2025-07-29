---
title: Troubleshooting
description: How to troubleshoot MACI's failures
sidebar_label: Troubleshooting
sidebar_position: 5
---

# Troubleshooting

## cli: `generateProofs` command failure

### Case: missing `.dat` files

If your logs look like the following, then make sure you have `MessageProcessorQv_10-2-1-2_test.dat` and `VoteTallyQv_10-1-2_test.dat` files in the same directory as your zkeys:

```
node build/ts/index.js generateProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
>     -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
>     -o 0 \
>     -r ~/rapidsnark/build/prover \
>     -wp ./zkeys/MessageProcessorQv_10-2-1-2_test \
>     -wt ./zkeys/VoteTallyQv_10-1-2_test \
>     -zp ./zkeys/MessageProcessorQv_10-2-1-2_test.0.zkey \
>     -zt ./zkeys/VoteTallyQv_10-1-2_test.0.zkey \
>     -t tally.json \
>     -f proofs

fromBlock = 0
Generating proofs of message processing...
terminate called after throwing an instance of 'std::system_error'
  what():  open: No such file or directory
Aborted (core dumped)

terminate called after throwing an instance of 'std::system_error'
  what():  open: No such file or directory
Aborted (core dumped)

Error: could not generate proof.
Error: Error executing ./zkeys/MessageProcessorQv_10-2-1-2_test /tmp/tmp-9904-zG0k8YPTATWB/input.json /tmp/tmp-9904-zG0k8YPTATWB/output.wtns
    at genProof (/home/ubuntu/maci/circuits/ts/index.ts:44:15)
    at /home/ubuntu/maci/cli/ts/generateProofs.ts:339:25
    at step (/home/ubuntu/maci/cli/build/generateProofs.js:33:23)
    at Object.next (/home/ubuntu/maci/cli/build/generateProofs.js:14:53)
    at fulfilled (/home/ubuntu/maci/cli/build/generateProofs.js:5:58)
```

You can generate the missing `.dat` files using the following command:

```bash
pnpm build:circuits-c -- --outPath ../cli/zkeys
```

## contracts: `prove` command failure

### Case `Commitment mismatch`

If your log looks like the following, that's because you have already run the `prove` command. You can access the `cli` and attempt again by executing the `generateProofs` command.

```
Error: commitment mismatch
    at Prover.validateCommitment (/home/user/Documents/maci/contracts/tasks/helpers/Prover.ts:458:13)
    at Prover.proveTally (/home/user/Documents/maci/contracts/tasks/helpers/Prover.ts:390:12)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SimpleTaskDefinition.action (/home/user/Documents/maci/contracts/tasks/runner/prove.ts:235:7)
    at async Environment._runTaskDefinition (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/core/runtime-environment.ts:359:14)
    at async Environment.run (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/core/runtime-environment.ts:192:14)
    at async main (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/cli/cli.ts:323:7)
 ELIFECYCLE  Command failed with exit code 1.
 ELIFECYCLE  Command failed with exit code 1.
```

This is because commitments are generated using random salts, thus will differ at each `generateProofs` run.

In [core/Poll.ts](https://github.com/privacy-scaling-explorations/maci/blob/main/packages/core/ts/Poll.ts):

```
let newSbSalt = genRandomSalt();
while (this.sbSalts[this.currentMessageBatchIndex!] === newSbSalt) {
  newSbSalt = genRandomSalt();
}
```

## General Failure

### Case `AssertionError`

This could happen when you run `prove` in the `contracts` package, or run `generateProofs` in the `cli` package. If your log looks like the following, there are two possible reasons:

1. If your MACI keypair for the coordinator was generated based on a previous version, it may have been generated incorrectly due to a breaking change in a third-party package (`zk-kit/eddsa-poseidon`). Please generate a new pair and run the whole process again.
2. The provided private key is unmatched to the public key which deployed the poll, you will need to input the correct private key.

```
An unexpected error occurred:

AssertionError [ERR_ASSERTION]: false == true
    at genMaciStateFromContract (/home/user/Documents/maci/contracts/ts/genMaciState.ts:156:9)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SimpleTaskDefinition.action (/home/user/Documents/maci/contracts/tasks/runner/prove.ts:127:25)
    at async Environment._runTaskDefinition (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/core/runtime-environment.ts:359:14)
    at async Environment.run (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/core/runtime-environment.ts:192:14)
    at async main (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.3/node_modules/hardhat/src/internal/cli/cli.ts:323:7) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '=='
}
```

### Cannot filter non-indexed parameters

If you encountered the following error log:

```
TypeError: cannot filter non-indexed parameters; must be null (argument="contract._messageRoot", value=4658669366154318429589992378027343879410506110087584229116806667655891474709, code=INVALID_ARGUMENT, version=6.11.1)
    at makeError (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/utils/errors.ts:687:21)
    at assert (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/utils/errors.ts:715:25)
    at assertArgument (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/utils/errors.ts:727:5)
    at /home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/abi/interface.ts:1047:31
    at Array.forEach (<anonymous>)
    at Interface.encodeFilterTopics (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/abi/interface.ts:1042:16)
    at /home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/contract/contract.ts:108:39
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async getSubInfo (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/contract/contract.ts:502:18)
    at async Proxy.queryFilter (/home/user/Documents/maci/node_modules/.pnpm/ethers@6.11.1/node_modules/ethers/src.ts/contract/contract.ts:938:38) {
  code: 'INVALID_ARGUMENT',
  argument: 'contract._messageRoot',
  value: 4658669366154318429589992378027343879410506110087584229116806667655891474709n,
  shortMessage: 'cannot filter non-indexed parameters; must be null'
}
```

This could happen during running `generateProofs` in `cli` package, or running `prove` in `contracts` package.
Be aware that we updated several parameters to `indexed`:

```javascript
event MergeMaciStateAqSubRoots(uint256 indexed _numSrQueueOps);
event MergeMaciStateAq(uint256 indexed _stateRoot, uint256 indexed _numSignups);
event MergeMessageAqSubRoots(uint256 indexed _numSrQueueOps);
event MergeMessageAq(uint256 indexed _messageRoot);
```

Please remember to pull the latest MACI repo updates(`git fetch origin && git pull origin main`) and run `pnpm build` in the root of this monorepo.

### Verifier contract found the proof invalid

If your log looks like the following, that's because the zkey and wasm files added to the [`VerifyingKeysRegistry` contract](/docs/technical-references/smart-contracts/VerifyingKeysRegistry) are different from what you use to run the **prove** command. Check if you're using the correct zkey and wasm files.

```
Error: The verifier contract found the proof invalid.
    at Prover.proveMessageProcessing (/home/user/Documents/maci/contracts/tasks/helpers/Prover.ts:215:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SimpleTaskDefinition.action (/home/user/Documents/maci/contracts/tasks/runner/prove.ts:185:7)
    at async Environment._runTaskDefinition (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.4/node_modules/hardhat/src/internal/core/runtime-environment.ts:359:14)
    at async Environment.run (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.4/node_modules/hardhat/src/internal/core/runtime-environment.ts:192:14)
    at async main (/home/user/Documents/maci/node_modules/.pnpm/hardhat@2.22.2_ts-node@10.9.2_typescript@5.4.4/node_modules/hardhat/src/internal/cli/cli.ts:323:7)
```

### The on-chain verification of total spent voice credits failed

If you ran the `verify` command and got this error, please ensure consistency in your use of quadratic voting throughout interactions with MACI, including poll deployment, proof generation, and verification.

### Proof generation process is killed

If your terminal output ends like this:

```
[i] Starting to fetch logs from block 8386826
[i] Generating proofs of message processing...
[i] Progress: 1 / 1
[i] Wait until proof generation is finished
Killed
ELIFECYCLE  Command failed with exit code 137.
```

This typically indicates the proof generation process was terminated due to exceeding the system's available memory limit (exit code `137` = SIGKILL by the OS, often due to OOM).

Increase Node.js' memory allocation by setting the `NODE_OPTIONS` environment variable before running the command:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
# You can increase the value further (e.g., 8192 for 8GB) if your system has enough RAM:
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Error: Not enough or too many values for input signals

If you see errors like:

```
Error: Not enough values for input signal currentVoteWeightsPathElements
at /home/maci/node_modules/.pnpm/circom_runtime@0.1.28/node_modules/circom_runtime/build/main.cjs:513:27
...
```

```
Error: Too many values for input signal ballots
at /home/maci/node_modules/.pnpm/circom_runtime@0.1.28/node_modules/circom_runtime/build/main.cjs:513:27
...
```

This usually happens when the Merkle tree depth configured in your MACI deployment does not match the depth expected by the zkey files used during proof generation.
To solve this:

- Download the correct zkey files from a trusted source.
- Verify that the `stateTreeDepth`, `messageTreeDepth`, and `voteOptionTreeDepth` used in your CLI or config match the values used to generate those zkey files.
