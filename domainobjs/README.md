# maci-domainobjs

[![NPM Package][domainobjs-npm-badge]][domainobjs-npm-link]
[![Actions Status][domainobjs-actions-badge]][domainobjs-actions-link]

This module implements domain objects. A domain object is:

> a logical container of purely domain information, usually representing a
> logical entity in the problem domain space

https://wiki.c2.com/?DomainObject

In effect, domain objects are representations of objects shared between other
modules in this codebase. They also encapsulate helper functions which make it
easy to use them with said modules.

## `PrivKey`

A private key. Provides helper functions to do with passing it into a circuit
in the right format, serialisation and deserialisation, and deep copying.

This is a MACI private key, which is not to be confused with an Ethereum private key.
A serialized MACI private key is prefixed by 'macisk.'
A raw MACI private key can be thought as a point on the baby jubjub curve.

## `PubKey`

A public key. Provides helper functions to do with passing it into a contract
function or circuit in the right format, hashing, serialisation and
deserialisation, and deep copying.

This is a MACI public key, which is not to be confused with an Ethereum public key. A serialized MACI public key is prefixed by 'macipk.' A raw MACI public key can be thought as a pair of BigIntegers (x, y) representing a point on the baby jubjub curve.

## `Keypair`

Encapsulates a `PrivKey` and `PubKey`. Also provides `genEcdhSharedKey` which
generates an ECDH shared key from a public key and a private key.

This is a MACI keypair, which is not to be confused with an Ethereum keypair.
A MACI keypair is comprised of a MACI public key and a MACI private key

## `Command`

The `Command` domain object represents a request by a user to cast a vote
and/or change one's public key.

## `Message`

The `Message` domain object is an encrypted `Command` and signature. That is, a
`Message` is a `Ciphertext` (defined in [`maci-crypto`](../crypto/README.md))
which is the encrypted `Command` and its `Signature` (also defined in
`maci-crypto`). In other terms:

```
Message = Encrypt([Command, Signature], Key)
```

## `Ballot`

Represents a User's votes in a Poll, as well as their next valid nonce.

## `StateLeaf`

Represents a leaf in the state tree, which maps public keys to voice credit
balances, as well as the timestamp at which it was inserted.

## `VerifyingKey`

Encapsulates a Groth16 zk-SNARK verifying key.

## `Proof`

Encapsulates a Groth16 zk-SNARK proof.

[domainobjs-npm-badge]: https://img.shields.io/npm/v/maci-domainobjs.svg
[domainobjs-npm-link]: https://www.npmjs.com/package/maci-domainobjs
[domainobjs-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/domainobjs-build.yml/badge.svg
[domainobjs-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Adomainobjs
