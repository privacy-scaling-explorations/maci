# El Gamal Flow (Anonymity in MACI)

## Introduction

This document describes the process of voting in MACI protocol with the attention to changes made to obtain voter's anonymity. This document focuses on the technical implementation of the changes to the protocol. For a more mathematical description of the key concepts, see [El Gamal general](elgamal-general.md) document.

MACI now utilizes El Gamal encryption along with rerandomization to enable key deactivation and generation of new keys without visible connection to the previously deactivated key. Using this protocol upgrade, full anonymity of the voters and their votes is obtained.

## Updates

Two new messages are being added: `deactivateKey` and `generateNewKey`.
A new tree is added which represents the tree of deactivated keys.

## Process

The upgraded process looks like this:

1. User’s registration (signUp). This occurs initially (one time) when the user registers their public key.
2. Public key deactivation. There is a deactivation (rerandomization) period within which the user can deactivate their current public key.
3. New key generation. The user registers a new public key based on the old, deactivated one.
4. Voting. The user casts a vote by publishing a message containing their new public key.

## Signup

`signUp` in [signUp.ts](../cli/ts/signUp.ts).

cli’s `signUp` method calls the `signUp` function on the `MACI.sol` contract, and logs retrieved `stateIndex`.
The user sends their public key (two coordinates of the elliptic curve) which is registered in the state tree (new leaf enqueue). Aside from the public key it contains the number of vote credits of a user.

Contract's `signUp` function creates `StateLeaf` that contains the user’s `pubKey`, `voteCredits`, and registration `timestamp`. It hashes `StateLeaf` using the *Poseidon* hash function where elements of the array are $x$ and $y$ coordinates of the `pubKey`, and the aforementioned `voteCredits` and `timestamp`.

## Public Key Deactivation using El Gamal encryption (message type: 3)

The user’s public key deactivation takes the following steps.

### Step 1: The user submits `deactivateKey` message

`deactivateKey` function in [deactivateKey.ts](../cli/ts/deactivateKey.ts).

A new message type is added (type 3).
The command being encrypted here takes the arguments:

- `stateIndex`: State leaf index
- `userMaciPubKey`: Hardcoded for key deactivation

```javascript
const userMaciPubKey = new PubKey([BigInt(0), BigInt(0)])
```

- `voteOptionIndex`: Set to 0 for key deactivation
- `newVoteWeight`: Set to 0 for key deactivation
- `nonce`
- `pollId`: Id of the poll to which the key deactivation relates
- `salt`

The reason `userMaciPubKey` is hardcoded in this message is that the command that forms the key deactivation message (`PCommand`), and the circom circuit that processes the messages are the same as in other messages (like publishing a vote or swapping a key), and when sent, it is added to the same message tree (`MessageAq`). Assigning (0, 0) to the `userMaciPubKey` parameter, along with setting `voteOptionIndex` and `newVoteWeight` to 0 effectively identifies these types of messages in the message tree.

