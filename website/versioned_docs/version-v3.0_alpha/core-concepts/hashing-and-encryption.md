---
title: Hashing and Encryption
description: A short introduction of the main primitives used by MACI
sidebar_label: Hashing and Encryption
sidebar_position: 2
---

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

The implementation can be found [here](https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/poseidon-cipher).

### Shared Key Generation

The ECDH algorithm is used to generate a shared key, which is then used to encrypt each message. This allows to create messages which are only decryptable by the coordinator and the person sending the message.

In more details:

- The coordinator's public key $cPk$ is known to all. Their private key $cSk$ is secret.

- When the user publishes a message (i.e. casts a vote), they generate an ephemeral keypair with private key $eSk$ and public key $ePk$.

- The user generates the shared key $k$ using the coordinator's public key $cPk$ and the user's ephemeral private key $eSk$.

- The user encrypts the command and signature with $k$ to form a message.

- The user sends their ephemeral public key $ePk$ along with the ciphertext. The coordinator can recover the same shared key using their private key $cSk$ and the given ephemeral public key $ePk$.
