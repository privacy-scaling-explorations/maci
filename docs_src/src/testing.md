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

### Download `.zkey` files

MACI has two zk-SNARK circuits. Each circuit is parameterised. There should one
`.zkey` file for each circuit and set of parameters.

Unless you wish to generate a fresh set of `.zkey` files, you should obtain
them from someone who has performed a multi-party trusted setup for said
circuits..

Note the locations of the `.zkey` files as the CLI requires them as
command-line flags.

From the main `maci/` directory, run:

```bash
cd cli &&
mkdir -p zkeys && \
wget -O zkeys/ProcessMessages_10-2-1-2.test.0.zkey https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test.0.zkey && \
wget -O zkeys/TallyVotes_10-1-2.test.0.zkey https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test.0.zkey
```

### Compile or download the witness generation binaries

You may download precompiled witness generation binaries but there is no guarantee that they will work on your machine.

```bash
mkdir -p zkeys && \
wget -O ProcessMessages_10-2-1-2.test https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test && \
wget -O TallyVotes_10-1-2.test https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test
```

Otherwise, you may compile them yourself.

From the main `maci/cli` directory, run:

```
npx zkey-manager compile -c ./zkeys.config.yml
```

You should see the following files in `cli/zkeys/`:

```
ProcessMessages_10-2-1-2.test
ProcessMessages_10-2-1-2.test.0.zkey
TallyVotes_10-1-2.test
TallyVotes_10-1-2.test.0.zkey
```

### Check the Rapidsnark binary

Next, ensure that the `rapidsnark` `prover` binary is in
`~/rapidsnark/build/prover`.

### Run CLI tests

In `maci/cli/`, run:

```bash
./test.sh
```
