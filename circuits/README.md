# Circuits

[![NPM Package][circuits-npm-badge]][circuits-npm-link]
[![Actions Status][circuits-actions-badge]][circuits-actions-link]

This package contains the zk-SNARK circuits written in Circom 2.0.

The main circuits are:

* `processMessages.circom`
* `tallyVotes.circom`
* (optional) `subsidy.circom`

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as float math, conversion of private keys, and Poseidon hashing/encryption.

Please refer to the [documentation](https://privacy-scaling-explorations.github.io/maci/circuits.html) for a more in depth explanation.

## Build

### Prerequisites

Before building the project, make sure you have the following dependencies installed:

- [circom](https://docs.circom.io/downloads/downloads/)

### Building MACI circuits

To build the two main circuits of MACI, run the following commands:

```
circom --r1cs --sym --wasm --output ./build circom/test/processMessages_test.circom
circom --r1cs --sym --wasm --output ./build circom/test/tallyVotes_test.circom
```

Please note that the circuit is configured with testing purpose parameters, which means it can only handle a limited amount of messages (up to 25 messages). For more information on the parameters and how to configure them, refer to [this page](https://privacy-scaling-explorations.github.io/maci/circuits.html#compile-circuits).

### Generating and Validating ZK Proofs

To generate and validate ZK proofs from the artifacts produced by `circom`, you will need [`snarkjs`](https://github.com/iden3/snarkjs#groth16-1).




## Testing

To test the circuits package, please follow the instructions below:

1. Configure `circomHelperConfig.json` with the correct path to the circom binary. If you installed it via `cargo`, the binary is likely located at `~/.cargo/bin/circom`.
2. Run the command `npm run build-test-circuits` and wait for it to compile all the test circuits. This process may take approximately 10 to 15 minutes.
3. Run the command `npm run circom-helper` and wait for it to expose the JSON-RPC endpoint. Once it is ready, you will see the following message on the screen:
    ```
    Launched JSON-RPC server at port 9001
    ```
4. To run all tests, use the command `npm run test`. If you want to test a specific circuit individually, you can append `-$CIRCUIT_NAME` to the command (e.g., `npm run test-processMessages`).


[circuits-npm-badge]: https://img.shields.io/npm/v/maci-circuits.svg
[circuits-npm-link]: https://www.npmjs.com/package/maci-circuits
[circuits-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/circuit-build.yml/badge.svg
[circuits-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACircuit
