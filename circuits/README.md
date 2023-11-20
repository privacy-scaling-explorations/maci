# Circuits

[![NPM Package][circuits-npm-badge]][circuits-npm-link]
[![Actions Status][circuits-actions-badge]][circuits-actions-link]

This package contains the zk-SNARK circuits written in Circom 2.0.

The main circuits are:

- `processMessages.circom`
- `tallyVotes.circom`
- (optional) `subsidy.circom`

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as float math, conversion of private keys, and Poseidon hashing/encryption.

Please refer to the [documentation](https://maci.pse.dev/docs/circuits) for a more in depth explanation.

[circuits-npm-badge]: https://img.shields.io/npm/v/maci-circuits.svg
[circuits-npm-link]: https://www.npmjs.com/package/maci-circuits
[circuits-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/circuit-build.yml/badge.svg
[circuits-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3ACircuit
