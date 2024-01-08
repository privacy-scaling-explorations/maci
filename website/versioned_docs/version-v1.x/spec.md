---
title: MACI v1.0 Specification
description: A detailed specification meant to assist auditors in reviewing MACI version 1.0
sidebar_label: Specification
sidebar_position: 15
---

# MACI v1.0 Specification

:::info
This document is a copy of the [MACI 1.0 Specification (for audit) document](https://hackmd.io/AP6zPSgtThWxx6pjXY7R8A), created in July 2021 for one of [MACI's formal audits](/docs/audit).

This historical document is stored here for informational purposes. We do not intend to edit it. As a result, some of the information within this document may be outdated.
:::

This is a detailed specification meant to assist auditors in reviewing [MACI version 1.0](https://github.com/privacy-scaling-explorations/maci/releases/tag/v1.0.0).

We thank the Zkopru team for their [protocol specification](https://github.com/zkopru-network/protocol-specification/), which this document adopts.

## Audit scope

The commit hashes relevant to this audit are the following:

| Name                                                      | Commit                                                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `appliedzkp/maci` (`v1` branch)                           | [`2db5f625b67a6b810bd851950d7a42c26189088b`](https://github.com/appliedzkp/maci/tree/2db5f625b67a6b810bd851950d7a42c26189088b)     |
| `weijiekoh/circomlib` (`feat/poseidon-encryption` branch) | [`0e78dde8c813b95f4585b0613927e9c4269de500`](https://github.com/weijiekoh/circomlib/tree/0e78dde8c813b95f4585b0613927e9c4269de500) |

The scope of the audit with regards to the `circomlib` library covers:

- all the JS files that MACI references, **excluding** those which are not referenced by MACI's TS files
- all circuit files **excluding** whose which are not referenced by MACI's circuit files

### Statements that we wish to challenge

Through this audit, we wish to challenge the following statements:

1. MACI exhibits collusion resistance
   - No one except a trusted coordinator should be certain of the validity of a vote, reducing the effectiveness of bribery
2. MACI exhibits receipt-freeness
   - No voter may prove (besides to the coordinator) which way they voted
3. MACI provides privacy
   - No one except a trusted coordinator should be able to decrypt a vote
4. MACI is uncensorable:
   - No one (not even the trusted coordinator) should be able to censor a vote
5. MACI provides unforgeability
   - Only the owner of a user's private key may cast a vote tied to its corresponding public key
6. MACI provides non-repudiation
   - No one may modify or delete a vote after it is cast, although a user may cast another vote to nullify it
7. Correct execution
   - No one (not even the trusted coordinator) should be able to produce a false tally of votes

## 1. Cryptographic primitives

### Elliptic Curve Cryptography

MACI uses the Baby Jubjub Elliptic Curve as defined in [this paper by Whitehat, Baylina, and Bellés](https://iden3-docs.readthedocs.io/en/latest/_downloads/33717d75ab84e11313cc0d8a090b636f/Baby-Jubjub.pdf).

#### 1.1. The Baby Jubjub curve

Following the Baby Jubjub paper, we define the scalar field \\(p\\) as such:

$p = 21888242871839275222246405745257275088548364400416034343698204186575808495617$

The field $\mathbb{F}_p$ is the finite field with modulo $p$.

The generator point of Baby Jubjub $G$ is:

```
995203441582195749578291179787384436505546430278305826713579947235728471134,
5472060717959818805561601436314318772137091100104008585924551046643952123905
```

#### 1.2. Private key generation

A private key is a random integer in the field $\mathbb{F}_p$.

MACI uses the Node.js [`crypto.randomBytes(32)`](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback) function to generate a cryptographically strong pseudorandom 32-byte value, as well as an algorithm to prevent [modulo bias](https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to). In pseduocode this is expressed as:

```
lim = 2 ** 256
min = lim - p
rand = null
while true:
    rand = BigInt(crypto.getRandomBytes(32))
    if rand >= min:
        break

privKey = rand % p
```

#### 1.3. Private key formatting

The following procedures require that a private key be formatted into a scalar that can be multiplied with a point on the Baby Jubjub curve.

1. Public key generation
2. ECDH shared key generation

The algorithm to do so is as such:

1. Hash the private key using $\mathsf{blake512}$ as such: $h_1 = \mathsf{blake512}(s)$
2. Take the lowest 32 bytes of $h_1$ as a buffer and prune it to derive $h_2$. To prune the buffer, we:
   2.1. Clear the lowest three bits of the 0th byte
   2.2. Clear the highest bit of the 31st byte
   2.3. Set the second-highest bit of the 31st byte to `1`.
3. Convert $h_2$ to its little-endian integer representation. We denote this as $h_3$
4. Shift $h_3$ right by 3 bits to get the formatted private key $h_4$

#### 1.4. Public key generation

A public key is a point on the Baby Jubjub curve. It is determistically derived from a private key $s$, the procedure to do so is almost identical to [RFC8032](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.5).

1. Format the private key [1.3]
2. Multiply $G$ by 8 and multiply the resulting point by the formatted private key to derive the public key $A$:
   $B = 8 \cdot G$
   $A = B \cdot h_4$

#### 1.5. Digital signature generation

We use the Edwards-curve Digital Signature Algorithm (EdDSA) to sign messages. The code which implements signature generation and verification is iden3's [implementation](https://github.com/iden3/circomlib/blob/861a75e0cb3384d49c25d1f9d39de6a7ec60229f/src/eddsa.js) in the circomlib library.

Given a private key $s$, its public key $A$ [1.4] and a message $M \in \mathbb{F}_p$, we derive the signature $R8, S$ as such:

1. Hash the private key using $\mathsf{blake512}$ as such: $h_1 = \mathsf{blake512}(s)$
2. Format $s$ [1.3] to generate $A$ [1.4]
3. Convert $M$ to a buffer in little-endian format, concatenate it with the 32nd to 64th bytes of $h_1$, and hash the result with $\mathsf{blake512}$, and interpret the hash in little-endian format as a value $r$ in the field $\mathbb{F}_p$
4. Multiply $r$ with $B$ to get $R8$
5. Hash $R8$, $A$, and $M$: $hm = \mathsf{poseidon_4}([R8[0], R8[1], A[0], A[1], m])$
6. Calculate $S = hm \cdot h_3 + r$
7. The signature is $R8, S$

#### 1.6. Digital signature verification

Given a message $M$, a signature $R8$, $S$, and a public key $A$, we verify the signature in this manner:

1. $hm = \mathsf{poseidon_4}(R8[0], R8[1], A[0], A[1], M)$
2. The signature is valid if the following are equal:
   2.1. $(G \cdot 8) \cdot S$
   2.2. $((hm \cdot 8) \cdot A) + R8$

### Hash functions

#### 1.7. Poseidon

We define $\mathsf{poseidon_n}$ as a hash function which accepts $n$ inputs and produces one output $y$:

$y = \mathsf{poseidon_n}([x_1, x_2, ..., x_n])$

where $x_i, y \in \mathbb{F}_p$.

We use the implementation provided by `circomlib`, which uses the S-box $x^5$ and the following $R_F$ and $R_P$ values:

| $n$ | $t$ | $R_F$ | $R_P$ |
| --- | --- | ----- | ----- |
| 2   | 3   | 8     | 57    |
| 3   | 4   | 8     | 56    |
| 4   | 5   | 8     | 60    |
| 5   | 6   | 8     | 60    |

We verified that `circomlib`'s $\mathsf{poseidon_n}$ implementation matches the reference implementation using the procedure documented [here](https://github.com/appliedzkp/poseidon_in_circomlib_check).

#### 1.8. SHA256

SHA256 is used to compress public inputs to a circuit into a single field element in $\mathbb{F}_p$. This reduces zk-SNARK verification gas costs. SHA256 is defined in [RFC6234](https://datatracker.ietf.org/doc/html/rfc6234). We use implementations in the EVM as well as [ethers.js](https://docs.ethers.io/v5/api/utils/hashing/#utils-soliditySha256).

### Symmetric encryption

#### 1.9. Poseidon in DuplexSponge mode

We use the Poseidon permutation function in DuplexSponge mode to encrypt each command and its signature. This method is described by the authors of the Poseidon hash function [here](https://drive.google.com/file/d/1EVrP3DzoGbmzkRmYnyEDcIQcXVU7GlOd/view).

We refer to the encryption function which produces ciphertext $C$ as $\mathsf{poseidonEncrypt}(k_s[0], k_s[1], N, l, t[])$ where:

- $k_s$ is the shared key, a point on the Baby Jubjub curve
- $N$ is the nonce, which we hardcode to 0
- $l$ is the length of the plaintext $t[]$

At the time of writing, the Javascript and circom code for Poseidon encryption / decryption is in [this fork](https://github.com/weijiekoh/circomlib/) of the original iden3 codebase.

$\mathsf{poseidonDecrypt}(k_s[0], k_s[1], N, l, C)$ is the decryption function that reverses $\mathsf{poseidonEncrypt}$.

### Shared-key generation

#### 1.10. Elliptic-curve Diffie–Hellman (ECDH)

As will be described below, each command [2.5] is encrypted with a key that only the coordinator and the user know. In order to securely generate this shared key, we use the ECDH algorithm.

The coordinator's public key $cPk$ is known to all. Their private key $cSk$ is secret.

When the user publishes a message (i.e. casts a vote), they generate an ephemeral keypair with private key $eSk$ and public key $ePk$.

The user generates the shared key $k$ using the coordinator's public key $cPk$ and the user's ephemeral private key $eSk$.

The user encrypts the command and signature with $k$ to form a message [2.6].

The user sends their ephemeral public key $ePk$ along with the ciphertext. The coordinator can recover the same shared key using their private key $cSk$ and the given ephemeral public key $ePk$.

To generate $k$ from $cPk$ and $eSk$:

1. Format $eSk$ [1.3]
2. Multiply the point $cPk$ by the above result

### Merkle trees

We use quinary Merkle trees (5 leaves per node) rather than binary Merkle trees (2 leaves per node) due to the [gas and circuit constraints](https://ethresear.ch/t/gas-and-circuit-constraint-benchmarks-of-binary-and-quinary-incremental-merkle-trees-using-the-poseidon-hash-function/7446) when using the Poseidon hash function.

#### 1.10. Accumulator queue

When users sign up or publish messages, they invoke a smart contract function that _enqueues_ a leaf into an accumulator queue (which we dub an AccQueue). This is a data structure which is akin to a quinary Merkle tree. When a user inserts a leaf into the `AccQueue`, the Merkle root of all the leaves is _not_ yet updated. Rather, the leaf is either simply stored or the root of a _subtree_ is updated.

The height of the subtree $t_s$ is less than the full height of the tree $t_d$. The coordinator must _merge_ all the subtrees to compute the Merkle root of all the leaves, allowing users to save gas when they enqueue leaves.

It exposes the following interface:

1. `enqueue(leaf)`: Enqueues a leaf into a subtree
2. `mergeSubRoots()`: Merge all subtree roots into the shortest possible Merkle tree to fit
3. `merge()`: Calculate the Merkle root of all the leaves at height $t_d$

The AccQueue keeps track of $\mathsf{levels}$ and $\mathsf{indices}$ for the latest subtree. It also keeps track of a list of all the subtree roots.

An AccQueue which supports subtrees of depth $d$ has the following as mutable state:

| State item                      | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| $\mathsf{levels[33][4]}$        | Leaf/node values at each subtree level                     |
| $\mathsf{indices[33]}$          | The next available leaf/node index per subtree level       |
| $\mathsf{subRootLevels[33][4]}$ | Leaf/node values for the tree formed by subroots as leaves |
| $\mathsf{subRootIndices[33]}$   | The next available leaf/node index per subroot level       |
| $\mathsf{subRoots[]}$           | All the roots of complete subtrees                         |
| $\mathsf{numLeaves}$            | The number of enqueued leaves                              |

##### 1.10.1. Enqueuing a leaf

To enqueue a leaf $l$ in an AccQueue:

1. For each $n$ in $0...(d+1)$, either:
   - Store the leaf in $\mathsf{levels[n][indices[n]]}$ if $indices[n] < 5$, and break from the loop, or
     - Compute $\mathsf{poseidon_5}([levels[n][0], levels[n][1], levels[n][2], levels[n][3], l)$, clear all values of $levels[n]$, clear $indices[n]$, and continue the loop with the hash as $l$
2. Increment $\mathsf{numLeaves}$ by 1
3. If $\mathsf{numLeaves}$ is a multiple of $5^{t_s}$:
   - Append $\mathsf{levels}[t_s][0]$ to $subRoots$
   - Clear $\mathsf{levels}[t_s]$
   - Clear $\mathsf{indices}$

Effectively, four out of five times it is invoked, an enqueue operation _may or may not_ require the contract to perform a hash function. When it does, only up to $t_d$ required number of hashes need to be computed.

##### 1.10.2. Merging subroots

Before computing the main Merkle root, it is necessary to compute the `smallSRTroot` (the smallest subroot tree root). This is the Merkle root of a tree which is small enough to fit all the subroots, it uses a similar mechanisim to enqueuing leaves [1.10.2].

The `AccQueue.sol` contract provides the `mergeSubRoots(uint256 _numSrQueueOps)` function which allows the coordinator to specify the number of queue operations to execute. The entire tree may be merged in a single transaction, or it may not. Multiple calls to `mergeSubRoots` may be required due to the block gas limit.

##### 1.10.3. Computing main root

A similar operation to [1.10.2] and [1.10.3] is used to derive the main Merkle root (with depth $t_d$).

#### 1.11. Groups on the alt_bn128 elliptic curve

We refer to the $G_1$ and $G_2$ cyclic groups as defined in [EIP-197](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-197.md).

## 2. Domain objects

### 2.1. Verifying key

A verifying key $vk$ is comprised of the following elements:

1. $\alpha$, a point in the curve on which $G_1$ is defined
2. $\beta$, a point in the curve on which $G_2$ is defined
3. $\gamma$, a point in the curve on which $G_2$ is defined
4. $\delta$, a point in the curve on which $G_2$ is defined
5. $ic[]$, a list of points in the curve on which $G_1$ is defined

A verifying key is used to validate a zk-SNARK proof. Each unique permutation of parameters to a particular circuit has a different verifying key.

### 2.2. Private key

A private key $k$ represents a particpant's ability to broadcast or decrypt messages under an unique identity and generation of a shared key [1.9], it translates to a scalar point on the Baby Jubjub ellpitical curve. To avoid confusion with Ethereum's ECDSA encryption, MACI requires serialisation bound with the prefix `macisk.`

#### 2.2.1. Serialisation

To represent $k$ as a serialised private key, it is converted into big-endian hexadecimal format (lowercase; using the Node.js [`BigInt.toString(16)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt/toString) function) and concatenated with the prefix, no padding is applied during this process.

For example, the following private key in decimal format:

$3785182559838189109279346060397029719208250533050190830847077167272231264061$

is serialised as:

`macisk.85e56605303139aca49355df30d94f225788892ec71a5cfdbe79266563d5f3d`

#### 2.2.2. Deserialisation

To revert a serialised key back to its unserialised form $k$, the string is manipulated to isolate the hexadecimal value by removing the prefix (through the Node.js operation [`String.slice()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice)) and is prepended `0x` for conversion from hexadecimal back to its big-endian primitive.

### 2.3. Public key

A public key $p$ represents a users identity derived from $k$ and therefore is also a point on the Baby Jubjub curve. It too requires serialisation, but to clarify the contrast to private keys it is assigned the prefix `macipk.`

#### 2.3.1. Serialisation

To get a serialised public key from public key coordinates, the variable $u$ is defined as public key's y-cordinate, a 32 bit buffer $v$ is created and iterated over each uninitialised byte to:

1. assign the result of a bitwise [`AND (&)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND) operation between values $u$ and $255$ to byte $n$
2. shift $u$ right by 8 bits ([`>>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift))

The result $v$ is a hexadecimal big-endian value which is prendend its prefix to declare it as a serialised key.

#### 2.3.2. Deserialisation

To reverse the effects of serialisation and return the unpacked public key, we must remove the prefix (using the method defined in [2.2.2]) and convert back to a buffer from hexadecimal. A return variable $y$ is initialised and the buffer is then iterated over each byte to:

1. shift $u$ left by the result of $8$ multiplied by $n$ bits ([`<<`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift))
2. assign $y$ the result of addition between $y$ and $u$

The result $y$ is the public key's y-cordinate, to then compute the x-cordinate we must look at the equation for the twisted Edwards elliptic curve (as defined in [`EIP-2494`](https://eips.ethereum.org/EIPS/eip-2494)):

$ax^2 + y^2 = 1 + dx^2y^2$

solving for $x$, results:

$x$ = $\mathsf{\sqrt{\frac{dy^2 - a}{y^2 - 1}}}$

### 2.4. Keypair

A keypair is a private key and its corresponding public key.

### 2.5. Command

A command represents an action that a user may take. Such as casting a vote in a poll or changing their public key if bribed. It is made up of the following parameters:

| Symbol       | Name                    | Size | Description                                                                                        |
| ------------ | ----------------------- | ---- | -------------------------------------------------------------------------------------------------- |
| $cm_i$       | State index             | 50   | State leaf index where the signing key is located                                                  |
| $cm_{p_{x}}$ | Public key x-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's x-coordinate      |
| $cm_{p_{y}}$ | Public key y-coordinate | 253  | If no change is necessary this parameter should reflect the current public key's y-coordinate      |
| $cm_{i_{v}}$ | Vote option index       | 50   | Option state leaf index of preference to assign the vote for                                       |
| $cm_w$       | Voting weight           | 50   | Voice credit balance allocation, this is an arbitary value dependent on a user's available credits |
| $cm_n$       | Nonce                   | 50   | State leaf's index of actions committed plus one                                                   |
| $cm_{id}$    | Poll id                 | 50   | The poll's identifier to cast in regard to                                                         |
| $cm_s$       | Salt                    | 253  | An entropy value to inhibit brute force attacks                                                    |

The parameters; $cm_i$, $cm_{i_{v}}$, $cm_n$, $cm_w$ and $cm_{id}$ are packed into a singular 250 bit value $p$, defined as the sum of bitwise right shifts from 0 to 250, incrementing by 50 for each parameter. This reduces gas expenditures when generating a $\mathsf{poseidon_{4}}$ hash of a command $h_{cm}$, expressed as:

$h_{cm}$ = $\mathsf{poseidon_{4}([p, cm_{p_{x}}, cm_{p_{y}}, cm_s])}$

#### 2.5.1. Signing a command

To sign a command with a public key $A$:

1. Compute $M = h_{cm}$
2. Sign $M$ using EdDSA [1.5]
3. The signature is $R8, S$

#### 2.5.2. Verifying a signature

We use the method described in [1.6]

### 2.6. Message

A message represents an encrypted command. Given a shared key $k_s$ derived using ECDH [1.10] and plaintext $t$, we compute:

$t = [p, cm_{p_{x}}, cm_{p_{y}}, cm_s, R8[0], R8[1], S]$

$M$ = $\mathsf{poseidonEncrypt}(k_s[0], k_s[1], cm_n, 7, t)$

#### 2.6.1. Decrypting a message

To decrypt a message using $k_s$ is expressed as

$[p, R8[0], R8[1], cm_s]$ = $\mathsf{poseidonDecrypt}(M, k_s[0], k_s[1], cm_n, 7)$

To unpack $p$ to it's original five parameters, it must be seperated into 50 bit values from the parent 250 bit value. To extract 50 bits at byte $n$, we:

1. initialise 50 bits
2. shift left by $n$ bits
3. bitwise AND with $p$
4. shift right by $n$ bits

### 2.7. Ballot

A Ballot represents a particular user's votes in a poll, as well as their next valid nonce. It is akin to a voting slip, which belongs to only one voter and contains a list of their choices.

| Symbol    | Name                       | Comments                                                                   |
| --------- | -------------------------- | -------------------------------------------------------------------------- |
| $blt_{v}$ | An array of vote weights   | $blt_{v[i]}$ refers to the vote weights assigned to vote option $i$        |
| $blt_n$   | The current nonce          | Starts from 0 and increments, so the first valid command must have nonce 1 |
| $blt_d$   | The vote option tree depth |                                                                            |

The hash $blt$ is computed as such:

1. Compute the Merkle root of $blt_v$, arity 5, of a tree of depth $blt_d$; let this value be $blt_r$
2. Compute $\mathsf{poseidon_2}([blt_n, blt_r])$

### 2.8. State leaf

A state leaf represents a user's participation declared through an identity (their public key) and information relevant to their ability or right to cast votes in a poll (their voice credit balance and the block timestamp at which they signed up).

We define a state leaf $sl$ as the $\mathsf{poseidon_4}$ hash of the following:

| Symbol     | Name                      | Comments                                    |
| ---------- | ------------------------- | ------------------------------------------- |
| $sl_{P_x}$ | Public key's x-coordinate |                                             |
| $sl_{P_y}$ | Public key's y-coordinate |                                             |
| $sl_{v}$   | Voice credit balance      |                                             |
| $sl_{t}$   | Block timestamp           | In Unix time (seconds since Jan 1 1970 UTC) |

The hash $sl$ is computed as such:

$sl = \mathsf{poseidon_4}([sl_{A_x}, sl_{A_y}, sl_{v}, sl_{t}])$

#### 2.8.1. Blank state leaf

A blank state leaf $sl_B$ has the following value:

$6769006970205099520508948723718471724660867171122235270773600567925038008762$

This value is computed as such:

$A_{b_x} = 10457101036533406547632367118273992217979173478358440826365724437999023779287$
$A_{b_y} = 19824078218392094440610104313265183977899662750282163392862422243483260492317$
$sl_B = \mathsf{poseidon_4}([A_{b0}, A_{b1}, 0, 0])$

The code to derive $A_{b_x}$ and $A_{b_y}$ is [here](https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js). The function call required is `pedersenHash.getBasePoint('blake', 0)`

1. Hash the string `PedersenGenerator_00000000000000000000000000000000_00000000000000000000000000000000` with $\mathsf{blake_{256}}$. In big-endian hexadecimal format, the hash should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697160`
2. Set the 255th bit to 0. The result should be `1b3ef77ef2cd620fd2358e69dd564f35556aad552fdd7f06b777bd3a1d697120`
3. Use the method to convert a buffer to a point on the BabyJub curve described in [2.3.2]
4. Multiply the point by 8. The result is the point with x-value $A_{b_x}$ and y-value $A_{b_y}$

Given the [elliptic curve discrete logarithm problem](https://wstein.org/edu/2007/spring/ent/ent-html/node89.html), we assume that no-one knows the private key $s \in \mathbb{F}_p$ and by using the public key generation procedure in [1.4], we can derive $A_{b_x}$ and $A_{b_y}$. Furthermore, the string above (`PedersenGenerator...`) acts as a nothing-up-my-sleeve value.

## 3. Higher-level concepts

### 3.1. Actors

There is a coordinator and one or more users.

#### Coordinator

The coordinator's public key is $cPk$ and their private key is $cSk$.

#### User

A user's ephemeral public key is $ePk$ and their ephemeral private key is $eSk$.

### 3.2. How MACI prevents collusion

In governing systems, collusion can be described as the ability to distort any ballot through acts of influence, most often witnessed as bribery. Such arrangements require the bribee to vote in a manner requested by the briber, and for the former to provide proof (such as the transaction hash of a vote) to receive compensation (e.g. a monetary incentive) for their compliance.

MACI provides collusion-resistance assuming that:

- it uses an identity system which is sybil-resistant
- the coordinator is honest

That said, even if the coordinator is dishonest, they can neither tamper nor censor with its execution.

In MACI, the contents of a vote can only be decrypted by the coordinator. Moreover, the validity of a vote cannot be proven, as participants can revoke past actions through key-changes. Therefore, inhibiting the adversary in validating the fufilliment of such agreements.

To clarify how this works, consider the following situation between Alice and Eve involving a vote option A:

1. Alice registers her identity during the sign up period, in preparation for the upcoming poll
2. The sign up period ends and the voting period begins, Eve bribes Alice to oppose option A
3. Alice casts a message for option A, in which she simultaneously:
   - Votes in opposition of A
   - Changes her keypair through submitting a new public key
4. Eve is uncertain whether Alice has voted for her preference due to the secrecy of the message, regardless she assumes confirmation upon recieving the transaction hash
5. Alice broadcasts a message from the new keypair registered in step 3 and casts a vote in support of poll A in turn, voiding her initial vote in opposition

Eve is doubtful whether her request was actually satisfied and is unaware to Alice casting a new vote to void the first, she decides not compensate Alice because of the uncertainty surrounding her compliance.

### 3.3. Gatekeeper contract

The gatekeeper contract is an abstraction of logic that any deployment of MACI can modify. It is a way to whitelist signups to the system. For example, a custom gatekeeper contract may only allow addresses which own a certain ERC721 token for registration.

### 3.4. Initial voice credit proxy

The voice credit contract is another abstraction of logic that any deployment can configure at preference. It is a mechanism to define or admit voting power among participants based on, for instance, one's token balances. MACI only supports $2^{32}$ (`unit256`) values for voice credit balances.

### 3.5. Verifying key registry

In MACI there are two zkSNARK circuits each ensuring:

- the correct registration of messages to the state tree
- the correct execution of the tallying of votes

Each of these circuits involve ownership of an independent verifying key to validate each when successfully executed, these are generated during the trusted setup and are initialised to the registry for generating proofs.

### 3.6. State

#### The state tree

Each leaf the state tree encodes a participant's identity (public key) and the Unix timestamp at which they signed up. It has an arity of 5 and its depth is hardcoded to 10.

The default leaf value is the hash of a blank state leaf [2.8.1], insertions begin at index 1. Leaf 0 is reserved to inhibit a denial-of-service attack as explained below in [6.1].

#### The ballot tree (per poll)

Each leaf within the ballot trees stores a participants vote within a poll, it shares the same arity and depth as the state tree. It also has index 0 reserved for a blank leaf following the same basis.

#### The message tree (per poll)

Each leaf within the message tree correlates to a command cast from participants within a poll, it too like the state tree has a default nothing-up-my-sleeve value at leaf zero. Except it is a Keccak256 hash of the string `"Maci"` moduluo the SNARK field size $p$ [1.1].

### 3.7. System flow

#### When a user signs up

Registration is initiated through fulfilling the requirements specified in the gatekeeper contract and calling the `signUp()` method in the MACI contract. This enqueues adding a new leaf to the state tree for it to be merged by the coordinator once appropriate.

#### When a user publishes a message

Publishing messages requires users to encrypt a command using a shared key generated using ECDH [1.10] and submiting the ciphertext through the `publishMessage()` function. The message is then queued for processing by the co-ordinator once published.

#### When the coordinator merges the state queue

To subsidise gas costs for users, registration does not require the state root to be updated at its full depth, which would incur a gas cost linear to the depth. Rather, the use the Accumulator Queue system described in [1.10] enqueues leaves. As such, the coordinator must compute the state tree root after the voting period is over and before they process messages.

Which first requires the merging of subroots [1.10.1], this creates the shortest possible tree that contains all the state leaves. Which may or may not require multiple transactions (in the form of batches) due to the restriction of the block gas limit. Once all the subroots have been computed they are merged [1.10.2] to compute the state root at its full depth.

After merging, the state-ballot commitment hash `currentSbCommitment` is initialised, which is a $\mathsf{poseidon_{3}}$ represenation of the state's Merkle root, the ballot's Merkle root and a salt. At initialisation the Merkle roots are equal to the trees at full depth.

#### When the coordinator merges the message queue

The process of merging queues are the same in both the message and state trees.

#### When the coordinator processes the messages

As large zk-SNARK circuits take up a lot of disk space and require a large amount of resources to compile, it is not feasible to prove the correctness of message processing for all messages in a single proof. Rather, we process messages in batches. With each batch of messages at a particular index, the coordinator proves, using a zk-SNARK proof, intermediate `currentSbCommitment` values for subroots at a relative depth. The authencity of this statement is confirmed using the registry's processing verifying key. The outcome of processing all batches, which must occur in consecutive order, is the same as if all the messages were processed in one go.

#### When the coordinator tallies the votes

To index tallying of votes in a poll, a tally commitment hash `tallyCommitment` is recorded which conforms similarly to the state-ballot commitment hash. The coordinator submits a new commitment hash and it's relative proof to tally the votes, which requires the verifying tallying key (queried from the registry) and the public input hash to validate the claim. Which is a SHA256 representation of the following parameters:

- a packed value of; the number of signups, batch start index and batch size (`packedVals` [6.2])
- the state-ballot commitment hash
- the current tally commitment hash
- the new tally commitment hash

The proof is then verified (see below) and the tally commitment hash is updated with the new value, this process is continued through iteration of the batch index until all pending votes have been tallied.

#### When a 3rd party verifies the tally

Any 3rd party contract may verify a leaf in `tallyCommitment` on-chain using a combination of Merkle proofs and hashing. Client developers should implement these functions as needed. We do not implement these functions in MACI to minimise contract size.

## 4. Command-line interface

Applications that use MACI are likely to be run in the browser. Users who sign up and vote can do so via web3 interactions. Only the coordinator needs to run scripts to deploy MACI, set verifying keys, deploy Polls, merge trees, process messages, and tally votes.

To make these processes easy to use, we provide command-line interface tools.

The integration tests and shell scripts in the `cli` directory provide examples of the order in which to execute them.

| Command            | Description                                              | Notes                                                                                                                                        |
| ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `genMaciPubkey`    | Generate a MACI public key from a private key            | Only the coordinator needs to run this, as users should generate their keys in the browser and should be automated by the client application |
| `genMaciKeypair`   | Generates a MACI private key and public key              | Only the coordinator needs to run this, as users should generate their keys in the browser and should be automated by the client application |
| `deployVkRegistry` | Deploy the `VkRegistry` contract                         | Executed only the coordinator                                                                                                                |
| `setVerifyingKeys` | Set verifying keys to the `VkRegistry`                   | Executed only the coordinator                                                                                                                |
| `create`           | Deploy a new instance of MACI                            | Executed only the coordinator                                                                                                                |
| `deployPoll`       | Deploy a new poll on a MACI instance                     | Executed only the coordinator                                                                                                                |
| `signup`           | Sign up a user                                           | Mainly for testing; as users are more likely to use the client application instead of the CLI                                                |
| `publish`          | Submit a message to a poll                               | Mainly for testing; as users are more likely to use the client application instead of the CLI                                                |
| `mergeMessages`    | Must be executed before generating proofs                | Executed only the coordinator                                                                                                                |
| `mergeSignups`     | Must be executed before generating proofs                | Executed only the coordinator                                                                                                                |
| `genProofs`        | Generate all message processing and vote tallying proofs | Executed only the coordinator                                                                                                                |
| `proveOnChain`     | Submit proofs to the `PollProcessorAndTallyer` contract  | Executed only the coordinator                                                                                                                |

## 5. Ethereum contracts

### 5.1. MACI

| Function                                                                                                                      | Permissions                                                         | Notes                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `init(VkRegistry _vkRegistry, MessageAqFactory _messageAqFactory)`                                                            | Coordinator only                                                    | Initialise factory, helper and registry contracts that share equal ownership |
| `signUp(PubKey memory _pubKey, bytes memory _signUpGatekeeperData, bytes memory _initialVoiceCreditProxyData)`                | Executable only during the sign-up period and after initialisation  | Participant registration and voice credit assignment                         |
| `mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId)`                                                               | Executable only by poll contract `_pollId` and after initialisation | Merge queued state leaves to form the state tree subroots                    |
| `mergeStateAq(uint256 _pollId)`                                                                                               | Executable only by poll contract `_pollId` and after initialisation | Merge the state subroots to form the state root                              |
| `getStateAqRoot()`                                                                                                            | Non-applicable                                                      | Query the state root                                                         |
| `deployPoll(uint256 _duration, MaxValues memory _maxValues, TreeDepths memory _treeDepths, PubKey memory _coordinatorPubKey)` | Executable only after initialisation                                | Create a new poll                                                            |
| `getPoll(uint256 _pollId)`                                                                                                    | Non-applicable                                                      | Query a poll address                                                         |

### 5.2. Poll

| Function                                                                     | Permissions                                                                            | Notes                                                                                           |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `getDeployTimeAndDuration()`                                                 | Non-applicable                                                                         | Query the deployment timestamp and duration                                                     |
| `numSignUpsAndMessages()`                                                    | Non-applicable                                                                         | Query the number of participants and messages cast                                              |
| `currentSbAndTallyCommitments()`                                             | Non-applicable                                                                         | Query the current state-ballot and tally commitments hashes                                     |
| `publishMessage(Message memory _message, PubKey memory _encPubKey)`          | Executable only during the voting period and if the message limit has not been not met | Submit a message (whether valid or not) to the message queue                                    |
| `hashMessageAndEncPubKey(Message memory _message, PubKey memory _encPubKey)` | Non-applicable                                                                         | Query a hash of a message and public key coordinates                                            |
| `mergeMaciStateAqSubRoots( uint256 _numSrQueueOps, uint256 _pollId)`         | Executable only by the coordinator and after the voting period                         | Merge queued state leaves to form the state subroots                                            |
| `mergeMaciStateAq(uint256 _pollId)`                                          | Executable only by the coordinator and after the voting period                         | Merge the state subroots to form the state root and initialise the state-ballot commitment hash |
| `mergeMessageAqSubRoots(uint256 _numSrQueueOps)`                             | Executable only by the coordinator and after the voting period                         | Merge the queued message leaves to form the message tree subroots                               |
| `mergeMessageAq()`                                                           | Executable only by the coordinator and after the voting period                         | Merge the message tree subroots to form the message tree root                                   |
| `batchEnqueueMessage(uint256 _messageSubRoot)`                               | Executable only by the coordinator and after the voting period                         | Submit a batch of messages to the queue                                                         |

### 5.3. PollFactory

| Function                                                                                                                                                                                                          | Permissions      | Notes                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------- |
| `setMessageAqFactory(MessageAqFactory _messageAqFactory)`                                                                                                                                                         | Coordinator only | Initialise the message factory contract |
| `deploy(uint256 _duration, MaxValues memory _maxValues, TreeDepths memory _treeDepths, BatchSizes memory _batchSizes, PubKey memory _coordinatorPubKey, VkRegistry _vkRegistry, IMACI _maci, address _pollOwner)` | Coordinator only | Create a new poll                       |

### 5.4. VkRegistry

| Function                                                                                                                                                                                                                   | Permissions      | Notes                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `isProcessVkSet(uint256 _sig)`                                                                                                                                                                                             | Non-applicable   | Query whether a signature is valid for message processing                                                                            |
| `isTallyVkSet(uint256 _sig)`                                                                                                                                                                                               | Non-applicable   | Query whether a signature valid for tallying votes                                                                                   |
| `genProcessVkSig(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize)`                                                                                             | Non-applicable   | Generate a signature (used for verifying key mapping lookups) for message processing by compressing parameters into a singular value |
| `genTallyVkSig(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth)`                                                                                                                         | Non-appicable    | Generate a signature (used for verifying key mapping lookups) for vote tallying by compressing parameters into a singular value      |
| `setVerifyingKeys( uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize, VerifyingKey memory _processVk, VerifyingKey memory _tallyVk)` | Coordinator only | Intialise verifying keys for processing and tallying to the contract alongside specifying each tree depth                            |
| `hasProcessVk(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize)`                                                                                                | Non-applicable   | Query whether the signature of the parameters is valid for message processing                                                        |
| `getProcessVkBySig(uint256 _sig)`                                                                                                                                                                                          | Non-applicable   | Query a processing verifying key by providing a valid signature                                                                      |
| `getProcessVk(uint256 _stateTreeDepth, uint256 _messageTreeDepth, uint256 _voteOptionTreeDepth, uint256 _messageBatchSize)`                                                                                                | Non-applicable   | Query a processing verifying key by providing parameters to generate a valid signature                                               |
| `hasTallyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth)`                                                                                                                            | Non-appicable    | Query whether the signature of the parameters is valid for vote tallying                                                             |
| `getTallyVkBySig(uint256 _sig)`                                                                                                                                                                                            | Non-applicable   | Query a tallying verifying key by providing a valid signature                                                                        |
| `getTallyVk(uint256 _stateTreeDepth, uint256 _intStateTreeDepth, uint256 _voteOptionTreeDepth)`                                                                                                                            | Non-appicable    | Query a tallying verifying key by providing parameters to generate a valid signature                                                 |

### 5.5. PollProcessorAndTallyer

| Function                                                                                                                                                                              | Permissions                                                    | Notes                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `sha256Hash(uint256[] memory array)`                                                                                                                                                  | Non-appicable                                                  | Hash an array of values (using SHA256) moduluo the snark field size                                          |
| `processMessages(Poll _poll, uint256 _newSbCommitment, uint256[8] memory _proof)`                                                                                                     | Executable only by the coordinator and after the voting period | Process state messages relative to a new state-ballot commitment given that the proof is valid               |
| `verifyProcessProof(Poll _poll, uint256 _currentMessageBatchIndex, uint256 _messageRoot, uint256 _currentSbCommitment, uint256 _newSbCommitment, uint256[8] memory _proof)`           | Non-appicable                                                  | Query whether a message processing proof is valid                                                            |
| `genProcessMessagesPublicInputHash(Poll _poll, uint256 _currentMessageBatchIndex, uint256 _messageRoot, uint256 _numSignUps, uint256 _currentSbCommitment, uint256 _newSbCommitment)` | Non-appicable                                                  | Hash of the coordinators public key, `packedVals`, current state-ballot commitment and message root          |
| `genProcessMessagesPackedVals( Poll _poll, uint256 _currentMessageBatchIndex, uint256 _numSignUps)`                                                                                   | Non-appicable                                                  | Generate a packed 250-bit value `packedVals` for message processing                                          |
| `genTallyVotesPackedVals( uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize)`                                                                                    | Non-appicable                                                  | Generate a packed 100-bit value `packedVals` for vote tallying                                               |
| `genTallyVotesPublicInputHash( uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize, uint256 _newTallyCommitment )`                                                 | Non-appicable                                                  | Hash of the current tally commitment, the new tally commitment, `packedVals` and the state-ballot commitment |
| `tallyVotes(Poll _poll, uint256 _newTallyCommitment, uint256[8] memory _proof)`                                                                                                       | Executable only by the coordinator and after the voting period | Tally votes relative to a new tally commitment given that the proof is valid                                 |
| `verifyTallyProof(Poll _poll, uint256[8] memory _proof, uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize, uint256 _newTallyCommitment)`                         | Non-appicable                                                  | Query whether a vote tallying proof is valid                                                                 |

## 6. zk-SNARKs

The zk-SNARK circuits in MACI are written in the [circom](https://github.com/iden3/circom) language. Proofs are [Groth16](https://eprint.iacr.org/2016/260.pdf) and are generated using the [`rapidsnark`](https://github.com/iden3/rapidsnark) prover.

We use custom tools to simplify the process of writing circuits, testing them, and generating proving and verifying keys. These tools are not in scope of the audit but it is useful to know them.

[`circom-helper`](https://github.com/weijiekoh/circom-helper) allows developers to test circom circuits quickly and easily. It compiles circuits and exposes a JSON-RPC API which allows developers to generate witnesses and access signal values without writing command-line glue scripts.

[`zkey-manager`](https://github.com/appliedzkp/zkey-manager)
simplifies the process of zkey file management for circuits written in circom.

Please note that MACI requires the coordinator to generate proofs on an x86 machine (Intel / AMD) or VM. Other processors (e.g. ARM) are not supported.

### 6.1. Message processing circuit

The message processing circuit, defined in `circuits/circom/processMessages.circom`, allows the coordinator to prove that they have correctly applied each message in reverse order, in a consecutive batch of `5 ^ msgBatchDepth` messages to the respective state leaf within the state tree.

#### Parameters

| Parameter             | Description                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stateTreeDepth`      | Depth of the state tree, this value must be equal to `10`                                                                                                     |
| `msgTreeDepth`        | Depth of the message tree, this must be the same value passed to the `deployPoll()` contract function of `MACI.sol`                                           |
| `msgBatchDepth`       | Depth of a tree that exactly fits the number of messages in a batch, this must be the same value passed to the `deployPoll()` contract function of `MACI.sol` |
| `voteOptionTreeDepth` | Depth of the vote option tree, this must be the same value passed to the `deployPoll()` contract function of `MACI.sol`                                       |

The state tree, message tree, and vote option trees all have an arity of 5. As such, it is possible to calculate the maximum number of signups, messages per poll, and vote options per poll.

#### Input signals

| Input signal                     | Description                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `inputHash`                      | The SHA256 hash of inputs supplied by the contract                                      |
| `packedVals`                     | As described below                                                                      |
| `pollEndTimestamp`               | The Unix timestamp at which the poll ends                                               |
| `msgRoot`                        | The root of the message tree                                                            |
| `msgs`                           | The batch of messages as an array of arrays                                             |
| `msgSubrootPathElements`         | As described below                                                                      |
| `coordinatorPubKeyHash`          | $\mathsf{poseidon_2}([cPk_x, cPk_y])$                                                   |
| `newSbCommitment`                | As described below                                                                      |
| `coordPrivKey`                   | The coordinator's private key                                                           |
| `coordPubKey`                    | The coordinator's public key                                                            |
| `encPubKeys`                     | The public keys used to generate shared ECDH encryption keys to encrypt the messages    |
| `currentStateRoot`               | The state root before the commands are applied                                          |
| `currentStateLeaves`             | The state leaves upon which messages are applied                                        |
| `currentStateLeavesPathElements` | The Merkle path to each incremental state root                                          |
| `currentSbCommitment`            | As described below                                                                      |
| `currentSbSalt`                  | As described below                                                                      |
| `newSbCommitment`                | As described below                                                                      |
| `newSbSalt`                      | As described below                                                                      |
| `currentBallotRoot`              | The root of the ballot tree before messages are applied                                 |
| `currentBallots`                 | The ballots upon which ballots are applied                                              |
| `currentBallotsPathElements`     | The Merkle path to each incremental ballot root                                         |
| `currentVoteWeights`             | The existing vote weight for the vote option in the ballot which each command refers to |
| `currentVoteWeightsPathElements` | The Merkle path from each vote weight to the vote option root in its ballot             |

##### `inputHash`

All inputs to this circuit are private except for `inputHash`. To save gas during verification, the `PollProcessorAndTallyer` contract hashes the following values using SHA256 and uses the hash as the sole element of $ic$:

1. `packedVals`
2. `coordinatorPubKeyHash`
3. `msgRoot`
4. `currentSbCommitment`
5. `newSbCommitment`
6. `pollEndTimestamp`

The hash is computed using the `sha256` Solidity function and is then subject to modulo $p$.

##### `packedVals`

`packedVals` is the following values represented as one field element. Consider that a field element is roughly 253 bits. The big-endian bit-representation is as such:

| Bits        | Value                      |
| ----------- | -------------------------- |
| 1st 53 bits | `0`                        |
| 2nd 50 bits | `batchEndIndex`            |
| 3rd 50 bits | `currentMessageBatchIndex` |
| 4th 50 bits | `numSignUps`               |
| 5th 50 bits | `maxVoteOptions`           |

For instance, if `maxVoteOptions` is 25 and `batchEndIndex` is `5`, and all other values are 0, the following is the `packedVals` representation in hexadecimal:

`140000000000000000000000000000000000019`

##### `currentSbCommitment` and `newSbCommitment`

The `currentSbCommitment` is the $\mathsf{poseidon_3}$ hash of the state tree root, the ballot tree root, and a random salt. The purpose of the random salt, which should be unique to each batch, is to ensure that the value of `currentSbCommitment` always changes even if all the commands in a batch are invalid and therefore do not change the state tree or ballot tree root.

The result of applying a batch of messages to `currentSbCommitment` is `newSbCommitment`.

##### `currentSbSalt`

The salt used to produce `currentSbCommitment` (see above).

##### `newSbSalt`

The salt used to produce `newSbCommitment` (see above).

##### `msgSubrootPathElements`

The index of each message in `msgs` is consecutive. As such, in order to prove that each message in `msgs` is indeed a leaf of the message tree, we compute the subtree root of `msgs`, and then verify that the subtree root is indeed a subroot of `msgRoot`.

A simplified example using a tree of arity 2:

```
             r
           /  \
          s    ...
       /    \
      o     o
     / \   / \
   a   b  c  d
```

To prove that `a...d` are leaves of the tree with root `r`, we prove that the leaves have the subroot `s` with depth 2, and _then_ prove that `s` is a member of `r` at depth 1.

The implementation for this is in the `QuinBatchLeavesExists` circuit in `circuits/circom/trees/incrementalQuinTree.circom`.

This method requires fewer circuit constraints than if we verified a Merkle proof for each leaf.

#### Statements that the circuit proves

1. That the prover knows the preimage to `inputHash` (see above)
2. That the prover knows the preimage to `currentSbCommitment` (that is, the state root, ballot root, and `currentSbSalt`)
3. That `maxVoteOptions <= (5 ^ voteOptionTreeDepth)`
4. That `numSignUps <== (5 ^ stateTreeDepth)`
5. That `coordPubKey` is correctly derived from `coordPrivKey`
6. That `coordPubKey` is the preimage to the Poseidon hash of `coordPubKey` (provided by the contract)
7. That each message in `msgs` exists in the message tree
8. That after decrypting and applying each message, in reverse order, to the corresponding state and ballot leaves, the new state root, new ballot root, and `newSbSalt` are the preimage to `newSbCommitment`

#### How messages are decrypted and applied

The circuit uses Poseidon decryption [1.9] to decrypt each message. The shared key is derived using ECDH [1.10] and the nonce is always equal to a value of`0`.

The procedure to apply a command to a state leaf and ballot leaf is as such:

1. Check if the signature is valid [1.6]
2. Check if the user has enough voice credits
   - To do so , we check if $sl_v + (blt_{v_{cm_{i_v}}})^{2} - (cm_{w})^2 \geq 0$
3. Check if the vote weight is less than `147946756881789319005730692170996259609` which is approximately $\sqrt p$
   - This ensures that the square of the vote weight will not overflow $p$
4. Check if the nonce is valid
5. Check if the state leaf index is valid
6. Check if the timestamp is valid
7. Check if the vote option index is valid.

If any of the above are invalid, the command is invalid.

If the command is valid:

1. Verify that the state leaf at $cm_i$ is a member of the state root
2. Verify that the ballot leaf at $cm_i$ is a member of the ballot root
3. Update the state root by replacing the state leaf at $cm_i$:
   - Set $sl_{P_x}$ to $cm_{P_x}$
   - Set $sl_{P_y}$ to $cm_{P_y}$
   - Set $sl_{v}$ to $cm_{i_v}$
4. Update the ballot root by replacing the ballot leaf at $cm_i$:
   - Set $blt_{v[cm_{i_v}]}$ to $cm_{w}$, update $blt_v$, and update $blt$ [2.7]

If the command is invalid:

1. Verify that the state leaf at index 0 is a member of the state root
2. Verify that the ballot leaf at index 0 is a member of the ballot root

The state leaf at index 0 is a _blank state leaf_, and the ballot leaf at index 0 is an _blank ballot leaf_. It should be impossible to update the 0th state leaf or 0th ballot leaf. The reason that these blank leaves exist at index 0 is to prevent an attack where a user sets $cm_i$ to the maximum possible value ($5^{10}$), which would force the coordinator to have to compute the Merkle path of leaf $5_{10} - 1$. Which is would take such a long time that it would constitute a denial-of-service attack on the coordinator that prevents them from generating proofs in a reasonable time.

##### Order of message processing

Messages are applied in reverse order. This prevents an attack where a briber colludes with a user to sign up and then immediately change their key to the briber's, ceding control entirely. Rather, the user may render previous commands invalid even if said commands are key-change commands. For instance:

###### If messages are processed in last-in-first-out order

1. User signs up with public key $u$
2. Briber tells user to change their key to $b$, they comply
3. Briber can now vote for anything they want using $b$ and their commands will be valid
4. The user cannot change the key as they do not know the briber's private key

###### If messages are processed in first-in-first-out order

1. User signs up with public key $u$
2. Briber tells user to change their key to $b$, the nonce of this command is 2, the user complies
3. Briber submits a vote, the nonce of this command is 1
4. User changes their key to $k$, the nonce of this command is 2
5. User votes for a vote option using public key $u$, the nonce of this command is 1

The commands at (3) and (2) are invalid because the commands at (5) and (4) are processed first. The command at (3) is invalid not only because the briber does not know the private key to $k$, but also because the expected nonce is 3.

### 6.2. Ballot tallying circuit

After the coordinator processes all message batches, each ballot contains the votes per vote option. The next step is to tally each vote so as to produce the following results:

1. Votes per vote option
2. Total voice credits per vote option
3. Total spent voice credits

As an illustration, consider the following Ballots for 5 uses. Assume that there are 5 vote options and all messages have already been processed.

```
[1, 2, 3, 4, 5]
[1, 2, 3, 4, 5]
[0, 0, 0, 0, 0]
[0, 0, 0, 0, 0]
[1, 1, 1, 1, 1]
```

The final tally should be:

1. Votes per vote option: `[3, 5, 7, 9, 11]`
2. Total voice credits per vote option: `[3, 9, 19, 33, 26]`
3. Total spent voice credits: `66`

The coordinator uses the ballot tallying circuit (`tallyVotes.circom`) to generate proofs that they have correctly computed the tally. As there are many ballots to tally, each proof only computes the tally for a batch of ballots. Each proof is chained to the previous one such that each proof is also a proof of knowledge of the preimage of the previous tally commitment.

#### Parameters

| Parameter             | Description                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `stateTreeDepth`      | Depth of the state tree, this value must be equal to `10`                                                               |
| `intStateTreeDepth`   | Depth of the intermediate state tree, `5 ** intStateTreeDepth` is the batch size                                        |
| `voteOptionTreeDepth` | Depth of the vote option tree, this must be the same value passed to the `deployPoll()` contract function of `MACI.sol` |

#### Input signals

| Input signal                            | Description                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `inputHash`                             | The SHA256 hash of inputs supplied by the contract               |
| `packedVals`                            | As described below                                               |
| `sbCommitment`                          | As described below                                               |
| `currentTallyCommitment`                | As described below                                               |
| `newTallyCommitment`                    | As described below                                               |
| `stateRoot`                             | The root of the state tree after all messages have been applied  |
| `ballotRoot`                            | The root of the ballot tree after all messages have been applied |
| `sbSalt`                                | The salt used to produce `sbCommitment`                          |
| `ballots`                               | The ballots in the batch being tallied                           |
| `ballotPathElements`                    | The Merkle path to each ballot leaf                              |
| `votes`                                 | The votes in each ballot cast per result                         |
| `currentResults`                        | The current tally of votes per vote option                       |
| `currentResultsRootSalt`                | A random value                                                   |
| `currentSpentVoiceCreditSubtotal`       | The subtotal of voice credits spent across all vote options      |
| `currentSpentVoiceCreditSubtotalSalt`   | A random value                                                   |
| `currentPerVOSpentVoiceCredits`         | The voice credits spent on each vote option so far               |
| `currentPerVOSpentVoiceCreditsRootSalt` | A random value                                                   |
| `newResultsRootSalt`                    | A random value                                                   |
| `newPerVOSpentVoiceCreditsRootSalt`     | A random value                                                   |
| `newSpentVoiceCreditSubtotalSalt`       | A random value                                                   |

##### `inputHash`

All inputs to this circuit are private except for `inputHash`. To save gas during verification, the `PollProcessorAndTallyer` contract hashes the following values using SHA256 and uses the hash as the sole element of $ic$:

1. `packedVals`
2. `sbCommitment`
3. `currentTallyCommitment`
4. `newTallyCommitment`

The hash is computed using the `sha256` Solidity function and is then subject to modulo $p$.

##### `packedVals`

`packedVals` is the following values represented as one field element. Consider that a field element is roughly 253 bits. The big-endian bit-representation is as such:

| Bits        | Value             |
| ----------- | ----------------- |
| 1st 53 bits | `0`               |
| 2nd 50 bits | `0`               |
| 3rd 50 bits | `0`               |
| 4th 50 bits | `numSignUps`      |
| 5th 50 bits | `batchStartIndex` |

`numSignUps`, a value provided by the contract, is the number of users who have signed up. This is one less than the number of leaves inserted in the state tree (since the 0th state leaf is a blank state leaf [2.8.1]). `batchStartIndex` is the ballot tree index at which the batch begins.

For instance, if `numSignUps` is 25 and the batch index is `5`, and all other values are 0, the following is the `packedVals` representation in hexadecimal:

`64000000000005`

##### `sbCommitment`

The commitment to `stateRoot`, `ballotRoot`, and `sbSalt`:

$\mathsf{poseidon_3}([\mathsf{stateRoot}, \mathsf{ballotRoot}, \mathsf{sbSalt}])$

Proving preimage of `sbCommitment` is one out of the several steps required to prove that the votes were tallied correctly. By establishing that the coordinator knows `ballotRoot`, the coordinator can (using other parts of the circuit) prove that that they know the preimage of the ballot leaves in the batch being tallied.

##### `currentTallyCommitment` and `newTallyCommitment`

A tally is represented by a _tally commitment_, which is the $\mathsf{poseidon_3}$ hash of:

1. $tc_{r}$: a commitment to the votes per option
   - This is the hash of the Merkle root $r_r$ of the votes and a salt $r_s$, computed as $\mathsf{poseidon_2}([r_r, r_s])$
2. $tc_t$: a commitment to the total spent voice credits
   - This is the hash of the total spent voice credits $t_c$ and a salt $t_s$, computed as $\mathsf{poseidon_2}([t_c, t_s])$
3. $tc_p$: a commitment to the spent voice credits per vote option
   - This is the hash of the Merkle root of the spent voice credits per vote option $p_v$ and a salt $p_s$, computed as $\mathsf{poseidon_2}([p_v, p_s])$

The tally commitment is computed as such:

$\mathsf{poseidon_3}([tc_r, tc_t, tc_p])$

#### Statements that the circuit proves

1. That the coordinator knows the preimage of `sbCommitment` (see above)
2. That the coordinator knows the preimage of `inputHash` (see above)
3. That `batchStartIndex` is less than or equal to `numSignUps`
4. That each ballot in `ballots` is in a member of the ballot tree with the Merkle root `ballotRoot` at indices `batchStartIndex` to `batchStartIndex + (5 ** intStateTreeDepth)`
5. That each set of votes (`votes[i]`) has the Merkle root $blt_r$ whose value equals `ballots[i][1]`
6. That the tally is valid, which is:
   - That the sum of votes per vote option is correct
   - That the sum of voice credits per vote option is correct
   - That the subtotal of the spent voice credits is correct
