# maci-crypto

[![NPM Package][crypto-npm-badge]][crypto-npm-link]
[![Actions Status][crypto-actions-badge]][crypto-actions-link]

This module implements abstractions over cryptographic functions which MACI
employs.

## AccQueue

AccQueue is an implementation of an Accumulator Queue. This is used to manage a queue of elements in merkle-tree like structure. This TypeScript class conforms with the smart contract impemented in _maci-contracts_ - AccQueue.sol.

The main tree is divided into subtrees to allow for easier management. Each of the subtrees has its own root and leaves, with the depth being defined by the _subDepth_ property of the AccQueue class. When a new leaf is "enqued", this is actually added to the current subtree. If this is full, we calculate the root of the subtree and store it, while the new leaf is added to the next subtree.

The use of subtrees allows to more efficiently fill the tree, where instead of computing the root each time a new leaf is added, we only need to compute the root of the subtrees.

## Crypto

Various cryptographic utilities, which can be used to hash values with the Poseidon hash function, and to generate and manage points on the Baby jubjub curve.

## Test

To run the tests, execute the following command:

```bash
pnpm run test
```

To run tests on the individual files, you can execute the following commands:

```bash
pnpm run test-crypto
pnpm run test-accQueue
```

For more details about testing please refer to the [tests documentation](https://maci.pse.dev/docs/testing).

[crypto-npm-badge]: https://img.shields.io/npm/v/maci-crypto.svg
[crypto-npm-link]: https://www.npmjs.com/package/maci-crypto
[crypto-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/crypto-build.yml/badge.svg
[crypto-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acrypto
