---
title: MACI Keys
description: A short introduction of MACI's keys
sidebar_label: Maci Keys
sidebar_position: 1
---

## Elliptic Curves

MACI uses the Baby Jubjub Elliptic [Curve](https://iden3-docs.readthedocs.io/en/latest/_downloads/33717d75ab84e11313cc0d8a090b636f/Baby-Jubjub.pdf). The `p` scalar field of choosing is:

$p=21888242871839275222246405745257275088548364400416034343698204186575808495617$

with generator:

$995203441582195749578291179787384436505546430278305826713579947235728471134$
$5472060717959818805561601436314318772137091100104008585924551046643952123905$

and within the finite field with modulo $p$.

## Key Pairs

MACI uses Node.js's `crypto.randomBytes(32)` function to generate a cryptographically strong pseudorandom 32-byte value. This value is the seed used to generate a maci public key. A public key is a point on the Baby Jubjub [curve](https://iden3-docs.readthedocs.io/en/latest/_downloads/33717d75ab84e11313cc0d8a090b636f/Baby-Jubjub.pdf), which is deterministically derived from a private key `s`.

A public key is generated with the following function from [zk-kit](https://github.com/privacy-scaling-explorations/zk-kit/blob/main/packages/eddsa-poseidon/src/eddsa-poseidon.ts#L75):

```ts
export function derivePublicKey(privateKey: Buffer | Uint8Array | string): Point<bigint> {
  const s = deriveSecretScalar(privateKey);

  return mulPointEscalar(Base8, s);
}
```

In more details, the function does the following:

1. Derive a scalar value from the seed (private key).

```ts
export function deriveSecretScalar(privateKey: Buffer | Uint8Array | string): bigint {
  // Convert the private key to buffer.
  privateKey = checkPrivateKey(privateKey);

  let hash = blake(privateKey);

  hash = hash.slice(0, 32);
  hash = pruneBuffer(hash);

  return scalar.shiftRight(leBufferToBigInt(hash), BigInt(3)) % subOrder;
}
```

2. Perform a scalar multiplication of the base point `Base8` with the scalar value `s`.

Now we have a public key, which is a point on the Baby Jubjub curve. In TypeScript, this is an array of two bigint values, representing the x and y coordinates of the point.

## Serialization

In order to easily store and transmit maci keys, these are serialized to a string.

A public key if first packed, then converted to a hex string. This string is then prefixed with `macipk.`.

For private keys (well the seed really), the value is converted to a hex string, padded to be of 64 characters, and prefixed with `macisk.`.

For instance, given a seed of `27514007781052885036162808648019893362811628316940391612960868886926452498447`, we have a public key of:

```json
{
  "x": 7849177681360672621257726786949079749092629607596162839195961972852243798387,
  "y": 6476520406570543146511284735472598280851241629796745672331248892171436291770
}
```

Serialized, these will look like **macipk.0e5194a54562ea4d440ac6a0049a41d4b600e3eb0bf54486e7a5f7e27521f6ba** and **macisk.3cd46064ea59936f82efb384059dd4f5b6b8e5c7546614caf7c1c3be0daea00f**.
