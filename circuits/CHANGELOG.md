# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.2](https://github.com/gurrpi/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Code Refactoring

- **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/gurrpi/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/gurrpi/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/gurrpi/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))
- **maci:** added README for the circuit package and fixed typo in contract's README ([4d0f74b](https://github.com/gurrpi/maci/commit/4d0f74b8480cd2d20e835d43b33c2aab6578d194))
- **maci:** updated docs after review ([fd0da34](https://github.com/gurrpi/maci/commit/fd0da346406a5c2c6648bbff1b081863039bcf2b)), closes [#531](https://github.com/gurrpi/maci/issues/531) [#556](https://github.com/gurrpi/maci/issues/556)

## [1.1.1](https://github.com/gurrpi/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **core/ts/macistate.ts:** fix nothing_up_to_my_sleeve bug in MaciState.ts as well as unit tests ([3d2b21f](https://github.com/gurrpi/maci/commit/3d2b21f185c285542b92512a871b0886a3fedc83))
- **float.circom:** add a\*b overflow check ([c9a24ba](https://github.com/gurrpi/maci/commit/c9a24bac757568d1d46ec0d876d67bdc82f770ba))
- **float.circom:** rewrite float.circom ([efd4617](https://github.com/gurrpi/maci/commit/efd4617724e956d2566062c6fe882e1d45cba7c4))
- **maci:** reverted a fix and fixed test suits ([8300cc5](https://github.com/gurrpi/maci/commit/8300cc548e954a80ab6fb39ab9d559c999e07c10))
- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/gurrpi/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/gurrpi/maci/issues/551) [#552](https://github.com/gurrpi/maci/issues/552)
- **maci:** upgraded snarkjs and other dependencies ([0ce643a](https://github.com/gurrpi/maci/commit/0ce643a18704c1a2d9245e8e85032874a11f004e))
- **processmessages.circom:** data are not fully verified during state update ([6df6a40](https://github.com/gurrpi/maci/commit/6df6a4054da926b07f35c5befab4f1f8af33dcc6))
- **topupcredit.sol, subsidy.circom:** add comments for upper bound of constants ([c8eb37a](https://github.com/gurrpi/maci/commit/c8eb37ad593ee671652f11458909df2a95db3581))

### Reverts

- **circuits:** revert snarkjs upgrade ([b045893](https://github.com/gurrpi/maci/commit/b045893e18f105ce2019ab9d010aa57ef896adc8))
