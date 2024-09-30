# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.3.0...v2.4.0) (2024-09-30)


### Miscellaneous

* **deps-dev:** bump @types/mocha from 10.0.7 to 10.0.8 ([#1827](https://github.com/privacy-scaling-explorations/maci/issues/1827)) ([4deae8b](https://github.com/privacy-scaling-explorations/maci/commit/4deae8bb3a4ea5cf1b4ad16018186a593142adb8))
* **deps:** bump @zk-kit/baby-jubjub from 1.0.1 to 1.0.3 ([#1825](https://github.com/privacy-scaling-explorations/maci/issues/1825)) ([071806d](https://github.com/privacy-scaling-explorations/maci/commit/071806d43e49db9f9c57f36b4ca80aea8afa29d5))



## [2.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.1.0...v2.2.0) (2024-08-19)


### Miscellaneous

* **deps-dev:** bump @types/node from 22.1.0 to 22.2.0 ([ac18985](https://github.com/privacy-scaling-explorations/maci/commit/ac189852bf6abb787736c474ad87927afaa5163c))
* **deps-dev:** bump @types/node from 22.2.0 to 22.4.1 ([#1779](https://github.com/privacy-scaling-explorations/maci/issues/1779)) ([4a929e0](https://github.com/privacy-scaling-explorations/maci/commit/4a929e0b9a5c4de5ac0345e742668a3400798867))
* **deps-dev:** bump mocha from 10.7.0 to 10.7.3 ([6ba908f](https://github.com/privacy-scaling-explorations/maci/commit/6ba908f5f78628aa6afe973b3d71ae54ff08c735))



## [2.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.2.0...v2.0.0) (2024-08-06)


### ⚠ BREAKING CHANGES

* **topup:** No more topups

### Features

* export merge function and modify package version ([#1584](https://github.com/privacy-scaling-explorations/maci/issues/1584)) ([f6ae34a](https://github.com/privacy-scaling-explorations/maci/commit/f6ae34a3f9ea375cd5dac8f0ce8618e33509f8ad))
* **multiple-polls:** allow concurrent polls ([14e89ba](https://github.com/privacy-scaling-explorations/maci/commit/14e89baea1ede9bc9bad79fafb5c362d6a6a81e9))


### Bug Fixes

* do not accept invalid maci keys ([9f9e858](https://github.com/privacy-scaling-explorations/maci/commit/9f9e858755a3e064f854675a678ef2fb18041fab))
* minor type issue for @zk-kit/eddsa-poseidon ([ee81309](https://github.com/privacy-scaling-explorations/maci/commit/ee8130924433a040a2d53b00b654f611b3b3e9c4))
* publish proof onchain ([e813174](https://github.com/privacy-scaling-explorations/maci/commit/e8131741b3fb5059572822c04cb61b1cbae9599d))


### Code Refactoring

* enhance MACI circuits readability  ([#1337](https://github.com/privacy-scaling-explorations/maci/issues/1337)) ([3770a2a](https://github.com/privacy-scaling-explorations/maci/commit/3770a2ab6626c4beffb71e7b2d9dce595e5e9f53))
* **topup:** remove the topup feature ([67711d4](https://github.com/privacy-scaling-explorations/maci/commit/67711d44058831302d4556f12d1972ffacede653))


### Miscellaneous

* bump to 1.2.2 ([e63278f](https://github.com/privacy-scaling-explorations/maci/commit/e63278f71937a1fa908ec8f4be2d43114701c134))
* **contracts:** add typedoc script for contracts package ([43459a0](https://github.com/privacy-scaling-explorations/maci/commit/43459a02301f102e80a709a0a722dd591e8e00ef))
* **crypto:** add unit test for `copy` and `insertSubTree` method  in AccQueue ([#1321](https://github.com/privacy-scaling-explorations/maci/issues/1321)) ([aec05bb](https://github.com/privacy-scaling-explorations/maci/commit/aec05bb3bd99cd351e2e556ca99fddb310c10043))
* **crypto:** minor type fix ([e85f20d](https://github.com/privacy-scaling-explorations/maci/commit/e85f20df139286f37c899a7c76d3b5731ac62648))
* **deps-dev:** bump @types/mocha from 10.0.6 to 10.0.7 ([07c3480](https://github.com/privacy-scaling-explorations/maci/commit/07c3480efc40ad1d3f651b78cd7c3aaeee8d7f8a))
* **deps-dev:** bump @types/node from 20.11.20 to 20.11.24 ([c575eca](https://github.com/privacy-scaling-explorations/maci/commit/c575eca7c54c262764ce794a919f3b1d58d7d8e7))
* **deps-dev:** bump @types/node from 20.11.24 to 20.11.25 ([5eb49f9](https://github.com/privacy-scaling-explorations/maci/commit/5eb49f9090fc6db3a80ad2d63548d93430ff7645))
* **deps-dev:** bump @types/node from 20.11.25 to 20.11.28 ([81bebaa](https://github.com/privacy-scaling-explorations/maci/commit/81bebaa880cbc15b8c8445d412b9fc9d89580e67))
* **deps-dev:** bump @types/node from 20.11.28 to 20.11.30 ([5ef4420](https://github.com/privacy-scaling-explorations/maci/commit/5ef44209d16cd441067fb67201daa61cf968382d))
* **deps-dev:** bump @types/node from 20.11.30 to 20.12.2 ([e7c32d0](https://github.com/privacy-scaling-explorations/maci/commit/e7c32d0ddd506727f229d950239a116961bbe1a0))
* **deps-dev:** bump @types/node from 20.12.10 to 20.12.11 ([3019c66](https://github.com/privacy-scaling-explorations/maci/commit/3019c66eb70e54b376e9464417e073bd98d96b6a))
* **deps-dev:** bump @types/node from 20.12.11 to 20.12.12 ([bd0a0a5](https://github.com/privacy-scaling-explorations/maci/commit/bd0a0a5a1ec685542c2af4f6962186176d5453ba))
* **deps-dev:** bump @types/node from 20.12.2 to 20.12.5 ([588392f](https://github.com/privacy-scaling-explorations/maci/commit/588392f2f773addce0204f236fc26981ead1f7bb))
* **deps-dev:** bump @types/node from 20.12.5 to 20.12.7 ([f1b00de](https://github.com/privacy-scaling-explorations/maci/commit/f1b00deb29788e390dcecd5b1741339f96f06f73))
* **deps-dev:** bump @types/node from 20.12.7 to 20.12.10 ([cf5026a](https://github.com/privacy-scaling-explorations/maci/commit/cf5026a42a41c0078467fb477fdd51a2afb31e1f))
* **deps-dev:** bump @types/node from 20.14.10 to 20.14.11 ([01564c0](https://github.com/privacy-scaling-explorations/maci/commit/01564c0503379ca65ce90ea77fdc5ebcd9ae81c5))
* **deps-dev:** bump @types/node from 20.14.11 to 22.1.0 ([#1732](https://github.com/privacy-scaling-explorations/maci/issues/1732)) ([3c4b9d9](https://github.com/privacy-scaling-explorations/maci/commit/3c4b9d9c9eb7439c4ea9791e4388ff586530be50))
* **deps-dev:** bump @types/node from 20.14.2 to 20.14.8 ([636ac22](https://github.com/privacy-scaling-explorations/maci/commit/636ac22bd29d12e5af7f69c7dd639d0223595992))
* **deps-dev:** bump @types/node from 20.14.8 to 20.14.10 ([add0ce4](https://github.com/privacy-scaling-explorations/maci/commit/add0ce4e406fea4bfe2b839facc6a0a33b3fe3bf))
* **deps-dev:** bump mocha from 10.3.0 to 10.4.0 ([7bf5afe](https://github.com/privacy-scaling-explorations/maci/commit/7bf5afe954bcb6b34dbe7f109c9c7e8d5396f1b2))
* **deps-dev:** bump mocha from 10.4.0 to 10.5.0 ([e5c14cf](https://github.com/privacy-scaling-explorations/maci/commit/e5c14cf01e9b5beb6232e80345121dbb47190fd0))
* **deps-dev:** bump mocha from 10.5.0 to 10.6.0 ([6847bb3](https://github.com/privacy-scaling-explorations/maci/commit/6847bb374893672bf7e809fc80d124e2d874b784))
* **deps-dev:** bump mocha from 10.6.0 to 10.7.0 ([#1687](https://github.com/privacy-scaling-explorations/maci/issues/1687)) ([2cad35b](https://github.com/privacy-scaling-explorations/maci/commit/2cad35bab133af79f77ea9c19098d3561ba06f69))
* **deps-dev:** bump nyc from 15.1.0 to 17.0.0 ([c7f4414](https://github.com/privacy-scaling-explorations/maci/commit/c7f441417d7c7ec8019867801b77e7b5c07c2307))
* **deps-dev:** bump typescript from 5.3.3 to 5.4.2 ([591c767](https://github.com/privacy-scaling-explorations/maci/commit/591c767308f746fbfc32a9f184192912895f080c))
* **deps-dev:** bump typescript from 5.4.2 to 5.4.3 ([a2f5c8a](https://github.com/privacy-scaling-explorations/maci/commit/a2f5c8ac32394fc7672051d5342baf7e6f9567ce))
* **deps-dev:** bump typescript from 5.4.3 to 5.4.4 ([5e047ea](https://github.com/privacy-scaling-explorations/maci/commit/5e047eaa96d508addf34e35764ddaf4deb221593))
* **deps-dev:** bump typescript from 5.4.4 to 5.4.5 ([ea6339d](https://github.com/privacy-scaling-explorations/maci/commit/ea6339da96dda38a931cb6d39615c9267ca45b81))
* **deps-dev:** bump typescript from 5.4.5 to 5.5.2 ([e2b4d45](https://github.com/privacy-scaling-explorations/maci/commit/e2b4d45235c82bba349d959a164442cae90ad97f))
* **deps-dev:** bump typescript from 5.5.2 to 5.5.3 ([c979188](https://github.com/privacy-scaling-explorations/maci/commit/c979188358becfc4b434a2f73331e640ce595846))
* **deps-dev:** bump typescript from 5.5.3 to 5.5.4 ([8ed2e2b](https://github.com/privacy-scaling-explorations/maci/commit/8ed2e2b109a950137dd289aa7d3eca4268079272))
* **deps:** bump @zk-kit/baby-jubjub from 0.1.1 to 0.2.0 ([8335e87](https://github.com/privacy-scaling-explorations/maci/commit/8335e8706920da9a75f5d64f179b41fab8a9286d))
* **deps:** bump @zk-kit/baby-jubjub from 0.2.0 to 0.3.0 ([0cc028a](https://github.com/privacy-scaling-explorations/maci/commit/0cc028aaccbd532268f68f816cc941a30be03532))
* **deps:** bump @zk-kit/baby-jubjub from 0.3.0 to 1.0.1 ([0c7a045](https://github.com/privacy-scaling-explorations/maci/commit/0c7a0452a0ee3e7235cc81f4294e097e7d754dab))
* **deps:** bump @zk-kit/eddsa-poseidon from 0.5.1 to 0.11.0 ([cca4446](https://github.com/privacy-scaling-explorations/maci/commit/cca4446e2baa3404dddcdbdd699ea3738463512f))
* **deps:** bump @zk-kit/eddsa-poseidon from 0.5.1 to 0.6.0 ([8d0704e](https://github.com/privacy-scaling-explorations/maci/commit/8d0704e89745447c68c4c925c919fda19f19f1e4))
* **deps:** bump @zk-kit/eddsa-poseidon from 1.0.1 to 1.0.2 ([f577ee4](https://github.com/privacy-scaling-explorations/maci/commit/f577ee42a286dbeeb06b8ab272f8f815425a0e48))
* **deps:** bump @zk-kit/poseidon-cipher from 0.2.1 to 0.3.0 ([a4f023e](https://github.com/privacy-scaling-explorations/maci/commit/a4f023eaa31c0ec822288f76cd5a7b712b09c3b6))
* **deps:** bump ethers from 6.11.1 to 6.12.0 ([9db5a93](https://github.com/privacy-scaling-explorations/maci/commit/9db5a93d32396d80b76e2d20d1af529e6a97292a))
* **deps:** bump ethers from 6.12.0 to 6.12.1 ([16b4615](https://github.com/privacy-scaling-explorations/maci/commit/16b46159a132abb82b4659c424a065bb418bd31e))
* **deps:** bump ethers from 6.13.0 to 6.13.1 ([b32694d](https://github.com/privacy-scaling-explorations/maci/commit/b32694da7aa60e0215daa56d2b64ed5e5f8d9d45))
* **deps:** bump ethers from 6.13.1 to 6.13.2 ([#1709](https://github.com/privacy-scaling-explorations/maci/issues/1709)) ([c9de72e](https://github.com/privacy-scaling-explorations/maci/commit/c9de72eead282027cc9dcab0edd9170a0fbe5a2e))
* **release:** publish 1.2.1 ([93564f8](https://github.com/privacy-scaling-explorations/maci/commit/93564f8a98baa0fee65db16e2e40209d9ac1b3ae))
* **release:** publish 2.0.0 ([04e647d](https://github.com/privacy-scaling-explorations/maci/commit/04e647d231df34952569ad6ff802e0b2333eb658))
* update zk-kit compatible packages ([928c032](https://github.com/privacy-scaling-explorations/maci/commit/928c032b83b6cbea6a0fa137171c6b9c7edc591d))



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
