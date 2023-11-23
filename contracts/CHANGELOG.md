# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.2](https://github.com/gurrpi/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Features

- **contracts:** made `nextPollId` public to support third-party apps more easily ([c5c6bdb](https://github.com/gurrpi/maci/commit/c5c6bdb3db3e4ce25d0de642e75278becc405d61))

### Code Refactoring

- **contracts:** refactoring deployment scripts ([eba33cf](https://github.com/gurrpi/maci/commit/eba33cfc822208d9a6ca1ad4e9d3442a8c613c4d)), closes [#555](https://github.com/gurrpi/maci/issues/555)
- **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/gurrpi/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/gurrpi/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/gurrpi/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))
- **maci:** added audit report and amended Contract's README ([0c6d28b](https://github.com/gurrpi/maci/commit/0c6d28b66091609a3cf62b1a0faa08e87b5c82aa))
- **maci:** added README for the circuit package and fixed typo in contract's README ([4d0f74b](https://github.com/gurrpi/maci/commit/4d0f74b8480cd2d20e835d43b33c2aab6578d194))
- **maci:** updated docs after review ([fd0da34](https://github.com/gurrpi/maci/commit/fd0da346406a5c2c6648bbff1b081863039bcf2b)), closes [#531](https://github.com/gurrpi/maci/issues/531) [#556](https://github.com/gurrpi/maci/issues/556)

## [1.1.1](https://github.com/gurrpi/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **fix insert placeholder leaf bug:** fix issue related to first msg leaf ([b4b9da1](https://github.com/gurrpi/maci/commit/b4b9da1aff830daad2c70f530749df50cea9334f))
- **maci.sol:** fix "inconsistent restriction on voice credit upper bound" ([7a8c5c1](https://github.com/gurrpi/maci/commit/7a8c5c190793032ad10370da9da0d2256abdd999))
- **maci:** amended the `signUp` function to reflect the checks-effects-interaction pattern ([d62c7c7](https://github.com/gurrpi/maci/commit/d62c7c710ba126ced713b8d32190408dbf5fa29f)), closes [#503](https://github.com/gurrpi/maci/issues/503)
- **maci:** final fix to the tests ([51e84f8](https://github.com/gurrpi/maci/commit/51e84f81b13cd6fd56dbbb2887f541f273cd1313))
- **maci:** implemented fixes for several audit issues ([6f1fa85](https://github.com/gurrpi/maci/commit/6f1fa85299ebbc8fe10e30691afe8f036b8c68d1)), closes [#503](https://github.com/gurrpi/maci/issues/503) [#504](https://github.com/gurrpi/maci/issues/504) [#505](https://github.com/gurrpi/maci/issues/505) [#508](https://github.com/gurrpi/maci/issues/508) [#510](https://github.com/gurrpi/maci/issues/510)
- **maci:** removed unneded max fee calculation ([14ee2a5](https://github.com/gurrpi/maci/commit/14ee2a550c0b0dda5bf21b65ee70a38b04ece924))
- **maci:** reverted a fix and fixed test suits ([8300cc5](https://github.com/gurrpi/maci/commit/8300cc548e954a80ab6fb39ab9d559c999e07c10))
- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/gurrpi/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/gurrpi/maci/issues/551) [#552](https://github.com/gurrpi/maci/issues/552)
- **maci:** upgraded snarkjs and other dependencies ([0ce643a](https://github.com/gurrpi/maci/commit/0ce643a18704c1a2d9245e8e85032874a11f004e))
- **poll.sol,maci.sol:** protect messageAq by nothing up my sleeve hash ([04f21b3](https://github.com/gurrpi/maci/commit/04f21b358b9efc17cffb8732c96f338ec56462d3))
- **poll:** amended `mergeMaciStateAq` to directly store the new root to state ([76c991a](https://github.com/gurrpi/maci/commit/76c991a2c4f580c353f526375daf138fbb66ec92))
- **topupcredit.sol:** add onlyOnwer modifier ([ee0c8a6](https://github.com/gurrpi/maci/commit/ee0c8a6a654d136f95180e6728c9cec283c1659b))

### Reverts

- **pollyprocessandtallyer:** revert changes ([382e435](https://github.com/gurrpi/maci/commit/382e43588357141fdc01928caa0310a2b33e2257))
