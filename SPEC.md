# Minimum Anti-Collusion Infrastructure

*Barry WhiteHat, Kendrick Tan, Kobi Gurkan, and Koh Wei Jie*

Join the [Telegram group](https://t.me/joinchat/LUgOpE7J2gstRcZqdERyvw) to discuss.

[TOC]

## Introduction

This specification is for an implementation of Minimum Anti-Collusion Infrastructure (MACI). Originally proposed by Vitalik Buterin in [this ethresear.ch post](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413), systems built with MACI make collusion among participants difficult, while retaining the censorship resistance and correct-execution benefits of smart contracts. Although MACI can provide collusion resistance only if the coordinator is honest, a dishonest coordinator neither censor nor tamper with its execution. 

Note that MACI presumes an identity system where each legitimate member controls a unique Ethereum private key.

## High-level process

Whitelisted voters named Alice, Bob, and Charlie register to vote by sending their public key to a smart contract. Additionally, there is a central coordinator Dave, whose public key is known to all.

A later version of MACI will have to mitigate a [vote-buying attack](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413/3) where a user may be bribed immediately when the voting period starts, such that their very first message is influenced by a briber. One solution to this is to have the contract to mandate that the first message that each participant sends is to change their key (see below). For the sake of simplicity, however, this specification will not address this issue. 

When Alice casts her vote, she signs her vote with her private key, encrypts her signature with Dave's public key, and submits the result to the smart contract.

Each voter may change her keypair at any time. To do this, she creates and signs a key-change command, encrypts it, and sends it to the smart contract. This makes it impossible for a briber to ever be sure that their bribe has any effect on the bribee's vote.

If Bob, for instance, bribes Alice to vote a certain way, she can simply use the first public key she had registered ⁠— which is now void ⁠— to cast a vote. Since said vote is encrypted, as was the key-changing message which Alice had previously sent to Dave, Bob has no way to tell if Alice had indeed voted the way he wanted her to.

Even if Alice reveals the cleartext of her vote to Bob, she just needs to not show him the updated key command that she previously used to invalidate that key. In short, as long as she had submitted a single encrypted command before her vote, there is no way to tell if said vote is valid or not.

## Technical process

Refer to the [Glossary](#Glossary) for defintions of terms.

1. The coordinator deploys the MACI contract to an Ethereum blockchain and starts the sign-up period. The same transaction that deploys the contract also stores the value of an empty vote option tree.
2. To sign up, each user creates an EdDSA keypair and invokes the contract's `signUp()` function. Alternatively, there is a mechanism where some contract function checks if the user owns a particular ERC721 token and adds them to the whitelist. It in turn generates a new leaf to the state tree and updates the state tree root. Additionally, the user must pay a deposit, which discourages them from sharing their EdDSA private key with a potential briber. The user may redeem this deposit anytime after the voting period starts.

3. The signup period ends after a fixed amount of time. From that point onwards, users may no longer invoke `signUp()` in this contract.

4. Each user votes. To do this, they:

    -  Sign their message using the key which they had signed up with and then use a random (ephemeral) key as well as the coordinator's public key to generate a shared key (via ECDH) encrypt it.
        -  If they are bribed, the user should sign it using an old public key which has already been replaced with a new one.
        -  Otherwise, the user should use the most current public key they have registered.
    -  Submit the the signed message that is message, as well as the epheremal public key in the clear to the contract using its `publishMessage()` function, which hashes the command and inserts it into the message tree.

5. The coordinator processes all the commands after the voting period ends.

6. For each command, they perform the following steps:
    
    - Generate a new state root which reflects the following:
        - Leaf 0 is updated with a random leaf
        - If the command is valid, also update the user's state leaf.
    - Generate a zk-SNARK proof that this state root transition is valid. (Note that "state root" refers to the root of the state tree in the contract, not the Ethereum state root as defined in the Yellow Paper.)
    - An invalid message can one which is signed by a public key which a user had already replaced with another key. To allow a bribee to plausibly claim that they have voted correctly even if they use an old public key, we insert a random leaf at index `0` whether or not the message is valid.
7. The above can also be done in batches.

![](https://i.imgur.com/kNQR9ks.png)

*Figure 1: The relationship between each users, the coordinator, the contract functions, as well as the state tree and the message tree.*

8. When the voting period ends, the coordinator tallies all the votes. It then generates zk-SNARK proof that the computed result is valid without revealing the plaintext of the votes. While this specification specifically describes a quadratic voting use case, the circuit used to generate this proof should differ based on the particular nature of the voting system.

## Availability and visibility of messages

The coordinator may decrypt all commands.

Each participant may only decrypt their own messages, and should not be able to decrypt other users' messages or access their commands.

Everyone else should not be able to decrypt any messages.

No-one else should be able to decrypt any messages.

## System components

### Roles

There are two roles: users and a coordinator.

### Cryptographic operations

#### Key generation

Each user owns an EdDSA keypair, as does the coordinator. Every user should have a copy of the coordinator's public key, which is stored and available from the smart contract. Likewise, the coordinator should have a copy of each user's public key, which they publish on-chain to sign up.

We define an EdDSA private key as a random value (initially 256 bits large) modulo the snark field size as described in [EIP197](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-197.md). This results in a key size of roughly 253 bits and no more than 254 bits. Additionally, we use [this efficient algorithm](http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c) to prevent modulo bias.

#### Command signing and encryption

The following steps are needed to sign and encrypt a message:

1. Hash the command using `MiMCSponge`.
2. Sign the hash with the user's private key using `EdDSAMimcSponge`.
3. Generate an ECDH shared key using a random private key (the ephemeral key) and the coordinator's public key.
4. Encrypt both the signature and the data included in the command with the shared key using Poseidon.
5. Note that when we call `publishMessage`, we pass in the encrypted data, the signing public key, and random public key.

**Suggested `libMaci` function name: `signAndEncrypt()`**

### Contract

There is an Ethereum contract (`MACI`) which provides the following interface:

#### Merkle trees in storage

We maintain the roots of 2 Merkle trees in the MACI contract:

| Tree root | Represents |
|-|-|
| `messageTree` | Messages ⁠— both valid and invalid ⁠— submitted by users. |
| `stateTree` | The current mapping between public keys and votes. Leaf 0 is reserved for a random value. |

The zero value (for empty leaves) for each tree is a nothing-up-my-sleeve value: the Keccack256 hash of the string 'MACI':

```solidity
uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
uint ZERO_VALUE = uint256(keccak256(abi.encodePacked('MACI'))) % SNARK_SCALAR_FIELD;
```

which is equal to:

```
5503045433092194285660061905880311622788666850989422096966288514930349325741
```

#### `signUp(EddsaPubKey _pubKey) payable`

During a sign-up period, any user who owns a recgonised ERC721 token can invoke `signUp()`. This function tracks the ERC721 token ID and prevents double sign-ups with the same token ID.

Next, it adds a new leaf to the state tree, starting from index `1` (as index 0 is reserved for invalid leaves). This leaf is the hash of the public key, the user's voice credits, the nonce `0`, and the root of an empty vote option tree.

Additionally, this function requires a deposit of `depositAmt` ETH to discourage users from sharing their EdDSA private keys with potential bribers.

The sign-up period ends after a predefined deadline. A later version of MACI will allow ongoing sign-ups where state trees will be merged once per week.

#### `redeemDeposit(uint256 _signature)`

This function returns the user's deposit if `_signature` is a signature of the user's Ethereum address signed with their EdDSA private key. It can only be invoked after the voting period finishes.

This may need to accept a zk-SNARK proof in addition to the signature if there isn't a good Solidity implementation of EdDSA signature verification.

#### `publishMessage(uint256 _msg, EddsaPubKey _encPubKey)`

This function ensures that the current block time is past the signup period, increments the message counter, and then updates the state root.

This function must be public and anyone should be able to call it.

#### `processMessage(...)`

The parameters are:

```
uint256[2] a,
uint256[2][2] b,
uint256[2] c,
uint256 message,
uint256 newStateRoot
```

This function accepts a state root transition zk-SNARK proof (`a`, `b`, and `c`) and the above public inputs (the other parameters). It verifies the proof, updates the processed message counter, and updates the state root in storage with `newStateRoot`. 

It also increments the message tree index by the number of commands whose processing is verified by the given zk-SNARK proof.

This function should, however, only do so if the processed message counter indicates that all previous messages have already been processed.

Only the coordinator may invoke this function.


#### `batchProcessMessage(...)`

This function accepts a list of proofs, messages, and state roots, and runs `processMessage()` on each of them.

#### `proveVoteTally()`

The parameters are:

```
uint256[2] a,
uint256[2][2] b,
uint256[2] c,
uint256[n] results
```

where `n` is the number of vote options.

This function verifies the zk-SNARK proof (`a`, `b`, and `c`), with the state root in the contract and the given list of tallied votes (`results`) as public inputs. This allows anyone to verify that the vote tally results are correct. 

### State leaves

Each state leaf contains a user's public key, the Merkle root of their unique vote option tree, the number of voice credits they have left, and the nonce of their most recent valid command.

Each user's public key is associated with exactly one state leaf. This leaf is the single source of truth of their vote option tree. Additionally, since a user may vote for multiple options, and allocate different amounts of voice credits to each option, we represent their votes as a Merkle tree.

#### Schema

| Data | Bits | Comments |
|-|-|-|
| `publicKeyX` | 253 | The public key's x-coordinate. |
| `publicKeyY` | 253 |  The public key's y-coordinate. |
| `voteOptionTreeRoot` | 253 | The Merkle root of the tree which represents the options which this particular user voted for. |
| `voiceCreditBalance` | 32 | The number of remaining voice credits that the user can spend. |
| `nonce` | 32 | The nonce of the most recently inserted command for this user.

The schema for leaves of the vote option tree, which we dub *vote leaves*, is as such:

| Data | Bits | Comments |
|-|-|-|
| `votes` | 32 | In the quadratic voting use case, this is the square root of the voice credits spent for this option. |

### Commands

Each command may convey a key-change request, a vote, or both. There is only one schema for all commands.

#### Schema

Be careful not to confuse the following leaf schema for commands with the state leaf schema. Each user may submit multiple commands, but should only be associated with one state leaf.

| Data | Bits | Comments |
|-|-|-|
| `stateIndex`| State tree depth | The index of the leaf in the state tree which contains the public key used to sign the message. This is used to point to the state leaf to update. |
| `encPublicKeyX` | 253  | The x-coordinate of the ephemeral public key. Its associated private key is used to encrypt the message. |
| `encPublicKeyY` | 253  | The y-coordinate of the ephemeral public key. (We may use 1 bit, depending on the implementation) |
| `newPublicKeyX` | 253  | The new public key's x-coordinate. If no change is required, it should be that of the current key. |
| `newPublicKeyY` | 253  | The new public key's y-coordinate. If no change is required, it should be that of the current key. (We may use 1 bit, depending on the implementation) |
| `voteOptionIndex` | Vote option tree depth | The index of the leaf in the vote option tree to which this state leaf refers. |
| `newVoteWeight` | 32 | In the quadratic voting use case, this is the square root of the number of voice credits a user wishes to spend on this vote. |
| `nonce` | 32 | Prevents replay attacks. Starts from `0` and for each message. A message meant to fool a briber may contain *any nonce necessary* to do so. For more details, see the section on nonces below. |

A useful rule of thumb is that the coordinator -- not the user --  should provide information that they know if they possess it. As such, the command does not contain information such as the Merkle path to the root of the vote option tree, since the coordinator should have it.

#### About nonces

The first message that a user submits should have a nonce of `0`. The nonce of subsequent messages now depends on whether the user is bribed and has to reveal their vote to the briber.

In the case that a user is not bribed, nonces are simply incremental.

If a user is bribed against their will, however, they should set the nonce to whatever is necessary to fool the briber. For instance, a user with EdDSA key `Kb` who had previously submitted this message:

`{key = Kb, vote = A, nonce = 1}`

could encrypt and submit this invalid message:

`{key = Ka, vote = B, nonce = 0}`

where `Ka` is an invalid key. When the user decrypts this message and reveals it to the briber, the briber not only has no way to tell if this message is valid, they also have no reason to think that the user had not previously submitted valid messages, as the nonce is `0`.

### Message verification

Given a `command` from a user Alice, we say that the state transition from an `oldStateRoot` to a `newStateRoot` is *valid* if and only if (not in order of processing):

1. The nonce equals the total number of valid commands from Alice processed by the coordinator in order to produce `oldStateRoot`, minus one. See the section on nonces.
2. The decrypted message is signed by Alice's current EdDSA private key.
3. The signature is valid. This includes edge cases such as whether the points of the signature (like `R8`) are valid points.
4. The command has the correct length.
5. Each command field has the correct length.
6. The specified vote option is indeed a choice that the user may make in the system.
7. The user has enough voice credits left.
8. Inserting the newly produced state leaf into the current state tree with `oldStateRoot` results in a new state tree with a root equal to `newStateRoot`.
9. The state leaf index is less or equal to than the maximum state leaf index (2 ** state tree depth) and is not equal to 0.

### Circuits

There are two zk-SNARK circuits in MACI: one which allows the coordinator to prove the correctness of each state root transition, and the other which proves that they have correctly tallied all the votes.

Note that the circuit pseudocode in this specification does not describe zk-SNARK outputs. The difference between inputs and outputs is only semantic. As such, we consider so-called outputs as values computed from inputs, and then verified via a public input designated as an `output` in the circom code.

#### The state root transition proof circuit

##### Inputs

| Pseudocode name | zk-SNARK input type | Description | Set by |
|-|-|-|-|
| `coordinatorPubKey` | Public | The coordinator's public key | Contract |
| `currentStateRoot` | Public | The current state root | Contract |
| `msgTreeRoot` | Public | The Merkle root of the message tree | Contract |
| `msgTreePathIndex` | Public | The Merkle path index of the message in the message tree | Contract |
| `maxStateLeafIndex` | Public | The maximum leaf index of the state tree | Contract |
| `userCurrentLeafPathIndex` | Public | The Merkle path index from the user's latest valid state leaf to the current state root | Contract |
| `newStateRoot` | Public | The new state root | Contract |
| `userCurrentLeafPathElements` | Private | The Merkle path elements from the user's latest valid state leaf to the current state root | Coordinator |
| `currentVoteOptionPathElements[n]` | Private <!--`253` * vote option tree depth--> | The Merkle path needed to prove the existence of the current vote option leaf. | Coordinator |
| `newVoteOptionPathElements[n]` | Private <!--`253` * vote option tree depth--> | The Merkle path needed to update the vote option tree root in the state leaf. | Coordinator |
| `currentVoteWeight` | Private <!--32--> | In the quadratic voting use case, this is the square root of the number of voice credits a user wishes to spend on this vote. | Coordinator |
| `message` | Private | The message | Coordinator |
| `msgTreePathElements` | Private | The Merkle path elements to the message tree root from the message leaf | Coordinator |
| `randomLeaf` | Private | Random data | Coordinator |
| `newStateTreePathIndex` | Private |The Merkle path index to the new state root from the new state leaf | Coordinator |
| `newStateTreePathElements` | Private |The Merkle path elements to the new state root from the new state leaf | Coordinator |
| `newStateTreePathElementsToZero` | Private |The Merkle path elements to the new state root from leaf 0, **after** the new state leaf has been updated | Coordinator |
| `userCurrentLeaf` | Private | The user's latest valid state leaf | Coordinator |
| `command` | Private | The command to process. Includes all the details in the leaf. | Coordinator |
| `noOp` | Private | The no-op flag | Coordinator |
| `userPubKey` | Private | The user's public key | Coordinator |
| `encPubKey` | Private | The ephermeral public key | Contract |
| `coordinatorPrivKey` | Private | The coordinator's public key |  Coordinator |

This circuit proves the correctness of each state root transition.

For the sake of simplicity, in this specification, we assume that there is no batching of commands and we handle each command one at a time.

##### Check 1: That the message has been encrypted with the correct key

```
// Derive the coordinator's public key from
// their private key 
var derivedCoordinatorPubKey = eddsaDerivePubKey(coordinatorPrivKey)

// Ensure via a constraint that it matches the
// coordinator's public key given as an input
assert(derivedCoordinatorPubKey == coordinatorPubKey)

// Generate the ECDH key
var ecdhSharedKey = genEcdhKey(coordinatorPrivKey, encPubKey)

// Use the ECDH shared key to decrypt the message
var decryptedCommand = decrypt(ecdhSharedKey, message)

// Ensure via a constraint that the message has been correctly decrypted
assert(decryptedCommand == command)
```

##### Check 2: that the message is part of the message tree

```javascript
var generatedMsgTreeRoot = generateMerkleRoot(
    msgTreePathElements,
    msgTreePathIndex,
    message
)

assert(generatedMsgTreeRoot, msgTreeRoot)
```

##### Check 3: that the new state root transition is the correct result of executing the given command — *or* — that the command is invalid and the no-op flag is set to true.



**Circuit logic:**

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

#### The quadratic vote tallying circuit

Quadratic voting is one of many types of vote tallying mechanisms. We chose it for the first version of MACI due to the high amount of interest that the community has shown for it.

Quadratic voting allows users to express the strength of their preferences when they vote for options. Since users are allocated a limited number of *voice credits*, and the number of tallied votes per option is the square root of the number of voice credits spent on said option, quadratic voting [over-privileges neither concentrated nor diffuse interests](https://www.vitalik.ca/general/2019/12/07/quadratic.html).

For instance, if a user has 99 voice credits, they may spend them this way (each row represents a command):

| Option | Voice credits spent |
|-|-|
| A | 1 |
| A | 9 |
| B | 25 |
| C | 64 |

As seen above, even though the user had a disproportionate preference for option C (64 voice credits), their impact on the tallied vote (8 votes) was merely the square root of the voice credits they had spent. This prevents them from having an outsized influence on the results simply by virtue of their willingness to spend as many voice credits on that option as they had.

Additionally, we consider that votes are cumulative. This means that the user spent 10 voice credits on option A.

| Option | Tallied votes |
|-|-|
| A | 3.16 |
| B | 5 |
| C | 8 |

The MACI contract's `quadraticVoteTally()` function should verify a proof created using this circuit to compute the results of tallying a set of state leaves. This also proves that these state leaves have an intermediate root `A`, as well that `A` is part of the tree with final state root `R`. This allows the coordinator to prove the final tally in batches. The function keeps track of the index of each intermediate root to ensure that they are processed consecutively.

##### Inputs

| Pseudocode name | zk-SNARK input type | Description | Set by |
|-|-|-|-|
| `fullStateRoot` | Public | The final Merkle root of the state tree | Contract |
| `fullStateTreeDepth` | Public | The depth of the state tree | Contract |
| `intermediateStateTreeDepth` | Public | The depth of the intermediate state tree | Contract |
| `intermediateStateRoot` | Public | The intermediate Merkle root generated by the given state leaves | Contract |
| `intermediatePathElements[k]` | Public | The Merkle path elements from `intermediateStateRoot` to `stateRoot`. | Contract |
| `intermediatePathIndex` | Public | The Merkle path index from `intermediateStateRoot` to `stateRoot`. | Contract |
| `currentResults[n]` | Public | The vote tally of all prior batches of state leaves | Coordinator |
| `newResultsCommitment` | Public | The salted hash of the vote tally for this batch of leaves plus the vote tally from `currentResults` |  Coordinator |
| `salt` | Private | A random value to hash with the culmulate vote tally for this batch of state leaves |  Coordinator |
| `stateLeaves[m]` | Private | The batch of leaves of the state tree to tally. | Coordinator |
| `voteLeaves[m][n]` | Private | The vote leaves for each user in this batch of state leaves. | Coordinator |

`n` is the number of options in `voteOptionTree`.
`m` is the number of state leaves in this batch.
`k` is `fullStateTreeDepth - intermediateStateTreeDepth`

**Circuit pseudocode:**

```javascript
// Alice votes for party A with 16 credits
// Bob votes for party A with 9 credits

// Party A gets 7 tallied votes. NOT 5 votes.

// Ensure via a constraint that the intermediate root is the 
// correct Merkle root of the stateLeaves passed into this 
// snark
assert(intermediateStateRoot == genTree(stateLeaves))

// Ensure via a constraint that the intermediate root is part of the full state tree
var x = generateMerkleRoot(
    intermediatePathElements,
    intermediatePathIndex,
    intermediateRoot
)

assert(x == stateRoot)

// This variable stores the sum of the square roots of each 
// user's voice credits per option.
var computedResults = currentResults

var start = 1
if intermediatePathIndex > 0:
    start = 0

// For each user
for i as start to m: // we ignore leaf 0 on purpose
    
    // Ensure via a constraint that the voteLeaves for this 
    // user is correct (such that when each vote leaf is 
    // inserted into an MT, the Merkle root matches
    // the `voteOptionTreeRoot` field of the state leaf)

    var computedVoteOptionTreeRoot = genTree(voteLeaves[i])
    assert(computedVoteOptionTreeRoot == stateLeaves[i].voteOptionTreeRoot)

    // Calculate the sum of votes for each option
    for j as 0 to n.
        // This adds to the subtotal from previous batches
        // of state leaves
        computedResults[j] += voteLeaves[i][j]
        
        
// Ensure via a constraint that the final result
// is correct
assert(
    hash(salt, computedResults) == 
    hash(salt, newResultsCommitment)
)
```

where `genTree` is pseudocode for a circuit which computes a Merkle root from a list of leaves.

## Glossary

Some terms in this specification are similar to one another but should not be used interchangably. This glossary should help to resolve such ambiguities.

| Term | Meaning |
|-|-|
| Command | Unencrypted data whose fields include the user's public key, vote etc. |
| Message | An encrypted command. |
| State | The mapping between each user's public key and the full set of information about which options they voted for and the weight per vote. Note that this does not refer to the Ethereum state as defined in the Yellow Paper. |
| Vote | The options which the user voted for |
| Vote option | One out of many possible choices which a user may vote for |
| Vote option tree | The unique tree of weights that each user assigns to vote options. This represents the full set of information about which options a user had voted for and how many voice credits they had spent per vote.  |
| Voice credit | One unit which denotes the strength of a user's vote for a particular option. In a quadratic voting use case, users start out with a limited number of voice credits and spend them on votes. |

## Circuit failure modes

### The state root transition proof circuit

| Condition | noOp flag | Outcome |
|-|-|-|
| Insufficient voice credits | `true` | Valid proof, but only leaf 0 is updated |
| Invalid nonce | `true` | Valid proof, but only leaf 0 is updated |
| Invalid signature | `true` | Valid proof, but only leaf 0 is updated |
| Invalid new vote option root | `true` | Valid proof, but only leaf 0 is updated |
| Invalid state leaf index | `true` | Valid proof, but only leaf 0 is updated |
| Invalid vote option tree index | `true` | Valid proof, but only leaf 0 is updated |
| Invalid Merkle path to the current state root | N/A | No such proof can be generated |
| Invalid Merkle path to the current vote option root | N/A | No such proof can be generated |

### The quadratic vote tallying circuit

| Condition | Outcome |
|-|-|
| Invalid state leaves and/or intermediate state root | No such proof can be generated |
| Invalid vote option leaves | No such proof can be generated |
| Invalid Merkle path to the full state root from the intermediate state root for the batch of votes| No such proof can be generated |


## Appendices

### I: Attacks and mitigations

#### If the coordinator censors messages

If the coordinator censors a message `N` by excluding it from the final vote tally, the logic in `processMessage()` will prevent them from processsing message `N+1` or any future message until they do so.

#### If a user submits a message with an invalid signature

The coordinator should verify the message's signature off-chain and if it is invalid, set the no-op flag to true and pass it into the state transition proof circuit. If the coordinator does not do this, they will fail to generate a valid proof anyway.

#### If an adversarial miner bribes a user and controls the `randomLeaf` value passed into the state transition snark

This adversary does not know the value of the other leaves of the state tree, so even if the coordinator updates leaf 0 with the adversary's entropy, the adversary cannot tell if the processed commmand is invalid.

#### User creates a command that the snark cannot process 

The the system must be designed and built in a way such that this cannot happen.

#### If a briber locks the user's key in trusted hardware

Assuming that the locked key is not the user's initial public key, the briber has no way to tell if the user has not already changed their key. This scenario is therefore the same as that in which the user gives a public key to a briber witout trusted hardware.

> [name=kobi] 
> I don't think the reasoning works, for example for a user with trusted hardware:
> 1. User has trusted hardware that allows a single key change. The user has initial public key $pk$ and public key $pk2$
> 2. User registers with $pk$
> 3. User changes to $pk2$, with the trusted hardware attesting this is the second public key and no further key changes are allowed
> 4. Briber gets $sk2$ and the attestation and then uses $pk2$

> [name=barry] I think that the attack is where you lock the initial key in trusted hardware. The solution is to use https://www.vitalik.ca/general/2019/10/01/story.html

#### Deposit my public key and i will pay you

> [name=barry] This is the most serious attack IMO. The deposit stake is weak prevention for this.

#### If an attacker fills up the message tree with a such a large number of commands that the coordinator cannot afford to generate enough proofs to process them all

Each user should be allowed to publish at no cost as many messages as there are vote options, plus a small number (e.g. 2). Each subsequent message should cost the user an increasing amount of ETH. When the coordinator processes the message, the contract should return the ETH to the user. As such, the majority of non-malicious users will not have to pay any more than the gas costs to vote, and spammers must put up capital to attack the coordinator.

>[barry] there is no way to enforce this limit without allowing for bribary. 
>[name=wei jie] how does this have to do with bribery? i understand this to only be an anti-spam mechanism.

### II: Claims / required invariants

1. It is impossible for a coordinator to find a collision in message decryptions. i.e. they cannot decrypt a message to a different command. 
2. It is impossible for a user to create a message that the coordinator is not able to process.
3. It is impossible for a user to create a message such that the coordinator is unable to create a zk-SNARK proof of a state root transition.
4. No-one but the coordindator can trustlessly bribe someone. 

### III: Desired features not described in this specification

- A perpetual sign-up process
- Reuse the MACI contract for a new vote. This requires the operator to zero out each user's vote option tree.
- Mitigations for some of the attacks described above

### IV: Quadratic and sybil-resistant million-dollar-homepages

Another use case for MACI is a [million-dollar-homepage](http://www.milliondollarhomepage.com/) style bulletin board where users can post and quadratically vote on images. A user who owns a [POAP](https://www.poap.xyz/) token from a real-life event can sign up and receive 2 ^ 32 voting tokens per week. To add a picture to the board, they have to burn 1 ETH, which disincentivises spam. The visual prominance of size of each picture scales with the sum of square roots of the votes that it receives.