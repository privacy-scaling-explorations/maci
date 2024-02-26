# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.2.0) (2024-02-23)


### Features

* add interfaces and factory contracts with Natspec ([579a53f](https://github.com/privacy-scaling-explorations/maci/commit/579a53f1f9a501e95fbfb064d39272c57a9e4f21))
* **cli:** add get poll cli command ([e6e2dd3](https://github.com/privacy-scaling-explorations/maci/commit/e6e2dd3714ff4a5261a864f26aef5fb9e745ac22))
* **cli:** improve cli integration ux ([7727ab1](https://github.com/privacy-scaling-explorations/maci/commit/7727ab1d99096b296d6c3f25956b0465d036aa4d))
* **contracts:** made `nextPollId` public to support third-party apps more easily ([c5c6bdb](https://github.com/privacy-scaling-explorations/maci/commit/c5c6bdb3db3e4ce25d0de642e75278becc405d61))
* **contracts:** return contract addresses when deploying the poll contract ([e94998c](https://github.com/privacy-scaling-explorations/maci/commit/e94998c12d8a5f2bde2fb54b4af384d42e35d646))
* **eas-gatekeeper:** implement an eas gatekeeper for MACI ([8b25d94](https://github.com/privacy-scaling-explorations/maci/commit/8b25d94c7a99ab1b5e5e75062d782a6dae239b34))
* optimize deployment and tally event ([185b407](https://github.com/privacy-scaling-explorations/maci/commit/185b407df6db0484824b99286a6b0e866a7345bf))
* **poll:** add message batch submission ([005258b](https://github.com/privacy-scaling-explorations/maci/commit/005258bad7a87f52fe2d770c55b69e4f300bcca7))
* **tally:** remove ballotsTallied event and add view function ([32f840e](https://github.com/privacy-scaling-explorations/maci/commit/32f840ec5e61bac8b0bc1d1711fb27fc5b9dbf22))


### Bug Fixes

* **address messageprocessor issues:** address and fixed PR reviews on MessageProcessor.sol ([6505fb2](https://github.com/privacy-scaling-explorations/maci/commit/6505fb2464866bf96c293dad2f3662638930cde8))
* **address pr reviews:** address PR reviews issues for Tally.sol ([10f2c7f](https://github.com/privacy-scaling-explorations/maci/commit/10f2c7f486de115e3d2706de1a773a93854ca505))
* **cli:** add auto mining option for hardhat ([e5ad345](https://github.com/privacy-scaling-explorations/maci/commit/e5ad3452b77be5007b0ddbe593606a7bcd2a9fc5))
* **constraint updatesbcommitment:** add onlyOwner modifier to updateSbCommitment ([5b8ee10](https://github.com/privacy-scaling-explorations/maci/commit/5b8ee101f40ed02a79e4bf09a9eaf946b54a8ee2))
* **contract unit test:** fixed unit test suites error caused by contracts refactor ([0dca2c0](https://github.com/privacy-scaling-explorations/maci/commit/0dca2c07a1fb0199128bf809d35a06f71da36b74))
* **contracts:** enforce msgType = 1 for vote messages at the contract level ([c547e9c](https://github.com/privacy-scaling-explorations/maci/commit/c547e9c2f32414ab6ec3b1e714217850fd52e18b))
* **contracts:** fix wrong tally processing check ([a90bcf8](https://github.com/privacy-scaling-explorations/maci/commit/a90bcf838a1236f212e9e22a725e3e605dbc707e)), closes [#1137](https://github.com/privacy-scaling-explorations/maci/issues/1137)
* **contracts:** prevent user DoS the stateAq tree merging ([d07d3bf](https://github.com/privacy-scaling-explorations/maci/commit/d07d3bf565df0a1882b7296ba58e494eb0092681))
* **contracts:** save numSignups after merging maciStateAq inside the Poll contract ([4985b2d](https://github.com/privacy-scaling-explorations/maci/commit/4985b2d61655f3b802186fc03c2d85a658c0f0da)), closes [#1091](https://github.com/privacy-scaling-explorations/maci/issues/1091)
* **crypto:** get rid of potential prototype polution ([9b8a97c](https://github.com/privacy-scaling-explorations/maci/commit/9b8a97cc9661e0ee6f535cdcab19b4aa0fa98136))
* **fetch:** fix bugs related to logs fetching ([7c7874e](https://github.com/privacy-scaling-explorations/maci/commit/7c7874e86ccfff35a45b33caa7587bd3c0b1cf01)), closes [#1043](https://github.com/privacy-scaling-explorations/maci/issues/1043) [#1044](https://github.com/privacy-scaling-explorations/maci/issues/1044)
* **fix subsidy.sol issues:** address PR on Subsidy.sol ([bb68116](https://github.com/privacy-scaling-explorations/maci/commit/bb6811667f912c9ab0b3af2af083a5421a0d832b))
* **message-batch-index:** remove redundant check ([98c00a6](https://github.com/privacy-scaling-explorations/maci/commit/98c00a674133e020ea42ab3fee5d089a15d47920))
* **publish:** ensure we publish the correct files ([bc42724](https://github.com/privacy-scaling-explorations/maci/commit/bc42724b34cf0c047c5692fbf477ed013a102aee))
* return new poll addres ([acb38ba](https://github.com/privacy-scaling-explorations/maci/commit/acb38bafe3527ec5541e53c712981127246a007f))
* **signups:** ensure we account for the blank state leaf ([b1c8c97](https://github.com/privacy-scaling-explorations/maci/commit/b1c8c9719da5d47b92408f1222399c9c4acf3df9)), closes [#947](https://github.com/privacy-scaling-explorations/maci/issues/947)


### Code Refactoring

* **contracts:** add audit auggestions ([415c3da](https://github.com/privacy-scaling-explorations/maci/commit/415c3da5c65247b55b5078cc89c8f9605d8be77a))
* **contracts:** add natspec across contracts and cleanup ([a6ad25e](https://github.com/privacy-scaling-explorations/maci/commit/a6ad25e3787fee837172b95ee706951806131bd4))
* **contracts:** add public to Tally.isTallied ([0d28b7a](https://github.com/privacy-scaling-explorations/maci/commit/0d28b7a5fa22b6ea2f2b13de5e483f95f46c65be))
* **contracts:** add virtual to functions which could be overridden ([aefe48a](https://github.com/privacy-scaling-explorations/maci/commit/aefe48abd34da1f64d3db9f25bb01ff3bbf08cc9))
* **contracts:** cleanup unused scripts and organize ts code ([458bc6b](https://github.com/privacy-scaling-explorations/maci/commit/458bc6b09cbc8db652dbb72525e299a4c2631caf))
* **contracts:** optimize code by using immutable variables are removing redundant code ([d39d384](https://github.com/privacy-scaling-explorations/maci/commit/d39d3844690749b396ba66226224789b19af522d))
* **contracts:** optimize publishMessage by using calldata and removing arg change ([6f64471](https://github.com/privacy-scaling-explorations/maci/commit/6f64471e9f06b751297ea33d48d6f1e5b4a86fb9))
* **contracts:** optimize utilities.padAndHashMessage ([0cc29ca](https://github.com/privacy-scaling-explorations/maci/commit/0cc29cabd6d2e82692dc996b0b3d71be28ad35b5))
* **contracts:** refactor contracts code by removing dead code, and various optimizations ([7cbe5bd](https://github.com/privacy-scaling-explorations/maci/commit/7cbe5bd67dbfe98b46b485a75361a6cc3badb7ff))
* **contracts:** refactoring deployment scripts ([eba33cf](https://github.com/privacy-scaling-explorations/maci/commit/eba33cfc822208d9a6ca1ad4e9d3442a8c613c4d)), closes [#555](https://github.com/privacy-scaling-explorations/maci/issues/555)
* **contracts:** remove maxValues and batchSizes from Maci.deployPoll() and instead calculate ([5393868](https://github.com/privacy-scaling-explorations/maci/commit/5393868efa270d9308e78c96e9bf6a7e8d63f3b6)), closes [#1066](https://github.com/privacy-scaling-explorations/maci/issues/1066)
* **contracts:** revisit functions visibility and inheritance ([f729336](https://github.com/privacy-scaling-explorations/maci/commit/f72933674f1253155887936cb40fe833ea219cf4))
* **contracts:** smart contracts optimizations ([b10ff70](https://github.com/privacy-scaling-explorations/maci/commit/b10ff70a9f90e9e8d97497b7442d1416b06a09b9))
* **core:** refactor the core package subsidy and tally functions ([0af7dd2](https://github.com/privacy-scaling-explorations/maci/commit/0af7dd2d448c4796c3872665d43654343f9fc3e3))
* **core:** refactor the process message functions and general cleanup ([823cacd](https://github.com/privacy-scaling-explorations/maci/commit/823cacd8659281b8390b74c8d765b23ee7a83a80))
* **core:** remove unnecessary messageAq from Poll ([d3930f7](https://github.com/privacy-scaling-explorations/maci/commit/d3930f706963747903305cce1ee5a716ea28c31d))
* **core:** remove unnecessary stateAq from MaciState ([22a4f28](https://github.com/privacy-scaling-explorations/maci/commit/22a4f286010ff5add413eee88d933c0e74898346))
* fix ESLint issues ([6c0ed97](https://github.com/privacy-scaling-explorations/maci/commit/6c0ed97c0976a81b5e5506699d550ec93a553cb8))
* **maci-core:** refactor directory structure for quick core component access ([3aeba77](https://github.com/privacy-scaling-explorations/maci/commit/3aeba77435fbd783e5cecf88a1f2c0d4c58c8022))
* **nonqv:** optimize tally votes non qv circuit and contracts ([ea632a9](https://github.com/privacy-scaling-explorations/maci/commit/ea632a97862c4304c764f511ab480b3664224b5f))
* **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/privacy-scaling-explorations/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))
* **zk-kit-poseidon:** remove old circomlib dependencies in crypto ([0340f79](https://github.com/privacy-scaling-explorations/maci/commit/0340f7960a2214410d8885541ac542419a980a34))


### Miscellaneous

* add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
* add types check ([69f038f](https://github.com/privacy-scaling-explorations/maci/commit/69f038f55e6c740d43b8b5376db999bcf92de845))
* apply prettier ([8b905c0](https://github.com/privacy-scaling-explorations/maci/commit/8b905c0948d4a1f950653c6812067ec98ebfcbc8))
* bundle size optimizations ([18da49c](https://github.com/privacy-scaling-explorations/maci/commit/18da49c791e53350158659df8248d48af8e80f6d))
* **changelog:** add CHANGELOG of v1.1.1 ([f0c315a](https://github.com/privacy-scaling-explorations/maci/commit/f0c315a4c1b86f88839f2dbe4c4b9f59193f7be4))
* **circuits:** refactor and add tests for the circom circuits ([4d6419b](https://github.com/privacy-scaling-explorations/maci/commit/4d6419b4962af6e94929721a3008406b6bc29c1e))
* **cli:** integrate linter ([49571a1](https://github.com/privacy-scaling-explorations/maci/commit/49571a1199a8a027c64a7c39bd21f46a3a268f43))
* **cli:** optimize bundle size ([39268b2](https://github.com/privacy-scaling-explorations/maci/commit/39268b2ff8e0d27d062c6d3bc52a63ce8038ec5e))
* **cli:** reorganize e2e tests and add more tests for cli commands ([6000227](https://github.com/privacy-scaling-explorations/maci/commit/6000227231bee3917686b64685c14ca329fcf38b))
* **cli:** support install for web apps ([3166cdd](https://github.com/privacy-scaling-explorations/maci/commit/3166cdd249450c36f069e0d9703980902339eb54))
* **contract:** add contract verification task ([ab4718f](https://github.com/privacy-scaling-explorations/maci/commit/ab4718f2084588ac443812ffb873d2cdcac0742b))
* **contract:** add deploy script for eas gatekeeper ([65d883c](https://github.com/privacy-scaling-explorations/maci/commit/65d883c5686e8ba21c4858d298c08bf118ad91ad))
* **contract:** add deploy tasks for maci ([8b58688](https://github.com/privacy-scaling-explorations/maci/commit/8b586889033c0703b6358ddda78753725b8d07c9))
* **contract:** apply linter for deploy scripts and contracts ([9af9c04](https://github.com/privacy-scaling-explorations/maci/commit/9af9c0497a2491eaf89fbff475cf0f60bc04f59c))
* **contract:** disable empty code blocks warnings ([f30bda2](https://github.com/privacy-scaling-explorations/maci/commit/f30bda2cd1cc58da5864f9954b177558e592e1f5))
* **contracts:** add documentation for deployment workflow ([243690e](https://github.com/privacy-scaling-explorations/maci/commit/243690ea11fb91eb8bad3aea5539c1a19720e740))
* **contracts:** add gas reporter to hardhat config ([fd00eb5](https://github.com/privacy-scaling-explorations/maci/commit/fd00eb5d073b12e3c8a6236d1629fe9ccc80f2e3))
* **contracts:** add merge signups and messages task ([5ee0237](https://github.com/privacy-scaling-explorations/maci/commit/5ee023761f4c448f52a01007a1f2f84b74edd446))
* **contracts:** add proof generation for task coordinator ([c145883](https://github.com/privacy-scaling-explorations/maci/commit/c145883ecc42b87170a401894b68cd2287d15832))
* **contracts:** clarify EASGatekeeper description ([301a42b](https://github.com/privacy-scaling-explorations/maci/commit/301a42b9cf9921932b013f0c2882bce444e61113))
* **contracts:** deploy poll ([f3ae8f8](https://github.com/privacy-scaling-explorations/maci/commit/f3ae8f8895c78e8e7f932c341a2063bad6f52f0e))
* **contracts:** enable linter ([5c92154](https://github.com/privacy-scaling-explorations/maci/commit/5c92154fc09f0c59ca5054229798f3c8ad7d134d))
* **contracts:** re-organize smart contract tests in separate files ([c7ee31e](https://github.com/privacy-scaling-explorations/maci/commit/c7ee31e0f2ef623e069cc5a5261ebcd40dbba4c6))
* **contracts:** refactor and add unit tests to the current suite ([32c3485](https://github.com/privacy-scaling-explorations/maci/commit/32c348556e5bf7b0a586ed8925ef7037f6623af9))
* **dependencies:** update project dependencies and remove redundant ones ([4c5ac27](https://github.com/privacy-scaling-explorations/maci/commit/4c5ac27767492c9867a6e2ab2acd6b10fe132847))
* **deps-dev:** bump @types/node from 18.19.6 to 20.10.8 ([6645120](https://github.com/privacy-scaling-explorations/maci/commit/664512038212d36d40799e8c4787847735bd7d82))
* **deps-dev:** bump @types/node from 20.10.8 to 20.11.0 ([805d253](https://github.com/privacy-scaling-explorations/maci/commit/805d2536a54478c51403362419ecad0b6ab736a7))
* **deps-dev:** bump @types/node from 20.11.0 to 20.11.2 ([45839e8](https://github.com/privacy-scaling-explorations/maci/commit/45839e8c2668ec56ea06221758605f88029ea8a1))
* **deps-dev:** bump @types/node from 20.11.10 to 20.11.16 ([8144919](https://github.com/privacy-scaling-explorations/maci/commit/8144919939f7d9a841eb6fce7182628cedbf8746))
* **deps-dev:** bump @types/node from 20.11.16 to 20.11.17 ([44de5db](https://github.com/privacy-scaling-explorations/maci/commit/44de5db0c25a5fdfd5c13c397f49edb7185bf1f5))
* **deps-dev:** bump @types/node from 20.11.17 to 20.11.19 ([8d86b32](https://github.com/privacy-scaling-explorations/maci/commit/8d86b32ef70b89f4239aad3903fd36937cf6a90f))
* **deps-dev:** bump @types/node from 20.11.2 to 20.11.5 ([7698ede](https://github.com/privacy-scaling-explorations/maci/commit/7698edef2b95bc017e54c1fc0d796ccc9da3de85))
* **deps-dev:** bump @types/node from 20.11.5 to 20.11.10 ([a2c445a](https://github.com/privacy-scaling-explorations/maci/commit/a2c445a295e792e421f6c1537b2b21f8a7648683))
* **deps-dev:** bump @types/snarkjs from 0.7.7 to 0.7.8 ([0d98828](https://github.com/privacy-scaling-explorations/maci/commit/0d988285b1694d57c40f815a1d1ec5f6a50e5296))
* **deps-dev:** bump lerna from 6.6.2 to 8.0.2 ([4b150ad](https://github.com/privacy-scaling-explorations/maci/commit/4b150ade7c4fbaf88eb0e1f629cec6749377706d))
* **deps-dev:** bump typescript from 5.2.2 to 5.3.3 ([4ec399d](https://github.com/privacy-scaling-explorations/maci/commit/4ec399dd6e984c12ebd24d0b20c14c1104872500))
* **deps:** bump dotenv from 16.3.2 to 16.4.1 ([2430c50](https://github.com/privacy-scaling-explorations/maci/commit/2430c50ba5625f87f632f302c420a7fd10f5467a))
* **deps:** bump dotenv from 16.4.1 to 16.4.2 ([8431e74](https://github.com/privacy-scaling-explorations/maci/commit/8431e74c22099dcd7201e7005dbc25bc03c9e65c))
* **deps:** bump dotenv from 16.4.2 to 16.4.4 ([472c616](https://github.com/privacy-scaling-explorations/maci/commit/472c616570c427f508f3854e1cd357ceed4a8e1a))
* **deps:** bump ethers from 6.10.0 to 6.11.0 ([815696d](https://github.com/privacy-scaling-explorations/maci/commit/815696de4268c41e466ab6794215807a38906938))
* **deps:** bump ethers from 6.11.0 to 6.11.1 ([a01f434](https://github.com/privacy-scaling-explorations/maci/commit/a01f434451a377447052518236a23ad3c9051d17))
* **deps:** bump ethers from 6.9.2 to 6.10.0 ([dd8b4a0](https://github.com/privacy-scaling-explorations/maci/commit/dd8b4a048c013f28be175cc0db17fe5fc45d5976))
* **deps:** bump hardhat from 2.19.4 to 2.19.5 ([40ab10d](https://github.com/privacy-scaling-explorations/maci/commit/40ab10defff0a538aefa81d67fd6ce04b69f5eb6))
* **deps:** bump hardhat from 2.19.5 to 2.20.1 ([68543a6](https://github.com/privacy-scaling-explorations/maci/commit/68543a6886b2836c42fd18b77f9e98f322fb971e))
* linter ([42ea4f0](https://github.com/privacy-scaling-explorations/maci/commit/42ea4f0ae8b342f6bd5ca5ac86f1bdd143978324))
* linter unification ([61a8bcd](https://github.com/privacy-scaling-explorations/maci/commit/61a8bcd915fd3e4b4da3c00d40704d892c02f51b))
* **maci:** added audit report and amended Contract's README ([0c6d28b](https://github.com/privacy-scaling-explorations/maci/commit/0c6d28b66091609a3cf62b1a0faa08e87b5c82aa))
* **maci:** added README for the circuit package and fixed typo in contract's README ([4d0f74b](https://github.com/privacy-scaling-explorations/maci/commit/4d0f74b8480cd2d20e835d43b33c2aab6578d194))
* **maci:** updated docs after review ([fd0da34](https://github.com/privacy-scaling-explorations/maci/commit/fd0da346406a5c2c6648bbff1b081863039bcf2b)), closes [#531](https://github.com/privacy-scaling-explorations/maci/issues/531) [#556](https://github.com/privacy-scaling-explorations/maci/issues/556)
* **poll:** unify pollId type ([21d01ef](https://github.com/privacy-scaling-explorations/maci/commit/21d01efc565df74ea8b71dfeeead60be5a07db56))
* **publish:** fix publishing scripts to publish contracts with ceremony params ([f27af1c](https://github.com/privacy-scaling-explorations/maci/commit/f27af1cbea7070848686fdbebb234bce47a180c8)), closes [#973](https://github.com/privacy-scaling-explorations/maci/issues/973)
* **publishing:** remove bash script for empty ballot roots contract ([025287c](https://github.com/privacy-scaling-explorations/maci/commit/025287c778547e0acb1582532f3412e022cca6fa))
* rebased with the dev branch ([8165968](https://github.com/privacy-scaling-explorations/maci/commit/8165968fb18aa599a30c2f4ba48553cf65a16980))
* **release:** publish 1.1.2 ([10b3a85](https://github.com/privacy-scaling-explorations/maci/commit/10b3a85cc9b53c0fc1ccdf54221a48ec8d6efe0d))
* remove `gitHead` field from package.json ([d38ba71](https://github.com/privacy-scaling-explorations/maci/commit/d38ba71301469f350b3d80eab5bf94e779dda9cc))
* run prettier ([d09cd0e](https://github.com/privacy-scaling-explorations/maci/commit/d09cd0e01ac747245307ceec5343d9ed30d7a6f0))
* run prettier fix after bumping version ([e1f85a5](https://github.com/privacy-scaling-explorations/maci/commit/e1f85a53bbb72696b6998af5406748fd18df4701))
* **topup:** implement test cases for the topup feature ([7775a8b](https://github.com/privacy-scaling-explorations/maci/commit/7775a8b3295f29b098446d3e78a4200c03c847dd))
* update docs ([d33e7e6](https://github.com/privacy-scaling-explorations/maci/commit/d33e7e6bc833907bec1d5575ec4f46656011028c))



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
