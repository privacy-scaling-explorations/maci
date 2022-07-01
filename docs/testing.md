# Testing

## Contracts

First, compile the contracts.

From the main `maci/` directory, run:


```bash
cd contracts && \
npm run compileSol
```

Run Hardhat Network (a local Ethereum testnet) in a separate terminal:

```bash
cd contracts && \
npm run hardhat
```

## CLI

You can test the CLI locally. First, you need to either generate `.zkey` files,
or download them. Do not use these testing `.zkey` files in production.

### Download `.zkey` files or the witness generation binaries

MACI has three zk-SNARK circuits. Each circuit is parameterised. There should one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits..

Note the locations of the `.zkey` files as the CLI requires them as
command-line flags.

You cand download a `.zkey` files and associated `.r1cs` file with witness generation binaries from [here](https://github.com/privacy-scaling-explorations/maci/wiki/Download-Precompiled-Circuit-and-Zkeys).

### Compile the witness generation binaries

From the main `maci/cli` directory, run:

```
npx zkey-manager compile -c ./zkeys.config.yml
```

You should see the following files in `maci/cli/zkeys/`:

```
ProcessMessages_10-2-1-2_test
ProcessMessages_10-2-1-2_test.circom
ProcessMessages_10-2-1-2_test.dat
ProcessMessages_10-2-1-2_test.r1cs
ProcessMessages_10-2-1-2_test.sym
ProcessMessages_10-2-1-2_test_cpp
ProcessMessages_10-2-1-2_test_js
SubsidyPerBatch_10-1-2_test
SubsidyPerBatch_10-1-2_test.circom
SubsidyPerBatch_10-1-2_test.dat
SubsidyPerBatch_10-1-2_test.r1cs
SubsidyPerBatch_10-1-2_test.sym
SubsidyPerBatch_10-1-2_test_cpp
SubsidyPerBatch_10-1-2_test_js
TallyVotes_10-1-2_test
TallyVotes_10-1-2_test.circom
TallyVotes_10-1-2_test.dat
TallyVotes_10-1-2_test.r1cs
TallyVotes_10-1-2_test.sym
TallyVotes_10-1-2_test_cpp
TallyVotes_10-1-2_test_js
```

### Check the Rapidsnark binary

Next, ensure that the `prover` binary of `rapidsnark` is in
`~/rapidsnark/build/prover`.

### Run CLI tests

You could find a tests in `maci/cli/tests`.

e.g. In `maci/cli/tests/vanilla`:

```bash
./test1.sh
```