The command is signed with the user’s MACI private key and encrypted using a generated ECDH shared key (see [shared key generation](primitives.md#shared-key-generation)).

The message is sent to the `Poll` contract along with the ephemeral public key so that the coordinator can get to the same shared key and decrypt the message.

```javascript
tx = await pollContractEthers.deactivateKey(
    message.asContractParam(),
    encKeypair.pubKey.asContractParam(),
    { gasLimit: 10000000 },
)
```

### Step 2: Attempt key deactivation

In the `Poll` smart contract, within `deactivateKey()` function, the received message is hashed and the new leaf is added to the message tree.

```solidity
uint256 messageLeaf = hashMessageAndEncPubKey(
    _message,
    coordinatorPubKey
);

extContracts.messageAq.enqueue(messageLeaf);
```

Additionally, we store the incremental hash of each new deactivation message. Pseudocode:

```javascript
// ​​Message1
H1 = hash(H0, hash(M1));

// Message2
H2 = hash(H1, hash(M2));

//...
```

Since the deactivation period is different from the voting period, and in order to process deactivation messages, a merge of the message tree needs to be done. This can compromise the merging of the tree upon voting completion. This is why, we store this hash of the deactivation messages that is later used to prove the correctness of message processing.

<!-- TODO: check this phrasing-->
At the end of the deactivation (rerandomization) period, the coordinator proves through circom circuit `processDeactivationMessages.circom` that all deactivation messages are correctly processed. He proves that by relying on the incremental hashing of the incoming messages - he proves the hash of the final message he provided is equal to the stored hash.

### Step 3: Coordinator confirms deactivation

`confirmDeactivation` in [confirmDeactivation.ts](../cli/ts/confirmDeactivation.ts).

<!-- TODO: verify denotation of rerandomizationPeriod -->
The coordinator waits for the deactivation period to expire, upon which he parses the events from the smart contract (previous step). The deactivation period is the parameter of the `Poll` smart contract (denoted as `rerandomizationPeriod`).
Upon registering the `AttemptKeyDeactivation` event, the coordinator confirms key deactivation. The coordinator takes the `sendersPubKey` as an argument from the event:

```javascript
const sendersPubKey = event.args._sendersPubKey;
```

The coordinator encrypts the message, which represents the result of key deactivation, using his own public key and utilizing El Gamal encryption:

<!-- TODO: edit this if changed in the meantime -->
```javascript
const elGamalEncryptedMessage = await elGamalEncryptBit(coordinatorPubKey, BigInt(0), BigInt(0));
```

### El Gamal Encryption

`elGamalEncryptBit` in [index.ts](../crypto/ts/index.ts).

The encryption is performed within the crypto project, by utilizing the `elGamalEncryptBit` function. This function takes as inputs:

- `pubKey`: coordinator’s public key
- `bit`: the status of key deactivation that is being encrypted
- `y`: arbitrary value from the interval $(1,p)$ where $p$ is a prime number ($p=$ 21888242871839275222246405745257275088548364400416034343698204186575808495617)

Firstly, the bit is mapped to a point on the elliptic curve.

**Important improvement**: Since we only work with two possible values for this bit (deactivation status), we don’t need to rely on the hash-to-curve method, where for any value that needs to be mapped to a curve we need to perform a calculation. We can identify two points that we know for sure exist on the elliptic curve and use these two points to represent the input bit. These two points are

1. point at infinity
2. generator point ($G$)

As long as we have a finite number of statuses (bits) we want to represent on the elliptic curve, we can utilize these two points, where, for example, the next point would be $2G$. This reduces computation time.

The mapping of the bit to a point on the elliptic curve takes place in a `bitToCurve` function, where the bit is mapped to one of the two points, as explained above.

When the point on the elliptic curve that represents the bit is obtained, the `elGamalEncrypt` function is invoked which takes the following inputs:

- `pubKey`: coordinator’s public key
- `m`: a point on the elliptic curve (point at infinity or generator point)
- `y`: arbitrary value from the interval $(1,p)$ where $p$ is a prime number

This function returns `CipherText` in the form of `[c1, c2]` which represents the encrypted deactivation status. It is calculated as follows:

1. Multiply the generator point ($G$) with the randomness parameter ($y$). This represents $c1$.
2. Multiply $pubKey$ with the randomness parameter ($y$). This is stored as $s$.
3. Add a point on the elliptic curve received as the input ($m$) to the value from the previous step ($s$). This represents $c2$.

For more information, see [El Gamal general](elgamal-general.md) document.

For the generation of ZK proofs, there exists an equivalent circom circuit that takes care of the El Gamal Encryption: [elGamalEncryption.circom](../circuits/circom/elGamalEncryption.circom).
The coordinator proves through this ZK circuit that he encrypted the status correctly.

The coordinator then triggers the `Poll` contract function `confirmDeactivation()` that takes `elGamalEncryptedMessage` and `hash(sendersPubKey, salt)` as parameters.
The `sendersPubKey` is the public key of the user. Salt is the argument of the `confirmDeactivation` message in `cli`.

In the contract, the hash of the public key and encrypted status is written in the deactivated-keys tree.
An event is generated so that the user on the other side can react to generate a new key.

```javascript
uint256 leaf = hashMessageAndEncPubKey(
    _elGamalEncryptedMessage,
    _usersPubKey
);

leafIndex = extContracts.deactivatedKeysAq.enqueue(leaf);

emit DeactivateKey(_usersPubKey, leafIndex);
```

## New Key Generation

`generateNewKey` in [generateNewKey.ts](../cli/ts/generateNewKey.ts).

A new message type is added (type 4).

The user provides inclusion proof that the deactivated key exists in the tree, rerandomizes `[c1, c2]` to `[c1’, c2’]` (described in the following section), and sends that and a `nullifier` in the `generateNewKey` message.
This is where the connection between the old public key and the new one is lost since the user only provides ZK proof that his old public key exists in this tree without making a particular reference ([verifyDeactivatedKey.circom](../circuits/circom/verifyDeactivatedKey.circom)).
The coordinator checks whether that message is in the tree and whether `[c1, c2]` was encrypted status containing successful or unsuccessful deactivation.

When processing messages, the coordinator decrypts `[c1’, c2’]` to the original status using `elGamalDecrypt` function.

<!-- TODO: Complete this section -->
*Note: To be fully documented as part of the next Milestone*.

### Rerandomization

`elGamalRerandomize` in [index.ts](../crypto/ts/index.ts).

Rerandomization is used because we want to use the encrypted message twice but without the message being able to be linked to the user's private key.
Specifically, on confirming deactivation, the `elGamalEncryptedMessage` can be connected to the user’s public key. Since the user needs to provide the key deactivation status (encrypted) when generating a new key, this encrypted message must not be the same as the one created when the user was submitting the key to deactivation.

The user needs to prove that encrypted deactivation status `[c1, c2]` exists in the deactivated-keys tree, but publicly releases a rerandomized version of this status, [c1’, c2’].

That function randomizes an existing cipher text (`[c1, c2]`) such that it’s still decryptable using the original public key it was encrypted for (`coordinatorPubKey`).

For the generation of ZK proofs, there exists an equivalent circom circuit that takes care of the rerandomization: [elGamalRerandomize.circom](../circuits/circom/elGamalRerandomize.circom).

Rerandomization function takes as inputs:

- `z`: arbitrary value from the interval $(1,p)$ where $p$ is a prime number
- `pubKey`: coordinator's public key
- `[c1, c2]`: `CipherText` that represents the encrypted deactivation status

This function returns `CipherText` in the form of `[c1’, c2’]` that represents the rerandomized encrypted deactivation status. It is calculated as follows:

1. Multiply generator point ($G$) with the randomness parameter ($z$) and add $c1$. This represents `c1`.
2. Multiply $pubKey$ with the randomness parameter ($z$) and add $c2$. This represents `c2’`.

### Nullifiers

In order not to be able to create new key multiple times based on the old, deactivated one, the user must also send a nullifier in the message, which is a hash of the old private key. Nullifiers are stored in a sparse merkle tree and the coordinator checks whether the passed nullifier has already been seen - if so, he rejects it (non-inclusion proof).

<!-- TODO: Complete this section -->
*Note: To be fully documented as part of the next Milestone*.

## Voting

`publish` in [publish.ts](../cli/ts/publish.ts).

On voting action, the message is published.

The user signs the command with their private key and encrypts the command by passing their signature and ECDH shared key.

When the message is sent, it triggers a `publishMessage()` function on the `Poll` smart contract. The message is recorded in the message tree.

It hashes the message and public using the *Poseidon* hash function and adds the leaf to the message tree.

Upon the voting completion, the coordinator collects the root hash of the state tree and message tree ([mergeSignups.ts](../cli/ts/mergeSignups.ts) and [mergeMessages.ts](../cli/ts/mergeMessages.ts)) and processes messages one at a time, in batches.

They call the `Poll` smart contract functions:

- `mergeMaciStateAqSubRoots()` and `mergeMaciStateAq()` for the state tree
- `mergeMessageAqSubRoots()` and `mergeMessageAq()` for the message tree

These functions call the accumulator queue (`AccQueue.sol`) that exposes two functions: `mergeSubRoots()` and `merge()` which calculates the merkle root of all the leaves.

The coordinator provides a ZK proof that the messages are processed correctly and that the intermediary state is an input for the next step (batch).
The coordinator collects events that are emitted when the message is published and reconstructs them, collects root hashes of state and message trees, processes them in batches, and outputs the result (along with the proof) - the result is the tally of the votes.

In [genProofs.ts](../cli/ts/genProofs.ts) the MACI state is reconstructed (`genMaciStateFromContract()`), messages are processed, and proofs are generated and stored in a proof_file.
Then, in [proveOnChain.ts](../cli/ts/proveOnChain.ts) the coordinator sumbits proofs (saved proof_file) and commitment (the new state root and ballot root commitment after all messages are processed) from the previous step by calling `processMessages()` from `MessageProcessor.sol` and `tallyVotes()` from `TallyVotes.sol`.
