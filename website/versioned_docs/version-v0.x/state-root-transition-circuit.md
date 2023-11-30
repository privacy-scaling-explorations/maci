---
title: MACI v0.x state root transition proof circuit
sidebar_label: "Circuit: state root transition proof"
sidebar_position: 4
---

# The state root transition proof circuit

This circuit proves the correctness of each state root transition.

## Public Inputs

All public inputs are set by the contract.

| Pseudocode name            | Description                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `coordinatorPubKey`        | The coordinator's public key                                                            |
| `currentStateRoot`         | The current state root                                                                  |
| `msgTreeRoot`              | The Merkle root of the message tree                                                     |
| `msgTreePathIndex`         | The Merkle path index of the message in the message tree                                |
| `maxStateLeafIndex`        | The maximum leaf index of the state tree                                                |
| `userCurrentLeafPathIndex` | The Merkle path index from the user's latest valid state leaf to the current state root |
| `newStateRoot`             | The new state root                                                                      |

## Private Inputs

All private inputs are set by the coordinator.

| Pseudocode name                    | Description                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `userCurrentLeafPathElements`      | The Merkle path elements from the user's latest valid state leaf to the current state root                                                     |
| `currentVoteOptionPathElements[n]` | The Merkle path needed to prove the existence of the current vote option leaf. Size is `253` \* `vote_option_tree_depth` bits                  |
| `newVoteOptionPathElements[n]`     | The Merkle path needed to update the vote option tree root in the state leaf. Size is `253` \* `vote_option_tree_depth` bits                   |
| `currentVoteWeight`                | In the quadratic voting use case, this is the square root of the number of voice credits a user wishes to spend on this vote. Size is 32 bits. |
| `message`                          | The message                                                                                                                                    |
| `msgTreePathElements`              | The Merkle path elements to the message tree root from the message leaf                                                                        |
| `randomLeaf`                       | Random data                                                                                                                                    |
| `newStateTreePathIndex`            | The Merkle path index to the new state root from the new state leaf                                                                            |
| `newStateTreePathElements`         | The Merkle path elements to the new state root from the new state leaf                                                                         |
| `newStateTreePathElementsToZero`   | The Merkle path elements to the new state root from leaf 0, **after** the new state leaf has been updated                                      |
| `userCurrentLeaf`                  | The user's latest valid state leaf                                                                                                             |
| `command`                          | The command to process. Includes all the details in the leaf.                                                                                  |
| `noOp`                             | The no-op flag                                                                                                                                 |
| `userPubKey`                       | The public key associated with the private key used to sign the command                                                                        |
| `encPubKey`                        | The ephermeral public key used to generate the ECDH shared key which was used to encrypt the command.                                          |
| `coordinatorPrivKey`               | The coordinator's private key.                                                                                                                 |

For the sake of simplicity, in this specification, we assume that there is no batching of commands and we handle each command one at a time.

## Check 1: That the message has been encrypted with the correct key

```javascript
// Derive the coordinator's public key from
// their private key
var derivedCoordinatorPubKey = eddsaDerivePubKey(coordinatorPrivKey);

// Ensure via a constraint that it matches the
// coordinator's public key given as an input
assert(derivedCoordinatorPubKey == coordinatorPubKey);

// Generate the ECDH key
var ecdhSharedKey = genEcdhKey(coordinatorPrivKey, encPubKey);

// Use the ECDH shared key to decrypt the message
var decryptedCommand = decrypt(ecdhSharedKey, message);

// Ensure via a constraint that the message has been correctly decrypted
assert(decryptedCommand == command);
```

## Check 2: that the message is part of the message tree

```javascript
var generatedMsgTreeRoot = generateMerkleRoot(msgTreePathElements, msgTreePathIndex, message);

assert(generatedMsgTreeRoot, msgTreeRoot);
```

## Check 3: that the new state root transition is the correct result of executing the given command — _or_ — that the command is invalid and the no-op flag is set to true.

## Circuit logic

The message should already have been decrypted to `decryptedCommand` (see above).

