---
title: MACI Trusted Setup
description: Introduction to the MACI multi-party trusted setup
sidebar_label: Trusted Setup
sidebar_position: 8
---

# Trusted setup

MACI currently uses Groth16 zk-SNARKs written in `circom`. Teams who wish to
build on MACI may choose to perform a multi-party trusted setup. This allows
observers to have a higher degree of confidence that the coordinator cannot
generate fake proofs. Some teams, however, may forgo the trusted setup.

There are two possible reasons for doing so: if a team does not intend
to manage a large amount of value, and if their users accept that the risk of
coordinator misbehaviour is insufficient to justify doing the work of a
trusted setup. After all, MACI's security model presumes a trusted coordinator.

The [PSE team](https://pse.dev/) is making available a trusted set of zKeys for MACI's circuits,
which are available and accessible on
[p0tion's website](https://ceremony.pse.dev/projects/Maci%20v1%20Trusted%20Setup%20Ceremony).
For more info on trusted setup ceremonies please refer to p0tion's [docs](https://p0tion.super.site/).

For your convenience, here is a list of the artifacts that can be used in production:

> Please note these artifacts are generated from the most up to date version of the circom circuits, available in the [dev](https://github.com/privacy-scaling-explorations/maci/tree/dev/circuits) branch at this time.

| Artifact                          | Description                                                                                         | Parameters | Link                                                                                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| processMessages zKey              | The production-ready zKey for the processMessages circuit.                                          | 6-8-2-3    | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/contributions/processmessages_6-8-2-3_final.zkey |
| tallyVotes zKey                   | The production-ready zKey for the tallyVotes circuit.                                               | 6-2-3      | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/contributions/tallyvotes_6-2-3_final.zkey               |
| processMessages r1cs              | The Rank-1 Constraint System file that was used to generate the zKey                                | 6-8-2-3    | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3.r1cs                     |
| tallyVotes r1cs                   | The Rank-1 Constraint System file that was used to generate the zKey                                | 6-2-3      | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.r1cs                                   |
| processMessage wasm               | The WASM file that can be used to generate proofs                                                   | 6-8-2-3    | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3.wasm                     |
| tallyVotes wasm                   | The WASM file that can be used to generate proofs                                                   | 6-2-3      | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.wasm                                   |
| processMessages vKey              | The verification key that can be used to verify the processMessages circuit's proofs                | 6-8-2-3    | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3_vkey.json                |
| tallyVotes vKey                   | The verification key that can be used to verify the tallyVotes circuit's proofs                     | 6-2-3      | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_vkey.json                              |
| processMessages Solidity verifier | The Solidity smart contract which can be used to verify the processMessages circuit proofs on-chain | 6-8-2-3    | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3_verifier.sol             |
| tallyVotes Solidity verifier      | The Solidity smart contract which can be used to verify the tallyVotes circuit proofs on-chain      | 6-2-3      | https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_verifier.sol                           |

In any case, MACI can be relatively easily modified to support PLONK, which
does not require a circuit-specific trusted setup. Its circuits, written in
[`circom`](https://github.com/iden3/circom), are compatible with Fluidex's
[`plonkit`](https://github.com/Fluidex/plonkit) tool. The downside to using
PLONK is that proof generation is not as optimised as it is for Groth16.
