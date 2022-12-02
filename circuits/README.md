# Circuits

This package contains the zk-SNARK circuits written in Circom 2.0.

The main circuits are:

* `processMessages.circom`
* `tallyVotes.circom`
* `subsidy.circom`

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as Float math, conversion of private keys, and Poseidon hashing/encryption.

Please refer to the [documentation](https://privacy-scaling-explorations.github.io/maci/circuits.html) for a more in depth explanation

## Testing

In order to test the circuits package follow the instructions below:

1. Configure `circomHelperConfig.json` with the correct path to the circom binary. If installed via `cargo` it will likely be in `~/.cargo/bin/circom`
2. run `npm run circom-helper` and wait for it to compile all test circuits and expose the JSON API
3. run `npm run test` to run all tests or add `-$CIRCUIT_NAME` to test individually (e.g. `npm run test-processMessages`)