```javascript
/***********************************
This function generates a state leaf
***********************************/
function generateStateLeaf(
    command,
    computedNewVoteOptionRoot,
    newVoiceCreditBalance
) => {

    return [
        command.newPublicKeyX,
        command.newPublicKeyY,
        computedNewVoteOptionRoot,
        newVoiceCreditBalance,
        command.nonce + 1
    ]
}

/*************************
// The main circuit logic:
**************************/

// Record in a variable that the new state leaf index is
// valid (i.e. it is leq to the maximum allowed value)
var validStateLeafIndex = newStateTreePathIndex <= maxStateLeafIndex && newStateTreePathIndex > 0

// Record in a variable if the signature is valid
var validSignature = verifyEddsa(signature, decryptedCommand, userPubKey)

// Record in a variable if the nonce is correct
var correctNonce = decryptedCommand.nonce == userCurrentLeaf.nonce + 1

// Prove that the user's current leaf is part of the
// Merkle tree. Note that this check is independent of
// the noOp flag. As such, the coordinator cannot
// create an invalid proof by tampering with the
// Merkle proof and setting noOp to true; the Merkle proof
// *must* be valid.
var x = generateMerkleRoot(
    userCurrentLeafPathElements,
    userCurrentLeafPathIndex,
    userCurrentLeaf
)

assert(x == currentStateRoot)

// Prove that the the current vote option weight (leaf)
// input is correct by checking that it exists in the
// tree at the given index
var y = generateMerkleRoot(
    decryptedCommand.currentVoteOptionPathElements,
    decryptedCommand.voteOptionIndex,
    decryptedCommand.currentVoteWeight
)

assert(y == userCurrentLeaf.voteOptionTreeRoot)

// Record in a variable if the user has enough
// voice credits

var newVoiceCreditBalance =
    userCurrentLeaf.voiceCreditBalance +
    (decryptedCommand.currentVoteWeight ^ 2) -
    (decryptedCommand.newVoteWeight ^ 2)

var enoughVoiceCredits = newVoiceCreditBalance >= 0

// Record in a variable if the new leaf's vote option
// tree root is the correct result of updating the
// vote option leaf.
var computedNewVoteOptionRoot =
    updateMerkleTree(
        command.voteOptionIndex,
        command.voteOptionPath,
        command.voteWeight,
        decryptedCommand.newVoteWeight
    )

assert(newStateLeaf.voteOptionRoot == computedNewVoteOptionRoot)
    newStateLeaf.voteOptionRoot == computedNewVoteOptionRoot

// Record in a variable if the vote option index is
// within a permissible range (0 to 2 ** vote option tree
// depth, inclusive) where VOTE_OPTION_TREE_DEPTH is
// not an input, but rather hardcoded during the trusted
// setup.
var validVoteOptionTreeIndex = command.voteOptionIndex < VOTE_OPTION_TREE_DEPTH

var newStateLeaf = generateStateLeaf(
    command,
    computedNewVoteOptionRoot,
    newVoiceCreditBalance
)

if (enoughVoiceCredits &&
    correctNonce &&
    validSignature &&
    validStateLeafIndex &&
    validVoteOptionTreeIndex
):
    // Use a constraint to ensure that the no-op flag
    // is set to false
    assert(noOp == false)


    // Generate the new state root.
    var s = merkleTreeUpdate(
        newStateTreePathIndex
        newStateLeaf,
        currentStateRoot,
        newStateTreePathElements
    )

    // Update the leaf at index `0` to generate a new state
    // root, and ensure via a constraint that it is equal
    // to the new state root passed to the snark as an
    // input.

    var updatedStateRoot = merkleTreeUpdate(
        0,
        randomLeaf,
        s,
        newStateTreePathElementsToZero
    )

    assert(updatedStateRoot == newStateRoot)

else:
    // Use a constraint to ensure that the no-op flag
    // is set to true
    assert(noOp == true)
```

## Circuit failure modes

| Condition                                           | noOp flag | Outcome                                 |
| --------------------------------------------------- | --------- | --------------------------------------- |
| Insufficient voice credits                          | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid nonce                                       | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid signature                                   | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid new vote option root                        | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid state leaf index                            | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid vote option tree index                      | `true`    | Valid proof, but only leaf 0 is updated |
| Invalid Merkle path to the current state root       | N/A       | No such proof can be generated          |
| Invalid Merkle path to the current vote option root | N/A       | No such proof can be generated          |
