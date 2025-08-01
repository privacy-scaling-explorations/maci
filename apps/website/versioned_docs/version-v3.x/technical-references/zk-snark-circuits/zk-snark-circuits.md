---
title: MACI Circuits Introduction
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: zk-SNARK Circuits
sidebar_position: 1
---

MACI has three main zk-SNARK [circuits](https://github.com/privacy-scaling-explorations/maci/tree/main/packages/circuits):

1. ProcessMessages.circom, which takes a batch of encrypted messages, decrypts them, and generates a proof that the coordinator's local processing was performed correctly. [QV](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/coordinator/qv/MessageProcessor.circom), [non-QV](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/coordinator/non-qv/MessageProcessor.circom), [Full](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/coordinator/full/MessageProcessor.circom) versions are available.
2. TallyVotes.circom, which counts votes from users' ballots, batch by batch. [QV](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/coordinator/qv/VoteTally.circom) and [non-QV](https://github.com/privacy-scaling-explorations/maci/blob/main/circuits/circom/coordinator/non-qv/VoteTally.circom) versions are available.
3. PollJoining.circom, which allows users to prove they know a private key for a public key signed up to the MACI smart contract, and to register to a specific poll.

The rest of the circuits are utilities templates that are required for the main circuits to work correctly. These include utilities such as float math, conversion of private keys, and Poseidon hashing/encryption.

Each circuit is parameterised and it is important to set the right parameters that match your use case. For example, if you want to support up to 3125 messages, the message tree depth parameter should be set to `5` (as $5^5 = 3125$).

## Background

### zk-SNARKs

zk-SNARKs are a type of zero-knowledge proof which allows a "prover" to prove to a "verifier" that they know a secret without revealing the secret itself. In MACI, the prover is the coordinator. MACI uses zk-SNARKs to prove that the coordinator has correctly processed the batches of messages and that all votes have been tallied correctly. A smart contract acts as the verifier to check the proof from the coordinator. Users can also verify that the process was done correctly at any point after the proof generation.

### Circom

MACI's circuits are written using [Circom](https://docs.circom.io/), a domain-specific language (DSL) used to write zk-SNARK circuits. Circom syntax resembles JavaScript, and it currently is one of the most popular DSL in use by zk developers. Please refer to their documentation to learn more about the language.

### Proving system

MACI uses [Groth16](https://eprint.iacr.org/2016/260.pdf) as its proving system. Groth16 is a zk-SNARK proving system that allows for the generation of proofs that are small and fast to verify.

## How are the circuits used?

The process messages and tally circuits are used by the coordinator (the prover) to prove that they have correctly processed a batch of messages and tallied the votes correctly. This happens after a Poll has completed, and the coordinator has merged the state and message trees. The coordinator then generates a proof for each batch of messages, and submits them to the contract. The contract then verifies the proofs and updates the commitments on chain.

The poll joining circuit are used by users to prove that they know a private key for a public key signed up to the MACI smart contract, and to register to a specific poll. This happens when a user wants to register to a poll.

Furthermore, an optional circuit is available to prove that a user has been registered to a specific poll. This is to be used when offchain voting is enabled, so that the coordinator relayer can use it as a way to prevent spam.

## How do the Circuits fit in a voting round?

![flow](/img/circuits/processingAfterPollEnds.svg)
