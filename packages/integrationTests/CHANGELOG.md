# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.3.0...v2.4.0) (2024-09-30)


### Miscellaneous

* **deps-dev:** bump @types/mocha from 10.0.7 to 10.0.8 ([#1827](https://github.com/privacy-scaling-explorations/maci/issues/1827)) ([4deae8b](https://github.com/privacy-scaling-explorations/maci/commit/4deae8bb3a4ea5cf1b4ad16018186a593142adb8))



## [2.3.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.1...v2.3.0) (2024-09-05)

**Note:** Version bump only for package maci-integrationtests





## [2.2.1](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.0...v2.2.1) (2024-08-19)

**Note:** Version bump only for package maci-integrationtests





## [2.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.1.0...v2.2.0) (2024-08-19)


### Miscellaneous

* **deps-dev:** bump @types/node from 22.1.0 to 22.2.0 ([ac18985](https://github.com/privacy-scaling-explorations/maci/commit/ac189852bf6abb787736c474ad87927afaa5163c))
* **deps-dev:** bump @types/node from 22.2.0 to 22.4.1 ([#1779](https://github.com/privacy-scaling-explorations/maci/issues/1779)) ([4a929e0](https://github.com/privacy-scaling-explorations/maci/commit/4a929e0b9a5c4de5ac0345e742668a3400798867))
* **deps-dev:** bump mocha from 10.7.0 to 10.7.3 ([6ba908f](https://github.com/privacy-scaling-explorations/maci/commit/6ba908f5f78628aa6afe973b3d71ae54ff08c735))
* **deps:** bump hardhat from 2.22.7 to 2.22.8 ([#1755](https://github.com/privacy-scaling-explorations/maci/issues/1755)) ([92b30af](https://github.com/privacy-scaling-explorations/maci/commit/92b30af1c18f8261235c26f61de6004287107351))



## [2.1.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.0.0...v2.1.0) (2024-08-07)

**Note:** Version bump only for package maci-integrationtests





## [2.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.2.0...v2.0.0) (2024-08-06)


### ⚠ BREAKING CHANGES

* **topup:** No more topups

### Features

* **contracts:** added message processor and tally addresses to the maci contract ([#1715](https://github.com/privacy-scaling-explorations/maci/issues/1715)) ([801b774](https://github.com/privacy-scaling-explorations/maci/commit/801b7747852a63885ed8d6ae43d81260dab9c76f))
* **contracts:** tally qv and non-qv optimisations ([b0b7b38](https://github.com/privacy-scaling-explorations/maci/commit/b0b7b38bf008e8a542b550c75ada40ac21854944))
* export merge function and modify package version ([#1584](https://github.com/privacy-scaling-explorations/maci/issues/1584)) ([f6ae34a](https://github.com/privacy-scaling-explorations/maci/commit/f6ae34a3f9ea375cd5dac8f0ce8618e33509f8ad))
* support deployment without hardhat ([dab5e2b](https://github.com/privacy-scaling-explorations/maci/commit/dab5e2b0c05f00d4ede53b67ea118d05a952c5c3))
* use mode instead of flag for voting option ([34421de](https://github.com/privacy-scaling-explorations/maci/commit/34421deb4da54da732cd34d868e76e04a5eea501))


### Bug Fixes

* **build:** add missing typescript dependency for integration tests package ([4f34d4e](https://github.com/privacy-scaling-explorations/maci/commit/4f34d4e6d8bb587fb1ec4c861a583055d5afa2e0))


### Code Refactoring

* **maci:** remove subsidy feature to simplify further protocol improvements ([52fc7c5](https://github.com/privacy-scaling-explorations/maci/commit/52fc7c5b8f2d389868bca6171ffd15a94b1d1659))
* **topup:** remove the topup feature ([67711d4](https://github.com/privacy-scaling-explorations/maci/commit/67711d44058831302d4556f12d1972ffacede653))


### Miscellaneous

* add qv and non-qv key setup during deploy ([29f9e17](https://github.com/privacy-scaling-explorations/maci/commit/29f9e173e788105b420b2ec0ea4f40d423b27685))
* bump to 1.2.2 ([e63278f](https://github.com/privacy-scaling-explorations/maci/commit/e63278f71937a1fa908ec8f4be2d43114701c134))
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
* **deps-dev:** bump chai-as-promised from 7.1.1 to 7.1.2 ([6930a1c](https://github.com/privacy-scaling-explorations/maci/commit/6930a1c6590f0b8d9971ac38bf06d44f90b88760))
* **deps-dev:** bump mocha from 10.3.0 to 10.4.0 ([7bf5afe](https://github.com/privacy-scaling-explorations/maci/commit/7bf5afe954bcb6b34dbe7f109c9c7e8d5396f1b2))
* **deps-dev:** bump mocha from 10.4.0 to 10.5.0 ([e5c14cf](https://github.com/privacy-scaling-explorations/maci/commit/e5c14cf01e9b5beb6232e80345121dbb47190fd0))
* **deps-dev:** bump mocha from 10.5.0 to 10.6.0 ([6847bb3](https://github.com/privacy-scaling-explorations/maci/commit/6847bb374893672bf7e809fc80d124e2d874b784))
* **deps-dev:** bump mocha from 10.6.0 to 10.7.0 ([#1687](https://github.com/privacy-scaling-explorations/maci/issues/1687)) ([2cad35b](https://github.com/privacy-scaling-explorations/maci/commit/2cad35bab133af79f77ea9c19098d3561ba06f69))
* **deps-dev:** bump typescript from 5.4.3 to 5.4.4 ([5e047ea](https://github.com/privacy-scaling-explorations/maci/commit/5e047eaa96d508addf34e35764ddaf4deb221593))
* **deps-dev:** bump typescript from 5.4.4 to 5.4.5 ([ea6339d](https://github.com/privacy-scaling-explorations/maci/commit/ea6339da96dda38a931cb6d39615c9267ca45b81))
* **deps-dev:** bump typescript from 5.4.5 to 5.5.2 ([e2b4d45](https://github.com/privacy-scaling-explorations/maci/commit/e2b4d45235c82bba349d959a164442cae90ad97f))
* **deps-dev:** bump typescript from 5.5.2 to 5.5.3 ([c979188](https://github.com/privacy-scaling-explorations/maci/commit/c979188358becfc4b434a2f73331e640ce595846))
* **deps-dev:** bump typescript from 5.5.3 to 5.5.4 ([8ed2e2b](https://github.com/privacy-scaling-explorations/maci/commit/8ed2e2b109a950137dd289aa7d3eca4268079272))
* **deps:** bump @nomicfoundation/hardhat-toolbox from 4.0.0 to 5.0.0 ([c403cb4](https://github.com/privacy-scaling-explorations/maci/commit/c403cb4b9c27e15958493a6d19555161ecef743c))
* **deps:** bump ethers from 6.11.1 to 6.12.0 ([9db5a93](https://github.com/privacy-scaling-explorations/maci/commit/9db5a93d32396d80b76e2d20d1af529e6a97292a))
* **deps:** bump ethers from 6.12.0 to 6.12.1 ([16b4615](https://github.com/privacy-scaling-explorations/maci/commit/16b46159a132abb82b4659c424a065bb418bd31e))
* **deps:** bump ethers from 6.13.0 to 6.13.1 ([b32694d](https://github.com/privacy-scaling-explorations/maci/commit/b32694da7aa60e0215daa56d2b64ed5e5f8d9d45))
* **deps:** bump ethers from 6.13.1 to 6.13.2 ([#1709](https://github.com/privacy-scaling-explorations/maci/issues/1709)) ([c9de72e](https://github.com/privacy-scaling-explorations/maci/commit/c9de72eead282027cc9dcab0edd9170a0fbe5a2e))
* **deps:** bump hardhat from 2.22.1 to 2.22.2 ([397e50b](https://github.com/privacy-scaling-explorations/maci/commit/397e50b6ded4cc81ce299747b2847254af7ea1ce))
* **deps:** bump hardhat from 2.22.3 to 2.22.4 ([481a1e7](https://github.com/privacy-scaling-explorations/maci/commit/481a1e7a83ad8984880a98aa09824b3dc689acd9))
* **deps:** bump hardhat from 2.22.5 to 2.22.6 ([6949eee](https://github.com/privacy-scaling-explorations/maci/commit/6949eee8717c16c129b15c570283ea58ce39ec33))
* **keys:** update maci keys in docs and scripts ([403262f](https://github.com/privacy-scaling-explorations/maci/commit/403262f3941a2b4e41b9cc05cc8dc340ebe5e759))
* optimize message processor and tally ([d75b244](https://github.com/privacy-scaling-explorations/maci/commit/d75b2446c2ee012d146afe8d7bc423f5b94e4579))
* **release:** publish 1.2.1 ([93564f8](https://github.com/privacy-scaling-explorations/maci/commit/93564f8a98baa0fee65db16e2e40209d9ac1b3ae))
* **release:** publish 2.0.0 ([04e647d](https://github.com/privacy-scaling-explorations/maci/commit/04e647d231df34952569ad6ff802e0b2333eb658))
* remove max values ([8f951b0](https://github.com/privacy-scaling-explorations/maci/commit/8f951b0fcc73212d99d3ddc962fbaa9788471fb6))
* unify maci address arguments ([dfc5fd2](https://github.com/privacy-scaling-explorations/maci/commit/dfc5fd2050f60e869c940d656ed66c895dc23fe5))
* update @openzeppelin/contracts to 5.0.2 ([188b259](https://github.com/privacy-scaling-explorations/maci/commit/188b25990124ac69bf7796d2c1907a797e095481))
* update hardhat to 2.21.1 ([ba6e236](https://github.com/privacy-scaling-explorations/maci/commit/ba6e236be14ff9b29126e887c9d552bc207e7467))
* use async fs instead of sync version ([fb8317e](https://github.com/privacy-scaling-explorations/maci/commit/fb8317ef3943a8434083de6e1b0f9469f15dd113))
* **zkeys:** use ts to download zkey artifacts and simplify repo ([d364f24](https://github.com/privacy-scaling-explorations/maci/commit/d364f24c074a860744d10ed62eae73c58f8c3250))



## [1.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.2.0) (2024-02-23)


### Features

* add interfaces and factory contracts with Natspec ([579a53f](https://github.com/privacy-scaling-explorations/maci/commit/579a53f1f9a501e95fbfb064d39272c57a9e4f21))
* **circuits:** remove zkey-manager in favour of circomkit ([d79e9c0](https://github.com/privacy-scaling-explorations/maci/commit/d79e9c0ee18df27c3bd3e5e49924db21303d1c45))
* **cli:** accept signer as parameter to cli commands ([b1802e7](https://github.com/privacy-scaling-explorations/maci/commit/b1802e79ac853aa796ba7078e994683b0db35061))
* **cli:** improve cli integration ux ([7727ab1](https://github.com/privacy-scaling-explorations/maci/commit/7727ab1d99096b296d6c3f25956b0465d036aa4d))
* optimize deployment and tally event ([185b407](https://github.com/privacy-scaling-explorations/maci/commit/185b407df6db0484824b99286a6b0e866a7345bf))


### Bug Fixes

* **fix integrationtests:** fix integrationTests caused by refactoring ([09ae37f](https://github.com/privacy-scaling-explorations/maci/commit/09ae37fd63db7ee75b977d33e67ded050ce7441d))
* **integrationTests:** add auto mining option for hardhat ([fe336a2](https://github.com/privacy-scaling-explorations/maci/commit/fe336a269c62b3b8dc40b9c387ca1796759be49b))
* **publish:** ensure we publish the correct files ([bc42724](https://github.com/privacy-scaling-explorations/maci/commit/bc42724b34cf0c047c5692fbf477ed013a102aee))
* remove extra blank line ([41d0bb1](https://github.com/privacy-scaling-explorations/maci/commit/41d0bb198176047d699666cd427eae12d1eb1e75))
* remove trailing chars ([3101a60](https://github.com/privacy-scaling-explorations/maci/commit/3101a6016ebda3385273b47b2de33f5fd9c1221f))
* **tests:** remove wrong chai matcher from integrationTests ([33d1d4d](https://github.com/privacy-scaling-explorations/maci/commit/33d1d4d726594eed1a27f2ef851daf5f65a36c9e))


### Code Refactoring

* **cli:** use object args for cli commands ([41c4333](https://github.com/privacy-scaling-explorations/maci/commit/41c4333f8471b6a9ed616e5081dd99684b458b51))
* **contracts:** refactor contracts code by removing dead code, and various optimizations ([7cbe5bd](https://github.com/privacy-scaling-explorations/maci/commit/7cbe5bd67dbfe98b46b485a75361a6cc3badb7ff))
* **contracts:** remove maxValues and batchSizes from Maci.deployPoll() and instead calculate ([5393868](https://github.com/privacy-scaling-explorations/maci/commit/5393868efa270d9308e78c96e9bf6a7e8d63f3b6)), closes [#1066](https://github.com/privacy-scaling-explorations/maci/issues/1066)
* **core:** refactor the core package subsidy and tally functions ([0af7dd2](https://github.com/privacy-scaling-explorations/maci/commit/0af7dd2d448c4796c3872665d43654343f9fc3e3))
* **core:** refactor the process message functions and general cleanup ([823cacd](https://github.com/privacy-scaling-explorations/maci/commit/823cacd8659281b8390b74c8d765b23ee7a83a80))
* fix ESLint issues ([6c0ed97](https://github.com/privacy-scaling-explorations/maci/commit/6c0ed97c0976a81b5e5506699d550ec93a553cb8))
* **nonqv:** optimize tally votes non qv circuit and contracts ([ea632a9](https://github.com/privacy-scaling-explorations/maci/commit/ea632a97862c4304c764f511ab480b3664224b5f))
* **zk-kit-poseidon:** remove old circomlib dependencies in crypto ([0340f79](https://github.com/privacy-scaling-explorations/maci/commit/0340f7960a2214410d8885541ac542419a980a34))


### Miscellaneous

* add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
* add types check ([69f038f](https://github.com/privacy-scaling-explorations/maci/commit/69f038f55e6c740d43b8b5376db999bcf92de845))
* apply prettier ([8b905c0](https://github.com/privacy-scaling-explorations/maci/commit/8b905c0948d4a1f950653c6812067ec98ebfcbc8))
* bundle size optimizations ([18da49c](https://github.com/privacy-scaling-explorations/maci/commit/18da49c791e53350158659df8248d48af8e80f6d))
* **changelog:** add CHANGELOG of v1.1.1 ([f0c315a](https://github.com/privacy-scaling-explorations/maci/commit/f0c315a4c1b86f88839f2dbe4c4b9f59193f7be4))
* **cli:** integrate linter ([49571a1](https://github.com/privacy-scaling-explorations/maci/commit/49571a1199a8a027c64a7c39bd21f46a3a268f43))
* **cli:** prepare cli package for web apps ([f706d9a](https://github.com/privacy-scaling-explorations/maci/commit/f706d9aa5689f58e646650d92b188f27e5beb4d8))
* **cli:** reorganize e2e tests and add more tests for cli commands ([6000227](https://github.com/privacy-scaling-explorations/maci/commit/6000227231bee3917686b64685c14ca329fcf38b))
* **cli:** support install for web apps ([3166cdd](https://github.com/privacy-scaling-explorations/maci/commit/3166cdd249450c36f069e0d9703980902339eb54))
* **cli:** unify publish arg type ([50635dc](https://github.com/privacy-scaling-explorations/maci/commit/50635dc429f8784dde3815d91384c3d67eae8f85))
* **contract:** add deploy tasks for maci ([8b58688](https://github.com/privacy-scaling-explorations/maci/commit/8b586889033c0703b6358ddda78753725b8d07c9))
* **contract:** apply linter for deploy scripts and contracts ([9af9c04](https://github.com/privacy-scaling-explorations/maci/commit/9af9c0497a2491eaf89fbff475cf0f60bc04f59c))
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
* **deps:** bump ethers from 6.10.0 to 6.11.0 ([815696d](https://github.com/privacy-scaling-explorations/maci/commit/815696de4268c41e466ab6794215807a38906938))
* **deps:** bump ethers from 6.11.0 to 6.11.1 ([a01f434](https://github.com/privacy-scaling-explorations/maci/commit/a01f434451a377447052518236a23ad3c9051d17))
* **deps:** bump ethers from 6.9.2 to 6.10.0 ([dd8b4a0](https://github.com/privacy-scaling-explorations/maci/commit/dd8b4a048c013f28be175cc0db17fe5fc45d5976))
* **deps:** bump hardhat from 2.19.4 to 2.19.5 ([40ab10d](https://github.com/privacy-scaling-explorations/maci/commit/40ab10defff0a538aefa81d67fd6ce04b69f5eb6))
* **deps:** bump hardhat from 2.19.5 to 2.20.1 ([68543a6](https://github.com/privacy-scaling-explorations/maci/commit/68543a6886b2836c42fd18b77f9e98f322fb971e))
* **integration:** ensure integration tests are using the correct user keys ([5b6aa92](https://github.com/privacy-scaling-explorations/maci/commit/5b6aa9255907cd0e02f692ad7d8487f9bd9a70f3))
* **intergationTests:** apply linter for intergration tests package ([ef75ec3](https://github.com/privacy-scaling-explorations/maci/commit/ef75ec37b2b4e000ad4b3fcdbdf85ba822690512))
* linter ([42ea4f0](https://github.com/privacy-scaling-explorations/maci/commit/42ea4f0ae8b342f6bd5ca5ac86f1bdd143978324))
* linter unification ([61a8bcd](https://github.com/privacy-scaling-explorations/maci/commit/61a8bcd915fd3e4b4da3c00d40704d892c02f51b))
* **poll:** unify pollId type ([21d01ef](https://github.com/privacy-scaling-explorations/maci/commit/21d01efc565df74ea8b71dfeeead60be5a07db56))
* **publishing:** remove bash script for empty ballot roots contract ([025287c](https://github.com/privacy-scaling-explorations/maci/commit/025287c778547e0acb1582532f3412e022cca6fa))
* **release:** publish 1.1.2 ([10b3a85](https://github.com/privacy-scaling-explorations/maci/commit/10b3a85cc9b53c0fc1ccdf54221a48ec8d6efe0d))
* remove `gitHead` field from package.json ([d38ba71](https://github.com/privacy-scaling-explorations/maci/commit/d38ba71301469f350b3d80eab5bf94e779dda9cc))
* run prettier ([d09cd0e](https://github.com/privacy-scaling-explorations/maci/commit/d09cd0e01ac747245307ceec5343d9ed30d7a6f0))
* run prettier fix after bumping version ([e1f85a5](https://github.com/privacy-scaling-explorations/maci/commit/e1f85a53bbb72696b6998af5406748fd18df4701))
* **testing:** revisit testing docs and add more in detail info ([183c1d8](https://github.com/privacy-scaling-explorations/maci/commit/183c1d8361bdf3a192a212ef610ae7855c96c587))
* **website:** apply linter for website and remove unused packages ([1a3b343](https://github.com/privacy-scaling-explorations/maci/commit/1a3b343948f9f48ed4948a5ade63b4b55645f4ab))



## [1.1.2](https://github.com/gurrpi/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/gurrpi/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/gurrpi/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))

## [1.1.1](https://github.com/gurrpi/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **integrationtests:** add missing error handling in integration test harness ([403787e](https://github.com/gurrpi/maci/commit/403787e197f5188270d9ed0da52abbba9d0db7d1))
- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/gurrpi/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/gurrpi/maci/issues/551) [#552](https://github.com/gurrpi/maci/issues/552)
