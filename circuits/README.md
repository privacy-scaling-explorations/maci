# Circuits

[![NPM Package][circuits-npm-badge]][circuits-npm-link]
[![Actions Status][circuits-actions-badge]][circuits-actions-link]

This package contains the zk-SNARK circuits written in Circom 2.0.

The main circuits are:

* `processMessages.circom`
* `tallyVotes.circom`
* `subsidy.circom`

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as Float math, conversion of private keys, and Poseidon hashing/encryption.

Please refer to the [documentation](https://privacy-scaling-explorations.github.io/maci/circuits.html) for a more in depth explanation.

## Testing

In order to test the circuits package follow the instructions below:

1. Configure `circomHelperConfig.json` with the correct path to the circom binary. If installed via `cargo` it will likely be in `~/.cargo/bin/circom`
2. run `npm run circom-helper` and wait for it to compile all test circuits and expose the JSON API. Please note that this can take around 10 to 15 minutes, depending on the specs of your machine. Once ready, the following will appear on screen:
    ```
    Launched JSON-RPC server at port 9001
    ```
3. run `npm run test` to run all tests or add `-$CIRCUIT_NAME` to test individually (e.g. `npm run test-processMessages`)


[circuits-npm-badge]: https://img.shields.io/npm/v/maci-circuits.svg
[circuits-npm-link]: https://www.npmjs.com/package/maci-circuits
[circuits-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/circuit-build.yml/badge.svg
[circuits-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACircuit
