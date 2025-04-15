---
title: MACI Utility Circuits
description: Introduction to the core zk-SNARK circuits of MACI
sidebar_label: Utility Circuits
sidebar_position: 5
---

#### Process Messages Input Hasher

A utility circuit used by the main `processMessages` circuit to hash its inputs.

![ProcessMessagesInputHasher](/img/circuits/processMessagesInputHasher.svg)

It outputs one field element, which is the SHA256 hash of the following inputs:

1. `packedVals`
2. `pollEndTimestamp`
3. `msgRoot`
4. `coordinatorPubKeyHash`
5. `newSbCommitment`
6. `currentSbCommitment`

#### Tally Votes Input Hasher

A utility template that generates a sha256 hash of the provided tally inputs.

![TallyVotesInputHasher](/img/circuits/tallyInputHasher.svg)

It outputs one field element, which is the SHA256 hash of the following inputs:

1. `packedVals`
2. `sbCommitment`
3. `currentTallyCommitment`
4. `newTallyCommitment`

#### ResultsCommitmentVerifier

A utility circuit used by the main `tallyVotes` circuit to verify that the results commitment is correct.

![ResultsCommitmentVerifier](/img/circuits/resultsCommitmentVerifier.svg)

#### QuinCheckRoot

Utility circuit that given a quin Merkle root and a list of leaves, check if the root is the correct result of inserting all the leaves into the tree in the given order.

![QuinCheckRoot](/img/circuits/quinCheckRoot.svg)

#### CalculateTotal

Utility circuit used to calculate the sum of an array of elements.

![CalculateTotal](/img/circuits/calculateTotal.svg)

#### ECDH

Utility circuit used to generate a shared key from a private key and a public key.

![ECDH](/img/circuits/ecdh.svg)

#### Poseidon

Utility circuit used to generate a Poseidon hash. In this case, it supports up to 13 inputs.

![Poseidon13](/img/circuits/poseidonHasher13.svg)

#### MessageToCommand

Utility circuit used to convert a message into a command, this involves decrypting the message.

![MessageToCommand](/img/circuits/messageToCommand.svg)

#### MessageValidator

Utility circuit used to validate a message. This performs several checks:

- `stateTreeIndex` is valid
- `voteOptionIndex` is valid
- `nonce` is valid
- the signature is valid
- the user signed up before poll end timestamp
- the user had enough voice credits

![MessageValidator](/img/circuits/messageValidator.svg)

#### PrivToPubKey

Utility circuit used to generate a public key from a private key.

![PrivToPubKey](/img/circuits/privToPubkey.svg)

#### VerifySignature

Utility circuit used to verify a EdDSA signature

![VerifySignature](/img/circuits/verifySignature.svg)

#### UnpackElement

Utility circuit used to unpack an input element.

![UnpackElement](/img/circuits/unpackElement.svg)

#### QuinSelector

Utility circuit used to select one element from an array of n elements at a given index.

![QuinSelector](/img/circuits/quinSelector.svg)

#### Splicer

Utility circuit used to insert one element in an array at position `index`.

![Splicer](/img/circuits/splicer.svg)

#### QuinBatchLeavesExists

Utility circuit used to check if a batch of leaves exists in a quinary tree.

![QuinBatchLeavesExists](/img/circuits/quinBatchLeavesExists.svg)

#### QuinGeneratePathIndices

Utility circuit used to generate the indices needed to traverse the tree until we find the leaf we are looking for.

![QuinGeneratePathIndices](/img/circuits/quinGeneratePathIndices.svg)

#### ProcessOne

Utility circuit used to process one message.

![ProcessOne](/img/circuits/processOne.svg)
