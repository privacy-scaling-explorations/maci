# Testing

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


```bash
cd cli &&
mkdir -p zkeys && \
wget -O zkeys/ProcessMessages_10-2-1-2.test.0.zkey https://macitestcircuits.blob.core.windows.net/test/ProcessMessages_10-2-1-2.test.0.zkey && \
wget -O zkeys/TallyVotes_10-1-2.test.0.zkey https://macitestcircuits.blob.core.windows.net/test/TallyVotes_10-1-2.test.0.zkey
```
