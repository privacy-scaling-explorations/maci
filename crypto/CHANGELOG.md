# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.2.0) (2024-02-23)


### Features

* **circuits:** remove zkey-manager in favour of circomkit ([d79e9c0](https://github.com/privacy-scaling-explorations/maci/commit/d79e9c0ee18df27c3bd3e5e49924db21303d1c45))
* update sidebar ([6206a1b](https://github.com/privacy-scaling-explorations/maci/commit/6206a1b8849108d78997e00b01c6e7f11efce124))


### Bug Fixes

* **circuits:** enforce use of stateIndex from message ([510e6ee](https://github.com/privacy-scaling-explorations/maci/commit/510e6ee365958e8c7f72cfca6cea75d15a89d28b))
* **cli:** remove files property from package.json ([5c544c6](https://github.com/privacy-scaling-explorations/maci/commit/5c544c62f071f7e9e2d613fe80c0bfda2a75e202))
* **crypto:** get rid of potential prototype polution ([9b8a97c](https://github.com/privacy-scaling-explorations/maci/commit/9b8a97cc9661e0ee6f535cdcab19b4aa0fa98136))
* **optimisedmt:** update d.ts file formatting and remove any types ([4fe4aea](https://github.com/privacy-scaling-explorations/maci/commit/4fe4aea403ece0418112defe2f9572939ee600cf))
* **publish:** ensure we publish the correct files ([bc42724](https://github.com/privacy-scaling-explorations/maci/commit/bc42724b34cf0c047c5692fbf477ed013a102aee))
* **publishing:** do not publish benchmarks folder ([f2fbc36](https://github.com/privacy-scaling-explorations/maci/commit/f2fbc368a8a9520288b365e6fdf04fd3fee9e685))
* remove trailing chars ([3101a60](https://github.com/privacy-scaling-explorations/maci/commit/3101a6016ebda3385273b47b2de33f5fd9c1221f))


### Code Refactoring

* **crypto:** improve discoverability of the package by further separating classes and functions ([ed85bc5](https://github.com/privacy-scaling-explorations/maci/commit/ed85bc513336ac8e9d3dacbe98fd58fbaed31151))
* **crypto:** modify genPrivKey to generate a random seed vs a babyjubjub compatible value ([0f1e9ba](https://github.com/privacy-scaling-explorations/maci/commit/0f1e9bad81a872e67a09e6912beb48784cc19a4b))
* **crypto:** remove ffjavascript and implement utils functions locally ([0b2986f](https://github.com/privacy-scaling-explorations/maci/commit/0b2986fcaadbfce37ff9fc0007ddeae97573924e)), closes [#458](https://github.com/privacy-scaling-explorations/maci/issues/458)
* fix ESLint issues ([6c0ed97](https://github.com/privacy-scaling-explorations/maci/commit/6c0ed97c0976a81b5e5506699d550ec93a553cb8))
* **optimisedmt:** remove dependency and implement locally ([c7d81e2](https://github.com/privacy-scaling-explorations/maci/commit/c7d81e20aaf6308c7d4e1efc09c497729f6a8f10))
* **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/privacy-scaling-explorations/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))
* **zk-kit-poseidon:** remove old circomlib dependencies in crypto ([0340f79](https://github.com/privacy-scaling-explorations/maci/commit/0340f7960a2214410d8885541ac542419a980a34))


### Miscellaneous

* add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
* add types check ([69f038f](https://github.com/privacy-scaling-explorations/maci/commit/69f038f55e6c740d43b8b5376db999bcf92de845))
* apply prettier ([8b905c0](https://github.com/privacy-scaling-explorations/maci/commit/8b905c0948d4a1f950653c6812067ec98ebfcbc8))
* bundle size optimizations ([18da49c](https://github.com/privacy-scaling-explorations/maci/commit/18da49c791e53350158659df8248d48af8e80f6d))
* **changelog:** add CHANGELOG of v1.1.1 ([f0c315a](https://github.com/privacy-scaling-explorations/maci/commit/f0c315a4c1b86f88839f2dbe4c4b9f59193f7be4))
* **circuits:** refactor and add tests for the circom circuits ([4d6419b](https://github.com/privacy-scaling-explorations/maci/commit/4d6419b4962af6e94929721a3008406b6bc29c1e))
* **cli:** optimize bundle size ([39268b2](https://github.com/privacy-scaling-explorations/maci/commit/39268b2ff8e0d27d062c6d3bc52a63ce8038ec5e))
* **contract:** apply linter for deploy scripts and contracts ([9af9c04](https://github.com/privacy-scaling-explorations/maci/commit/9af9c0497a2491eaf89fbff475cf0f60bc04f59c))
* **coverage:** setup coverage for TS packages ([f4e6964](https://github.com/privacy-scaling-explorations/maci/commit/f4e6964b3e268e4d3f2819b85e6abf3e34bcb10e))
* **crypto:** add type export for path elements ([35866fb](https://github.com/privacy-scaling-explorations/maci/commit/35866fb0f086b18835b74e5ecdb55aaceb3ef8db))
* **crypto:** complete unit tests for the crypto package ([80bd832](https://github.com/privacy-scaling-explorations/maci/commit/80bd832e49613172ef2b3972986f6e85c768c963))
* **dependencies:** update project dependencies and remove redundant ones ([4c5ac27](https://github.com/privacy-scaling-explorations/maci/commit/4c5ac27767492c9867a6e2ab2acd6b10fe132847))
* **deps-dev:** bump @types/node from 18.19.6 to 20.10.8 ([6645120](https://github.com/privacy-scaling-explorations/maci/commit/664512038212d36d40799e8c4787847735bd7d82))
* **deps-dev:** bump @types/node from 20.10.8 to 20.11.0 ([805d253](https://github.com/privacy-scaling-explorations/maci/commit/805d2536a54478c51403362419ecad0b6ab736a7))
* **deps-dev:** bump @types/node from 20.11.0 to 20.11.2 ([45839e8](https://github.com/privacy-scaling-explorations/maci/commit/45839e8c2668ec56ea06221758605f88029ea8a1))
* **deps-dev:** bump @types/node from 20.11.10 to 20.11.16 ([8144919](https://github.com/privacy-scaling-explorations/maci/commit/8144919939f7d9a841eb6fce7182628cedbf8746))
* **deps-dev:** bump @types/node from 20.11.16 to 20.11.17 ([44de5db](https://github.com/privacy-scaling-explorations/maci/commit/44de5db0c25a5fdfd5c13c397f49edb7185bf1f5))
* **deps-dev:** bump @types/node from 20.11.17 to 20.11.19 ([8d86b32](https://github.com/privacy-scaling-explorations/maci/commit/8d86b32ef70b89f4239aad3903fd36937cf6a90f))
* **deps-dev:** bump @types/node from 20.11.2 to 20.11.5 ([7698ede](https://github.com/privacy-scaling-explorations/maci/commit/7698edef2b95bc017e54c1fc0d796ccc9da3de85))
* **deps-dev:** bump @types/node from 20.11.5 to 20.11.10 ([a2c445a](https://github.com/privacy-scaling-explorations/maci/commit/a2c445a295e792e421f6c1537b2b21f8a7648683))
* **deps-dev:** bump lerna from 6.6.2 to 8.0.2 ([4b150ad](https://github.com/privacy-scaling-explorations/maci/commit/4b150ade7c4fbaf88eb0e1f629cec6749377706d))
* **deps-dev:** bump mocha from 10.2.0 to 10.3.0 ([2b76e04](https://github.com/privacy-scaling-explorations/maci/commit/2b76e0445f5da5864a335352f66eac33c070ab29))
* **deps-dev:** bump typescript from 5.2.2 to 5.3.3 ([4ec399d](https://github.com/privacy-scaling-explorations/maci/commit/4ec399dd6e984c12ebd24d0b20c14c1104872500))
* **deps:** bump @zk-kit/poseidon-cipher from 0.1.1 to 0.2.1 ([7fb1d67](https://github.com/privacy-scaling-explorations/maci/commit/7fb1d671d48d5dd364d39eff752ce0f2f9b67d26))
* **deps:** bump ethers from 6.10.0 to 6.11.0 ([815696d](https://github.com/privacy-scaling-explorations/maci/commit/815696de4268c41e466ab6794215807a38906938))
* **deps:** bump ethers from 6.11.0 to 6.11.1 ([a01f434](https://github.com/privacy-scaling-explorations/maci/commit/a01f434451a377447052518236a23ad3c9051d17))
* **deps:** bump ethers from 6.9.2 to 6.10.0 ([dd8b4a0](https://github.com/privacy-scaling-explorations/maci/commit/dd8b4a048c013f28be175cc0db17fe5fc45d5976))
* linter ([42ea4f0](https://github.com/privacy-scaling-explorations/maci/commit/42ea4f0ae8b342f6bd5ca5ac86f1bdd143978324))
* linter unification ([61a8bcd](https://github.com/privacy-scaling-explorations/maci/commit/61a8bcd915fd3e4b4da3c00d40704d892c02f51b))
* rebased with the dev branch ([8165968](https://github.com/privacy-scaling-explorations/maci/commit/8165968fb18aa599a30c2f4ba48553cf65a16980))
* **release:** publish 1.1.2 ([10b3a85](https://github.com/privacy-scaling-explorations/maci/commit/10b3a85cc9b53c0fc1ccdf54221a48ec8d6efe0d))
* remove `gitHead` field from package.json ([d38ba71](https://github.com/privacy-scaling-explorations/maci/commit/d38ba71301469f350b3d80eab5bf94e779dda9cc))
* run prettier ([d09cd0e](https://github.com/privacy-scaling-explorations/maci/commit/d09cd0e01ac747245307ceec5343d9ed30d7a6f0))
* run prettier fix after bumping version ([e1f85a5](https://github.com/privacy-scaling-explorations/maci/commit/e1f85a53bbb72696b6998af5406748fd18df4701))



## [1.1.2](https://github.com/gurrpi/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Code Refactoring

- **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/gurrpi/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/gurrpi/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/gurrpi/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))

## [1.1.1](https://github.com/gurrpi/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **maci:** reverted a fix and fixed test suits ([8300cc5](https://github.com/gurrpi/maci/commit/8300cc548e954a80ab6fb39ab9d559c999e07c10))
- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/gurrpi/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/gurrpi/maci/issues/551) [#552](https://github.com/gurrpi/maci/issues/552)
- **maci:** upgraded snarkjs and other dependencies ([0ce643a](https://github.com/gurrpi/maci/commit/0ce643a18704c1a2d9245e8e85032874a11f004e))
