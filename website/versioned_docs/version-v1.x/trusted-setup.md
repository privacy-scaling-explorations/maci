---
title: MACI Trusted Setup
description: Introduction to the MACI multi-party trusted setup
sidebar_label: Trusted Setup
sidebar_position: 10
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
[p0tion's website](https://ceremony.pse.dev/).
For more info on trusted setup ceremonies please refer to p0tion's [docs](https://p0tion.super.site/).

## Maci v1.2 Trusted Setup Ceremony (most recent)

For your convenience, here is a list of the artifacts that can be used in production:

:::info
You can download all of the artifacts using the following command from maci's monorepo root:

```bash
download:ceremony-zkeys
```

:::

| Artifact                               | Description                                                                                              | Parameters | Link                                                                                                                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| processMessages zKey                   | The production-ready zKey for the processMessages circuit.                                               | 6-9-2-3    | [processMessages_6-9-2-3_final.zkey](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessages_6-9-2-3/contributions/maci-processmessages_6-9-2-3_final.zkey)                |
| processMessagesNonQv zKey              | The production-ready zKey for the processMessagesNonQv circuit.                                          | 6-9-2-3    | [processMessagesNonQv_6-9-2-3_final.zkey](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessagesnonqv_6-9-2-3/contributions/maci-processmessagesnonqv_6-9-2-3_final.zkey) |
| tallyVotes zKey                        | The production-ready zKey for the tallyVotes circuit.                                                    | 6-2-3      | [tallyVotes_6-2-3_final.zkey](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/contributions/tallyvotes_6-2-3_final.zkey)                                                   |
| tallyVotesNonQv zKey                   | The production-ready zKey for the tallyVotesNonQv circuit.                                               | 6-2-3      | [tallyVotesNonQv_6-2-3_final.zkey](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-tallyvotesnonqv_6-2-3/contributions/maci-tallyvotesnonqv_6-2-3_final.zkey)                      |
| processMessages r1cs                   | The Rank-1 Constraint System file that was used to generate the zKey                                     | 6-9-2-3    | [MACI-ProcessMessages_6-9-2-3.r1cs ](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessages_6-9-2-3/MACI-ProcessMessages_6-9-2-3.r1cs)                                    |
| processMessagesNonQv r1cs              | The Rank-1 Constraint System file that was used to generate the zKey                                     | 6-9-2-3    | [MACI-ProcessMessagesNonQv_6-9-2-3.r1cs](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessagesnonqv_6-9-2-3/MACI-ProcessMessagesNonQv_6-9-2-3.r1cs)                      |
| tallyVotes r1cs                        | The Rank-1 Constraint System file that was used to generate the zKey                                     | 6-2-3      | [tallyvotes_6-2-3.r1cs](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.r1cs)                                                                             |
| tallyVotesNonQv r1cs                   | The Rank-1 Constraint System file that was used to generate the zKey                                     | 6-2-3      | [tallyvotesnonqv_6-2-3.r1cs](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-tallyvotesnonqv_6-2-3/MACI-TallyVotesNonQv_6-2-3.r1cs)                                                |
| processMessages wasm                   | The WASM file that can be used to generate proofs                                                        | 6-9-2-3    | [MACI-ProcessMessages_6-9-2-3.wasm](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessages_6-9-2-3/MACI-ProcessMessages_6-9-2-3.wasm)                                     |
| processMessagesNonQv wasm              | The WASM file that can be used to generate proofs                                                        | 6-9-2-3    | [MACI-ProcessMessagesNonQv_6-9-2-3.wasm](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessagesnonqv_6-9-2-3/MACI-ProcessMessagesNonQv_6-9-2-3.wasm)                      |
| tallyVotes wasm                        | The WASM file that can be used to generate proofs                                                        | 6-2-3      | [tallyvotes_6-2-3.wasm](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.wasm)                                                                             |
| tallyVotesNonQv wasm                   | The WASM file that can be used to generate proofs                                                        | 6-2-3      | [tallyvotesnonqv_6-2-3.wasm](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-tallyvotesnonqv_6-2-3/MACI-TallyVotesNonQv_6-2-3.wasm)                                                |
| processMessages vKey                   | The verification key that can be used to verify the processMessages circuit's proofs                     | 6-9-2-3    | [maci-processmessages_6-9-2-3_vkey.json](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessages_6-9-2-3/maci-processmessages_6-9-2-3_vkey.json)                           |
| processMessagesNonQv vKey              | The verification key that can be used to verify the processMessagesNonQv circuit's proofs                | 6-9-2-3    | [maci-processmessagesnonqv_6-9-2-3_vkey.json](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessagesnonqv_6-9-2-3/maci-processmessagesnonqv_6-9-2-3_vkey.json)            |
| tallyVotes vKey                        | The verification key that can be used to verify the tallyVotes circuit's proofs                          | 6-2-3      | [tallyvotes_6-2-3_vkey.json](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_vkey.json)                                                                   |
| tallyVotesNonQv vKey                   | The verification key that can be used to verify the tallyVotesNonQv circuit's proofs                     | 6-2-3      | [tallyvotesnonqv_6-2-3_vkey.json](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-tallyvotesnonqv_6-2-3/maci-tallyvotesnonqv_6-2-3_vkey.json)                                      |
| processMessages Solidity verifier      | The Solidity smart contract which can be used to verify the processMessages circuit proofs on-chain      | 6-9-2-3    | [maci-processmessages_6-9-2-3_verifier.sol](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessages_6-9-2-3/maci-processmessages_6-9-2-3_verifier.sol)                     |
| processMessagesNonQv Solidity verifier | The Solidity smart contract which can be used to verify the processMessagesNonQv circuit proofs on-chain | 6-9-2-3    | [maci-processmessagesnonqv_6-9-2-3_verifier.sol](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-processmessagesnonqv_6-9-2-3/maci-processmessagesnonqv_6-9-2-3_verifier.sol)      |
| tallyVotes Solidity verifier           | The Solidity smart contract which can be used to verify the tallyVotes circuit proofs on-chain           | 6-2-3      | [tallyvotes_6-2-3_verifier.sol](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_verifier.sol)                                                             |
| tallyVotesNonQv Solidity verifier      | The Solidity smart contract which can be used to verify the tallyVotesNonQv circuit proofs on-chain      | 6-2-3      | [tallyvotesnonqv_6-2-3_verifier.sol](https://maci-v1-2-0-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/maci-tallyvotesnonqv_6-2-3/maci-tallyvotesnonqv_6-2-3_verifier.sol)                                |

## Maci v1.1 Trusted Setup Ceremony

For your convenience, here is a list of the artifacts that can be used in production:

| Artifact                          | Description                                                                                         | Parameters | Link                                                                                                                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| processMessages zKey              | The production-ready zKey for the processMessages circuit.                                          | 6-8-2-3    | [processmessages_6-8-2-3_final.zkey](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/contributions/processmessages_6-8-2-3_final.zkey) |
| tallyVotes zKey                   | The production-ready zKey for the tallyVotes circuit.                                               | 6-2-3      | [tallyvotes_6-2-3_final.zkey](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/contributions/tallyvotes_6-2-3_final.zkey)                      |
| processMessages r1cs              | The Rank-1 Constraint System file that was used to generate the zKey                                | 6-8-2-3    | [processmessages_6-8-2-3.r1cs](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3.r1cs)                           |
| tallyVotes r1cs                   | The Rank-1 Constraint System file that was used to generate the zKey                                | 6-2-3      | [tallyvotes_6-2-3.r1cs](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.r1cs)                                                |
| processMessage wasm               | The WASM file that can be used to generate proofs                                                   | 6-8-2-3    | [processmessages_6-8-2-3.wasm](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3.wasm)                           |
| tallyVotes wasm                   | The WASM file that can be used to generate proofs                                                   | 6-2-3      | [tallyvotes_6-2-3.wasm](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3.wasm)                                                |
| processMessages vKey              | The verification key that can be used to verify the processMessages circuit's proofs                | 6-8-2-3    | [processmessages_6-8-2-3_vkey.json](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3_vkey.json)                 |
| tallyVotes vKey                   | The verification key that can be used to verify the tallyVotes circuit's proofs                     | 6-2-3      | [tallyvotes_6-2-3_vkey.json](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_vkey.json)                                      |
| processMessages Solidity verifier | The Solidity smart contract which can be used to verify the processMessages circuit proofs on-chain | 6-8-2-3    | [processmessages_6-8-2-3_verifier.sol](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/processmessages_6-8-2-3/processmessages_6-8-2-3_verifier.sol)           |
| tallyVotes Solidity verifier      | The Solidity smart contract which can be used to verify the tallyVotes circuit proofs on-chain      | 6-2-3      | [tallyvotes_6-2-3_verifier.sol](https://maci-v1-trusted-setup-ceremony-pse-p0tion-production.s3.eu-central-1.amazonaws.com/circuits/tallyvotes_6-2-3/tallyvotes_6-2-3_verifier.sol)                                |
