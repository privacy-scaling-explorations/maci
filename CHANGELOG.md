# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.2](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Features

- **contracts:** made `nextPollId` public to support third-party apps more easily ([c5c6bdb](https://github.com/privacy-scaling-explorations/maci/commit/c5c6bdb3db3e4ce25d0de642e75278becc405d61))

### Bug Fixes

- **server:** expanded regex to include capital case values ([ed5915e](https://github.com/privacy-scaling-explorations/maci/commit/ed5915eb524b92299b3a52f2de1000161a8f1a32))
- **server:** fix arbitrary parameters being injected into cli commands ([295f73f](https://github.com/privacy-scaling-explorations/maci/commit/295f73fe6744e924e677726987bb07b8c4761852))

### Performance Improvements

- **subsidy.circom:** decrease the number of batches by around half for subsidy calculations ([37ff17e](https://github.com/privacy-scaling-explorations/maci/commit/37ff17e6569a652fe4ad7310221c1a4e7b2bff75))

### Code Refactoring

- **contracts:** refactoring deployment scripts ([eba33cf](https://github.com/privacy-scaling-explorations/maci/commit/eba33cfc822208d9a6ca1ad4e9d3442a8c613c4d)), closes [#555](https://github.com/privacy-scaling-explorations/maci/issues/555)
- **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/privacy-scaling-explorations/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/privacy-scaling-explorations/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))
- fix description of circuit parameter ([26b08eb](https://github.com/privacy-scaling-explorations/maci/commit/26b08eba98394f97f054163a6d4d91bbd0595f44))
- **maci:** added audit report and amended Contract's README ([0c6d28b](https://github.com/privacy-scaling-explorations/maci/commit/0c6d28b66091609a3cf62b1a0faa08e87b5c82aa))
- **maci:** added README for the circuit package and fixed typo in contract's README ([4d0f74b](https://github.com/privacy-scaling-explorations/maci/commit/4d0f74b8480cd2d20e835d43b33c2aab6578d194))
- **maci:** amended and added new sections in the docs ([d9780fa](https://github.com/privacy-scaling-explorations/maci/commit/d9780fabed10e9d97bb72cf6d118e061b83157b9)), closes [#531](https://github.com/privacy-scaling-explorations/maci/issues/531)
- **maci:** updated docs after review ([fd0da34](https://github.com/privacy-scaling-explorations/maci/commit/fd0da346406a5c2c6648bbff1b081863039bcf2b)), closes [#531](https://github.com/privacy-scaling-explorations/maci/issues/531) [#556](https://github.com/privacy-scaling-explorations/maci/issues/556)
- set format for CHANGELOG ([9787132](https://github.com/privacy-scaling-explorations/maci/commit/978713227dbe2514c45d4c4b31053d58d1bcb521))
- update README.md to reflect current status ([14ac799](https://github.com/privacy-scaling-explorations/maci/commit/14ac7994aa7148cff9fdb9b9cd36ecac93290cda))

## [1.1.1](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **core/ts/macistate.ts:** fix nothing_up_to_my_sleeve bug in MaciState.ts as well as unit tests ([3d2b21f](https://github.com/privacy-scaling-explorations/maci/commit/3d2b21f185c285542b92512a871b0886a3fedc83))
- **fix insert placeholder leaf bug:** fix issue related to first msg leaf ([b4b9da1](https://github.com/privacy-scaling-explorations/maci/commit/b4b9da1aff830daad2c70f530749df50cea9334f))
- **float.circom:** add a\*b overflow check ([c9a24ba](https://github.com/privacy-scaling-explorations/maci/commit/c9a24bac757568d1d46ec0d876d67bdc82f770ba))
- **float.circom:** rewrite float.circom ([efd4617](https://github.com/privacy-scaling-explorations/maci/commit/efd4617724e956d2566062c6fe882e1d45cba7c4))
- **integrationtests:** add missing error handling in integration test harness ([403787e](https://github.com/privacy-scaling-explorations/maci/commit/403787e197f5188270d9ed0da52abbba9d0db7d1))
- **maci.sol:** fix "inconsistent restriction on voice credit upper bound" ([7a8c5c1](https://github.com/privacy-scaling-explorations/maci/commit/7a8c5c190793032ad10370da9da0d2256abdd999))
- **maci:** amended the `signUp` function to reflect the checks-effects-interaction pattern ([d62c7c7](https://github.com/privacy-scaling-explorations/maci/commit/d62c7c710ba126ced713b8d32190408dbf5fa29f)), closes [#503](https://github.com/privacy-scaling-explorations/maci/issues/503)
- **maci:** final fix to the tests ([51e84f8](https://github.com/privacy-scaling-explorations/maci/commit/51e84f81b13cd6fd56dbbb2887f541f273cd1313))
- **maci:** implemented fixes for several audit issues ([6f1fa85](https://github.com/privacy-scaling-explorations/maci/commit/6f1fa85299ebbc8fe10e30691afe8f036b8c68d1)), closes [#503](https://github.com/privacy-scaling-explorations/maci/issues/503) [#504](https://github.com/privacy-scaling-explorations/maci/issues/504) [#505](https://github.com/privacy-scaling-explorations/maci/issues/505) [#508](https://github.com/privacy-scaling-explorations/maci/issues/508) [#510](https://github.com/privacy-scaling-explorations/maci/issues/510)
- **maci:** removed unneded max fee calculation ([14ee2a5](https://github.com/privacy-scaling-explorations/maci/commit/14ee2a550c0b0dda5bf21b65ee70a38b04ece924))
- **maci:** reverted a fix and fixed test suits ([8300cc5](https://github.com/privacy-scaling-explorations/maci/commit/8300cc548e954a80ab6fb39ab9d559c999e07c10))
- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/privacy-scaling-explorations/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/privacy-scaling-explorations/maci/issues/551) [#552](https://github.com/privacy-scaling-explorations/maci/issues/552)
- **maci:** upgraded snarkjs and other dependencies ([0ce643a](https://github.com/privacy-scaling-explorations/maci/commit/0ce643a18704c1a2d9245e8e85032874a11f004e))
- **poll.sol,maci.sol:** protect messageAq by nothing up my sleeve hash ([04f21b3](https://github.com/privacy-scaling-explorations/maci/commit/04f21b358b9efc17cffb8732c96f338ec56462d3))
- **poll:** amended `mergeMaciStateAq` to directly store the new root to state ([76c991a](https://github.com/privacy-scaling-explorations/maci/commit/76c991a2c4f580c353f526375daf138fbb66ec92))
- **processmessages.circom:** data are not fully verified during state update ([6df6a40](https://github.com/privacy-scaling-explorations/maci/commit/6df6a4054da926b07f35c5befab4f1f8af33dcc6))
- **topupcredit.sol, subsidy.circom:** add comments for upper bound of constants ([c8eb37a](https://github.com/privacy-scaling-explorations/maci/commit/c8eb37ad593ee671652f11458909df2a95db3581))
- **topupcredit.sol:** add onlyOnwer modifier ([ee0c8a6](https://github.com/privacy-scaling-explorations/maci/commit/ee0c8a6a654d136f95180e6728c9cec283c1659b))

### Reverts

- **circuits:** revert snarkjs upgrade ([b045893](https://github.com/privacy-scaling-explorations/maci/commit/b045893e18f105ce2019ab9d010aa57ef896adc8))
- **dependencies:** revert eslint upgrade ([a70804e](https://github.com/privacy-scaling-explorations/maci/commit/a70804e98bf9f364cc1691e65b5ac677cdb151c1))
- **pollyprocessandtallyer:** revert changes ([382e435](https://github.com/privacy-scaling-explorations/maci/commit/382e43588357141fdc01928caa0310a2b33e2257))

# [1.1.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.0.3...v1.1.0) (2022-06-27)

### Bug Fixes

- **fix bigint issue for github check:** fix the check fail for github ([a155105](https://github.com/privacy-scaling-explorations/maci/commit/a15510508c729251616c3b2d2f981c9f50b1e0f8))
- process messages and handle no-ops in maciState object ([805ef1d](https://github.com/privacy-scaling-explorations/maci/commit/805ef1ded9f525d979f45a51cf2a643ee5e6c71b))

### Features

- **topup feature:** add topup feature for maci ([48763f8](https://github.com/privacy-scaling-explorations/maci/commit/48763f83be3e92811d75fa3c67f7851bdaad09b2))
- **subsidy calculation** ([9a1b571](https://github.com/privacy-scaling-explorations/maci/commit/9a1b571915d20d26720c30bb1a7d93e7ce3651e3))

### BREAKING CHANGES

- **topup feature:** the circuit will now process vote and topup type messages; other components also
  modified accordingly

## [1.0.3](https://github.com/privacy-scaling-explorations/maci/compare/v1.0.2...v1.0.3) (2021-11-13)

## [1.0.2](https://github.com/privacy-scaling-explorations/maci/compare/v1.0.1...v1.0.2) (2021-10-12)

## [1.0.1](https://github.com/privacy-scaling-explorations/maci/compare/v1.0.0...v1.0.1) (2021-10-12)

# [1.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.2...v1.0.0) (2021-10-12)

## [0.3.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.1...v0.3.2) (2020-10-02)

## [0.3.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.0...v0.3.1) (2020-10-02)

# [0.3.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.9...v0.3.0) (2020-10-02)

### Reverts

- Revert "publish a message during signup (wip)" ([e31faca](https://github.com/privacy-scaling-explorations/maci/commit/e31facacc24aa2014109426585f11ebe078bab92))
- Revert "wip" ([7c4a807](https://github.com/privacy-scaling-explorations/maci/commit/7c4a807da5f7467973823203f0a6cb2d1ca0c129))

## [0.2.9](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.8...v0.2.9) (2020-09-25)

## [0.2.8](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.7...v0.2.8) (2020-09-24)

## [0.2.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.6...v0.2.7) (2020-09-18)

## [0.2.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.5...v0.2.6) (2020-09-16)

## [0.2.5](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.4...v0.2.5) (2020-09-16)

## [0.2.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.3...v0.2.4) (2020-09-16)

## [0.2.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.2...v0.2.3) (2020-09-14)

## [0.2.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.2.1...v0.2.2) (2020-09-11)

## [0.2.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.12...v0.2.1) (2020-09-06)

## [0.1.12](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.11...v0.1.12) (2020-08-29)

## [0.1.11](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.10...v0.1.11) (2020-08-14)

## [0.1.10](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.9...v0.1.10) (2020-08-14)

## [0.1.9](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.8...v0.1.9) (2020-08-13)

## [0.1.8](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.7...v0.1.8) (2020-07-30)

## [0.1.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.6...v0.1.7) (2020-07-30)

## [0.1.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.5...v0.1.6) (2020-07-30)

## [0.1.5](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.4...v0.1.5) (2020-07-29)

## [0.1.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.3...v0.1.4) (2020-07-29)

## [0.1.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.2...v0.1.3) (2020-07-27)

## [0.1.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.1...v0.1.2) (2020-07-20)

## [0.1.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.1.0...v0.1.1) (2020-07-17)

# 0.1.0 (2020-07-13)
