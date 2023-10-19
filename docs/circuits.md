# Circuits

MACI has three zk-SNARK circuits:

1. `ProcessMessages.circom`, which takes a batch of messages, and updates the
   state and ballot trees according to the contents of said messages.
2. `TallyVotes.circom`, which counts votes from users' ballots, batch by batch.
3. `Subsidy.circom`, which implements [pairwise subsidy](https://hackmd.io/@chaosma/H1_9xmT2K)

Each circuit is parameterised and it is important to set the right parameters
to your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

Next, navigate to the `cli/` directory and edit `zkeys.config.yml`.

This config file defines the parameters required for MACI's circuits.

### Message processing

| # | Parameter | Description |
|-|-|-|
| 0 | State tree depth | Should be set to 10. Allows 9,765,625 signups. | 
| 1 | Message tree depth | Allows $(5^{n})$ votes or key-change messages. | 
| 2 | Message batch tree depth | Allows $(5^{n})$ messages to be processed per batch. |
| 3 | Vote option tree depth | Allows $(5^{n})$ vote options. |

### Vote tallying

| # | Parameter | Description |
|-|-|-|
| 0 | State tree depth | Should be set to 10. Allows 9,765,625 signups. | 
| 1 | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. | 
| 2 | Vote option tree depth | Allows $(5^{n})$ vote options. |

### Subsidy 

| # | Parameter | Description |
|-|-|-|
| 0 | State tree depth | Should be set to 10. Allows 9,765,625 signups. | 
| 1 | State leaf batch depth | Allows $(5^{n})$ users' votes to be processed per batch. | 
| 2 | Vote option tree depth | Allows $(5^{n})$ vote options. |

## Compile circuits

Run:

```bash
npx zkey-manager compile -c ./zkeys.config.yml
```

The larger the trees, the more time this process may take. You may also need a
machine with a very large amount of memory.

## Measure the circuit sizes

The size of a circuit is denoted by its number of constraints. The larger this
number, the more time it takes to compile it, generate its `.zkey` file, and
perform phase 2 contributions.

Run this command to measure a circuit:

```bash
npx snarkjs r1cs info CIRCUIT_NAME.circom
```

## Download the `.ptau` file

This file should be the result of the Perpetual Powers of Tau trusted setup
contribution which [Hermez Network
selected](https://blog.hermez.io/hermez-cryptographic-setup/).

Run:

```bash
npx zkey-manager downloadPtau -c ./zkeys.config.yml
```

`zkey-manager` will select the smallest `.ptau` file that fits the largest
circuit specified in `zkeys.config.yml`. 

## Generate `.zkey` files

Run:

```bash
npx zkey-manager genZkeys -c ./zkeys.config.yml
```

This generates the initial `.zkey` files for each circuit.

You should perform at least one contribution to each circuit, even if you
choose not to perform a multi-party trusted setup.
