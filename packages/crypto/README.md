# maci-crypto

[![NPM Package][crypto-npm-badge]][crypto-npm-link]
[![Actions Status][crypto-actions-badge]][crypto-actions-link]

This module implements abstractions over cryptographic functions which MACI
employs, such as the Poseidon hash function and the Baby Jubjub curve.

## Test

To run the tests, execute the following command:

```bash
pnpm run test
```

To run tests on the individual files, you can execute the following commands:

```bash
pnpm run test:crypto
```

For more details about testing please refer to the [tests documentation](https://maci.pse.dev/docs/testing).

[crypto-npm-badge]: https://img.shields.io/npm/v/maci-crypto.svg
[crypto-npm-link]: https://www.npmjs.com/package/maci-crypto
[crypto-actions-badge]: https://github.com/privacy-scaling-explorations/maci/actions/workflows/crypto-build.yml/badge.svg
[crypto-actions-link]: https://github.com/privacy-scaling-explorations/maci/actions?query=workflow%3Acrypto
