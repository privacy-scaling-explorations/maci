---
title: MACI Primitives
description: A short introduction of the main primitives used by MACI
sidebar_label: Primitives
sidebar_position: 4
---

## MACI primitives

This section provides a short introduction of the main primitives used by MACI.

### Elliptic Curves

MACI uses the Baby Jubjub Elliptic [Curve](https://iden3-docs.readthedocs.io/en/latest/_downloads/33717d75ab84e11313cc0d8a090b636f/Baby-Jubjub.pdf). The `p` scalar field of choosing is:

$p=21888242871839275222246405745257275088548364400416034343698204186575808495617$

with generator:

$995203441582195749578291179787384436505546430278305826713579947235728471134$
$5472060717959818805561601436314318772137091100104008585924551046643952123905$

and within the finite field with modulo $p$.

### Key Pairs

MACI uses Node.js's `crypto.randomBytes(32)` function to generate a cryptographically strong pseudorandom 32-byte value, as well as an algorithm to prevent modulo bias. In pseudocode this is:

```python
lim = 2 ** 256
min = lim - p
rand = null
while true:
    rand = BigInt(crypto.getRandomBytes(32))
    if rand >= min:
        break

privKey = rand % p
```

A public key is a point on the Baby Jubjub [curve](https://iden3-docs.readthedocs.io/en/latest/_downloads/33717d75ab84e11313cc0d8a090b636f/Baby-Jubjub.pdf), which is deterministically derived from a private key `s`.

### Message Signing

To sign messages, MACI uses the Edwards-curve Digital Signature Algorithm (EdDSA), implemented by [iden3](https://iden3-docs.readthedocs.io/en/latest/iden3_repos/research/publications/zkproof-standards-workshop-2/ed-dsa/ed-dsa.html#ed-dsa).

### Hash Functions

MACI uses the Poseidon hash function, which is proven to be very efficient in ZK applications. Poseidon accepts $n$ inputs and produces 1 output:

$y = poseidon_n([x_1, x_2, ..., x_n])$

Also, SHA256 is used to compress public inputs to a circuit into a single field element in the finite field $F$ mod $p$.

### Message Encryption

In order to encrypt messages, MACI uses Poseidon in DuplexSponge [mode](https://dusk.network/uploads/Encryption-with-Poseidon.pdf). This provides an encryption function and a decryption function:

- $C$ as $poseidonEncrypt(k_s[0], k_s[1], N, l, t[])$
- $poseidonDecrypt(k_s[0], k_s[1], N, l, C)$

In more details,

- $k_s$ is the shared key, a point on the Baby Jubjub curve
- $N$ is the nonce, which we hardcode to 0
- $l$ is the length of the plaintext $t[]$

The implementation can be found [here](https://github.com/weijiekoh/circomlib/).

### Shared Key Generation

The ECDH algorithm is used to generate a shared key, which is then used to encrypt each message. This allows to create messages which are only decryptable by the coordinator and the person sending the message.

In more details:

- The coordinator's public key $cPk$ is known to all. Their private key $cSk$ is secret.

- When the user publishes a message (i.e. casts a vote), they generate an ephemeral keypair with private key $eSk$ and public key $ePk$.

- The user generates the shared key $k$ using the coordinator's public key $cPk$ and the user's ephemeral private key $eSk$.

- The user encrypts the command and signature with $k$ to form a message.

- The user sends their ephemeral public key $ePk$ along with the ciphertext. The coordinator can recover the same shared key using their private key $cSk$ and the given ephemeral public key $ePk$.

### Merkle Trees

Rather than using Binary merkle trees, MACI uses Quinary merkle trees (5 leaves per node). This allows for more gas efficient computation using the Poseidon hash function.

#### Accumulator queue

This contract holds user sign-ups and messages. When a leaf is inserted into the `AccQueue`, the merkle root is not updated yet, instead the leaf is updated or the root of a subtree is re-computed. The smart contract exposes three functions:

- `enqueue(leaf)`: Enqueues a leaf into a subtree
  four out of five times it is invoked, an enqueue operation may or may not require the contract to perform a hash function. When it does, only up to $t_d$ required number of hashes need to be computed
- `mergeSubRoots()`: Merge all subtree roots into the shortest possible Merkle tree to fit
  Before computing the main Merkle root, it is necessary to compute the smallSRTroot (the smallest subroot tree root). This is the Merkle root of a tree which is small enough to fit all the subroots
  function which allows the coordinator to specify the number of queue operations to execute. The entire tree may be merged in a single transaction, or it may not.
- `merge()`: Calculate the Merkle root of all the leaves at height $d_t$

### Domain Objects

#### Verifying Keys

A verifying key $vk$ is comprised of the following elements:

1. $\alpha$, a point in the curve on which $G_1$ is defined
2. $$\beta$$, a point in the curve on which $G_2$ is defined
3. $\gamma$, a point in the curve on which $G_2$ is defined
4. $\delta$, a point in the curve on which $G_2$ is defined
5. $ic[]$, a list of points in the curve on which $G_1$ is defined

A verifying key is used to validate a zk-SNARK proof. Each unique permutation of parameters to a particular circuit has a different verifying key.

#### Private Keys

MACI's private keys allow users to send and decrypt messages. This key translates to a scalar point on the Baby Jubjub elliptic curve. All keys are serialized with the prefix `macisk`.

#### Public Keys

Public keys also translate to a point on the Baby Jubjub elliptic curve, and is derived from the private key $k$. These are serialized with the prefix `macipk`.

#### Key Pair

A Key Pair is a private key and its corresponding public key.

#### Command

A command represents an action that a user may take. Such as casting a vote in a poll or changing their public key if bribed. It is made up of the following parameters:

| Symbol       | Name                    | Size | Description                                                                                         |
| ------------ | ----------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| $cm_i$       | State index             | 50   | State leaf index where the signing key is located                                                   |
| $cm_{p_{x}}$ | Public key x-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's x-coordinate       |
| $cm_{p_{y}}$ | Public key y-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's y-coordinate       |
| $cm_{i_{v}}$ | Vote option index       | 50   | Option state leaf index of preference to assign the vote for                                        |
| $cm_w$       | Voting weight           | 50   | Voice credit balance allocation, this is an arbitrary value dependent on a user's available credits |
| $cm_n$       | Nonce                   | 50   | State leaf's index of actions committed plus one                                                    |
| $cm_{id}$    | Poll id                 | 50   | The poll's identifier to cast in regard to                                                          |
| $cm_s$       | Salt                    | 253  | An entropy value to inhibit brute force attacks                                                     |

#### Message

A message is an encrypted command using the shared key $k_s$ between the voter and the coordinator. The plaintext $t$ is computed as such:

$t = [p, cm_{p_{x}}, cm_{p_{y}}, cm_s, R8[0], R8[1], S]$

While the message can be computed with the formula below:

$M$ = ${poseidonEncrypt}(k_s[0], k_s[1], cm_n, 7, t)$

#### Decrypting a message

To decrypt a message using $k_s$ is expressed as

$[p, R8[0], R8[1], cm_s]$ = ${poseidonDecrypt}(M, k_s[0], k_s[1], cm_n, 7)$

To unpack $p$ to its original five parameters, it must be separated into 50 bit values from the parent 250 bit value. To extract 50 bits at byte $n$, we:

1. initialise 50 bits
2. shift left by $n$ bits
3. bitwise AND with $p$
4. shift right by $n$ bits

### Ballot

A Ballot represents a particular user's votes in a poll, as well as their next valid nonce. It is akin to a voting slip, which belongs to only one voter and contains a list of their choices.

| Symbol    | Name                       | Comments                                                                   |
| --------- | -------------------------- | -------------------------------------------------------------------------- |
| $blt_{v}$ | An array of vote weights   | $blt_{v[i]}$ refers to the vote weights assigned to vote option $i$        |
| $blt_n$   | The current nonce          | Starts from 0 and increments, so the first valid command must have nonce 1 |
| $blt_d$   | The vote option tree depth |                                                                            |

The hash $blt$ is computed as such:

1. Compute the Merkle root of $blt_v$, arity 5, of a tree of depth $blt_d$; let this value be $blt_r$
2. Compute $poseidon_2([blt_n, blt_r])$

### State leaf

A state leaf represents a user's participation declared through an identity (their public key) and information relevant to their ability or right to cast votes in a poll (their voice credit balance and the block timestamp at which they signed up).

We define a state leaf $sl$ as the $poseidon_4$ hash of the following:

| Symbol     | Name                      | Comments                                    |
| ---------- | ------------------------- | ------------------------------------------- |
| $sl_{P_x}$ | Public key's x-coordinate |                                             |
| $sl_{P_y}$ | Public key's y-coordinate |                                             |
| $sl_{v}$   | Voice credit balance      |                                             |
| $sl_{t}$   | Block timestamp           | In Unix time (seconds since Jan 1 1970 UTC) |

The hash $sl$ is computed as such:

$sl = poseidon_4([sl_{A_x}, sl_{A_y}, sl_{v}, sl_{t}])$

#### Blank state leaf

A blank state leaf $sl_B$ has the following value:

$6769006970205099520508948723718471724660867171122235270773600567925038008762$

This value is computed as such:

$A_{b_x} = 10457101036533406547632367118273992217979173478358440826365724437999023779287$
$A_{b_y} = 19824078218392094440610104313265183977899662750282163392862422243483260492317$
$sl_B = poseidon_4([A_{b0}, A_{b1}, 0, 0])$

The code to derive $A_{b_x}$ and $A_{b_y}$ is [here](https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js). The function call required is `pedersenHash.getBasePoint('blake', 0)`

1. Hash the string `PedersenGenerator_00000000000000000000000000000000_00000000000000000000000000000000` with $blake_{256}$. In big-endian hexadecimal format, the hash should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697160`.
2. Set the 255th bit to 0. The result should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697120`.
3. Use the method to convert a buffer to a point on the BabyJub curve described in [2.3.2].
4. Multiply the point by 8. The result is the point with x-value $A_{b_x}$ and y-value $A_{b_y}$

Given the [elliptic curve discrete logarithm problem](https://wstein.org/edu/2007/spring/ent/ent-html/node89.html), we assume that no-one knows the private key $s \in {F}_p$ and by using the public key generation procedure in [1.4], we can derive $A_{b_x}$ and $A_{b_y}$. Furthermore, the string above (`PedersenGenerator...`) acts as a nothing-up-my-sleeve value.
