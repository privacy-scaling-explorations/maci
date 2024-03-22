# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.2.0) (2024-02-23)


### Features

* add interfaces and factory contracts with Natspec ([579a53f](https://github.com/privacy-scaling-explorations/maci/commit/579a53f1f9a501e95fbfb064d39272c57a9e4f21))
* **circuits:** remove circomlib fork in favour of latest and zk-kit ([bf11b40](https://github.com/privacy-scaling-explorations/maci/commit/bf11b4092cd531cf0993534061cf7c24e8de44e2)), closes [#772](https://github.com/privacy-scaling-explorations/maci/issues/772)
* **circuits:** remove zkey-manager in favour of circomkit ([d79e9c0](https://github.com/privacy-scaling-explorations/maci/commit/d79e9c0ee18df27c3bd3e5e49924db21303d1c45))
* **cli:** accept signer as parameter to cli commands ([b1802e7](https://github.com/privacy-scaling-explorations/maci/commit/b1802e79ac853aa796ba7078e994683b0db35061))
* **cli:** add get poll cli command ([e6e2dd3](https://github.com/privacy-scaling-explorations/maci/commit/e6e2dd3714ff4a5261a864f26aef5fb9e745ac22))
* **cli:** add relevant information in tally.json to simplify verify interface ([6fa9c1e](https://github.com/privacy-scaling-explorations/maci/commit/6fa9c1ee62fabff44410e4bd3ab71847de4338ed))
* **cli:** add seed param for generate keypair command ([29d7b20](https://github.com/privacy-scaling-explorations/maci/commit/29d7b2057741012811622c30f91cda74cf4906eb))
* **cli:** improve cli integration ux ([7727ab1](https://github.com/privacy-scaling-explorations/maci/commit/7727ab1d99096b296d6c3f25956b0465d036aa4d))
* **contracts:** return contract addresses when deploying the poll contract ([e94998c](https://github.com/privacy-scaling-explorations/maci/commit/e94998c12d8a5f2bde2fb54b4af384d42e35d646))
* modify cli/.env.template and allow hardhat.config.ts to read env variables ([a206df1](https://github.com/privacy-scaling-explorations/maci/commit/a206df111ef8439bb1c0b7d484a288087602c9f2))
* optimize deployment and tally event ([185b407](https://github.com/privacy-scaling-explorations/maci/commit/185b407df6db0484824b99286a6b0e866a7345bf))
* **proofs:** make preferred witness type in circuit's genProof function ([2b95044](https://github.com/privacy-scaling-explorations/maci/commit/2b95044921cd0bed72694d069e2f9ed8fa44e72e))
* **qv:** add optional flag to use quadratic voting or not in MACI ([86ba854](https://github.com/privacy-scaling-explorations/maci/commit/86ba8548780049245482e5277cc47f4a8776e9e6))
* update sidebar ([6206a1b](https://github.com/privacy-scaling-explorations/maci/commit/6206a1b8849108d78997e00b01c6e7f11efce124))


### Bug Fixes

* add on-chain verification ([6427f37](https://github.com/privacy-scaling-explorations/maci/commit/6427f373d805805adb6205270f5074561d5c3a35))
* **circuits:** enforce use of stateIndex from message ([510e6ee](https://github.com/privacy-scaling-explorations/maci/commit/510e6ee365958e8c7f72cfca6cea75d15a89d28b))
* **cli:** add a check that the subsidy verifying key was set correctly on chain ([6bda14d](https://github.com/privacy-scaling-explorations/maci/commit/6bda14dd7021846a639ce8cffef3a863eda2b447)), closes [#446](https://github.com/privacy-scaling-explorations/maci/issues/446)
* **cli:** add env initialization for hardhat config ([5442b8a](https://github.com/privacy-scaling-explorations/maci/commit/5442b8a88e3133f2cbdbcf68ed1710207d5f0988))
* **cli:** export genLocalState ([0026669](https://github.com/privacy-scaling-explorations/maci/commit/0026669b31420ad31da1fa7eb716822217a3df30))
* **cli:** give priority to gatekeeper and voice credit proxy args ([1597ee3](https://github.com/privacy-scaling-explorations/maci/commit/1597ee3a00c05fdf8ff46811804a78af450f066c))
* **cli:** prioritize contract addresses params ([8ec36c4](https://github.com/privacy-scaling-explorations/maci/commit/8ec36c4d65329b40d7e232861c63208761d73b0a)), closes [#1039](https://github.com/privacy-scaling-explorations/maci/issues/1039)
* **cli:** remove files property from package.json ([5c544c6](https://github.com/privacy-scaling-explorations/maci/commit/5c544c62f071f7e9e2d613fe80c0bfda2a75e202))
* **cli:** remove hardcoded gas limit from signup and publish ([1bf3a4b](https://github.com/privacy-scaling-explorations/maci/commit/1bf3a4b525956bf06a99cdb93aa5f3eef2d34390)), closes [#1086](https://github.com/privacy-scaling-explorations/maci/issues/1086)
* **cli:** remove redundant local check for poll address ([8b19756](https://github.com/privacy-scaling-explorations/maci/commit/8b1975665fdacffc9b116822d99d4b711f4e2871)), closes [#1084](https://github.com/privacy-scaling-explorations/maci/issues/1084)
* **cli:** run all the tests for package ([859a8cf](https://github.com/privacy-scaling-explorations/maci/commit/859a8cfd4a45fa8919a536f9503fc838b5aa4568))
* **cli:** signup loop length ([bfecd5b](https://github.com/privacy-scaling-explorations/maci/commit/bfecd5be779b5564d0a4436ad7725d2aedcbb320))
* **contracts:** fix wrong tally processing check ([a90bcf8](https://github.com/privacy-scaling-explorations/maci/commit/a90bcf838a1236f212e9e22a725e3e605dbc707e)), closes [#1137](https://github.com/privacy-scaling-explorations/maci/issues/1137)
* **contracts:** save numSignups after merging maciStateAq inside the Poll contract ([4985b2d](https://github.com/privacy-scaling-explorations/maci/commit/4985b2d61655f3b802186fc03c2d85a658c0f0da)), closes [#1091](https://github.com/privacy-scaling-explorations/maci/issues/1091)
* **fetch:** fix bugs related to logs fetching ([7c7874e](https://github.com/privacy-scaling-explorations/maci/commit/7c7874e86ccfff35a45b33caa7587bd3c0b1cf01)), closes [#1043](https://github.com/privacy-scaling-explorations/maci/issues/1043) [#1044](https://github.com/privacy-scaling-explorations/maci/issues/1044)
* **fix integrationtests:** fix integrationTests caused by refactoring ([09ae37f](https://github.com/privacy-scaling-explorations/maci/commit/09ae37fd63db7ee75b977d33e67ded050ce7441d))
* **fix subsidy.sol issues:** address PR on Subsidy.sol ([bb68116](https://github.com/privacy-scaling-explorations/maci/commit/bb6811667f912c9ab0b3af2af083a5421a0d832b))
* **message-batch-index:** remove redundant check ([98c00a6](https://github.com/privacy-scaling-explorations/maci/commit/98c00a674133e020ea42ab3fee5d089a15d47920))
* **nightly:** add back snarkjs to cli as dev dependency and fix poll duration ([1e5e41d](https://github.com/privacy-scaling-explorations/maci/commit/1e5e41d1b1d322af50935058c2dde71c6ccc91bb))
* **publish:** ensure we publish the correct files ([bc42724](https://github.com/privacy-scaling-explorations/maci/commit/bc42724b34cf0c047c5692fbf477ed013a102aee))
* **signups:** ensure we account for the blank state leaf ([b1c8c97](https://github.com/privacy-scaling-explorations/maci/commit/b1c8c9719da5d47b92408f1222399c9c4acf3df9)), closes [#947](https://github.com/privacy-scaling-explorations/maci/issues/947)
* **tests:** fix ceremony params nightly workflow and convert to ts ([b2b4d4a](https://github.com/privacy-scaling-explorations/maci/commit/b2b4d4ad8f3e02ca8eacce7e694b65e104f668e0))
* undefined error reading totalSpentVoiceCredits ([10e46af](https://github.com/privacy-scaling-explorations/maci/commit/10e46afd39ec265d0c74f69a3ee13a57340e8955))


### Code Refactoring

* **circuits:** fix ts types, improve docs ([a849486](https://github.com/privacy-scaling-explorations/maci/commit/a84948685d2e4be426cef50c5c608c107b5142b1))
* **cli:** print relevant values when comparing fails ([2e26126](https://github.com/privacy-scaling-explorations/maci/commit/2e26126f61cf95417aa3f5021775fc657cae7b95))
* **cli:** use object args for cli commands ([41c4333](https://github.com/privacy-scaling-explorations/maci/commit/41c4333f8471b6a9ed616e5081dd99684b458b51))
* **contracts:** cleanup unused scripts and organize ts code ([458bc6b](https://github.com/privacy-scaling-explorations/maci/commit/458bc6b09cbc8db652dbb72525e299a4c2631caf))
* **contracts:** refactor contracts code by removing dead code, and various optimizations ([7cbe5bd](https://github.com/privacy-scaling-explorations/maci/commit/7cbe5bd67dbfe98b46b485a75361a6cc3badb7ff))
* **contracts:** remove maxValues and batchSizes from Maci.deployPoll() and instead calculate ([5393868](https://github.com/privacy-scaling-explorations/maci/commit/5393868efa270d9308e78c96e9bf6a7e8d63f3b6)), closes [#1066](https://github.com/privacy-scaling-explorations/maci/issues/1066)
* **core:** refactor the core package subsidy and tally functions ([0af7dd2](https://github.com/privacy-scaling-explorations/maci/commit/0af7dd2d448c4796c3872665d43654343f9fc3e3))
* **core:** remove unnecessary messageAq from Poll ([d3930f7](https://github.com/privacy-scaling-explorations/maci/commit/d3930f706963747903305cce1ee5a716ea28c31d))
* **crypto:** remove ffjavascript and implement utils functions locally ([0b2986f](https://github.com/privacy-scaling-explorations/maci/commit/0b2986fcaadbfce37ff9fc0007ddeae97573924e)), closes [#458](https://github.com/privacy-scaling-explorations/maci/issues/458)
* **nonqv:** optimize tally votes non qv circuit and contracts ([ea632a9](https://github.com/privacy-scaling-explorations/maci/commit/ea632a97862c4304c764f511ab480b3664224b5f))
* **optimisedmt:** remove dependency and implement locally ([c7d81e2](https://github.com/privacy-scaling-explorations/maci/commit/c7d81e20aaf6308c7d4e1efc09c497729f6a8f10))
* **refactor verify.ts:** refactor verify cli command for Tally and Subsidy contracts ([dedfda6](https://github.com/privacy-scaling-explorations/maci/commit/dedfda6364d9a0ba26492eda6621a32c07fc0683))
* **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/privacy-scaling-explorations/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))
* **repo:** remove redundant code from certain packages ([d55497a](https://github.com/privacy-scaling-explorations/maci/commit/d55497a9805812b2d2472386caecf75995d6efcf))


### Miscellaneous

* add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
* add types check ([69f038f](https://github.com/privacy-scaling-explorations/maci/commit/69f038f55e6c740d43b8b5376db999bcf92de845))
* apply prettier ([8b905c0](https://github.com/privacy-scaling-explorations/maci/commit/8b905c0948d4a1f950653c6812067ec98ebfcbc8))
* bundle size optimizations ([18da49c](https://github.com/privacy-scaling-explorations/maci/commit/18da49c791e53350158659df8248d48af8e80f6d))
* **ceremony:** add circuit tests with ceremony params ([58611db](https://github.com/privacy-scaling-explorations/maci/commit/58611dbf62f2dc01cf978d6bf01cf15bdef77356))
* **changelog:** add CHANGELOG of v1.1.1 ([f0c315a](https://github.com/privacy-scaling-explorations/maci/commit/f0c315a4c1b86f88839f2dbe4c4b9f59193f7be4))
* **cli:** change maci-cli script run instructions ([c51c34d](https://github.com/privacy-scaling-explorations/maci/commit/c51c34dc915721770474ad3555853ce1264aea07))
* **cli:** clarify cli commands ([3aa4f33](https://github.com/privacy-scaling-explorations/maci/commit/3aa4f33aa7f4558f16da65b5a3fb93b282bd4fe5))
* **cli:** integrate linter ([49571a1](https://github.com/privacy-scaling-explorations/maci/commit/49571a1199a8a027c64a7c39bd21f46a3a268f43))
* **cli:** optimize bundle size ([39268b2](https://github.com/privacy-scaling-explorations/maci/commit/39268b2ff8e0d27d062c6d3bc52a63ce8038ec5e))
* **cli:** prepare cli package for web apps ([f706d9a](https://github.com/privacy-scaling-explorations/maci/commit/f706d9aa5689f58e646650d92b188f27e5beb4d8))
* **cli:** reorganize e2e tests and add more tests for cli commands ([6000227](https://github.com/privacy-scaling-explorations/maci/commit/6000227231bee3917686b64685c14ca329fcf38b))
* **cli:** support install for web apps ([3166cdd](https://github.com/privacy-scaling-explorations/maci/commit/3166cdd249450c36f069e0d9703980902339eb54))
* **cli:** unify publish arg type ([50635dc](https://github.com/privacy-scaling-explorations/maci/commit/50635dc429f8784dde3815d91384c3d67eae8f85))
* **contract:** apply linter for deploy scripts and contracts ([9af9c04](https://github.com/privacy-scaling-explorations/maci/commit/9af9c0497a2491eaf89fbff475cf0f60bc04f59c))
* **contracts:** enable linter ([5c92154](https://github.com/privacy-scaling-explorations/maci/commit/5c92154fc09f0c59ca5054229798f3c8ad7d134d))
* **core:** add `CircuitInputs` type ([c4b72b0](https://github.com/privacy-scaling-explorations/maci/commit/c4b72b0f0b25a1bb147348a728a9550c8b6460a1))
* **core:** add quiet flag to process messages to log errors ([8793a09](https://github.com/privacy-scaling-explorations/maci/commit/8793a09dd3c52021d467b27e1cb64c023faba317)), closes [#1135](https://github.com/privacy-scaling-explorations/maci/issues/1135)
* **core:** add Typedoc comments ([a8521ee](https://github.com/privacy-scaling-explorations/maci/commit/a8521eea97bca47298bc2c59ae1c31df9533258b))
* **coverage:** setup coverage for TS packages ([f4e6964](https://github.com/privacy-scaling-explorations/maci/commit/f4e6964b3e268e4d3f2819b85e6abf3e34bcb10e))
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
* **deps:** bump @commander-js/extra-typings from 11.1.0 to 12.0.0 ([8688daa](https://github.com/privacy-scaling-explorations/maci/commit/8688daadb2cd2f863bbee718e30cf8d9e8c9b110))
* **deps:** bump commander from 11.1.0 to 12.0.0 ([72b1a2e](https://github.com/privacy-scaling-explorations/maci/commit/72b1a2e672d4808d3b2c7a3ad13e92b7db0811c8))
* **deps:** bump dotenv from 16.3.1 to 16.3.2 ([845becc](https://github.com/privacy-scaling-explorations/maci/commit/845becc8508d841b01430eb56379f828687b840b))
* **deps:** bump dotenv from 16.3.2 to 16.4.1 ([2430c50](https://github.com/privacy-scaling-explorations/maci/commit/2430c50ba5625f87f632f302c420a7fd10f5467a))
* **deps:** bump dotenv from 16.4.1 to 16.4.2 ([8431e74](https://github.com/privacy-scaling-explorations/maci/commit/8431e74c22099dcd7201e7005dbc25bc03c9e65c))
* **deps:** bump dotenv from 16.4.2 to 16.4.4 ([472c616](https://github.com/privacy-scaling-explorations/maci/commit/472c616570c427f508f3854e1cd357ceed4a8e1a))
* **deps:** bump ethers from 6.10.0 to 6.11.0 ([815696d](https://github.com/privacy-scaling-explorations/maci/commit/815696de4268c41e466ab6794215807a38906938))
* **deps:** bump ethers from 6.11.0 to 6.11.1 ([a01f434](https://github.com/privacy-scaling-explorations/maci/commit/a01f434451a377447052518236a23ad3c9051d17))
* **deps:** bump ethers from 6.9.2 to 6.10.0 ([dd8b4a0](https://github.com/privacy-scaling-explorations/maci/commit/dd8b4a048c013f28be175cc0db17fe5fc45d5976))
* **deps:** bump hardhat from 2.19.4 to 2.19.5 ([40ab10d](https://github.com/privacy-scaling-explorations/maci/commit/40ab10defff0a538aefa81d67fd6ce04b69f5eb6))
* **deps:** bump hardhat from 2.19.5 to 2.20.1 ([68543a6](https://github.com/privacy-scaling-explorations/maci/commit/68543a6886b2836c42fd18b77f9e98f322fb971e))
* **deps:** bump snarkjs from 0.7.2 to 0.7.3 ([cf95b6f](https://github.com/privacy-scaling-explorations/maci/commit/cf95b6ff6f66342e3b75dedd5c70d62f8f0816b1))
* **deps:** remove circomlib and add big-integer ([50eff2f](https://github.com/privacy-scaling-explorations/maci/commit/50eff2f6a8e009c19eab50b3b3e15b779d63f8f3))
* **key-change:** add tests and docs around key-change ([ce394e2](https://github.com/privacy-scaling-explorations/maci/commit/ce394e2d2bf3c8c6748cf8e8d1e401b8f3c924ee))
* linter ([42ea4f0](https://github.com/privacy-scaling-explorations/maci/commit/42ea4f0ae8b342f6bd5ca5ac86f1bdd143978324))
* linter unification ([61a8bcd](https://github.com/privacy-scaling-explorations/maci/commit/61a8bcd915fd3e4b4da3c00d40704d892c02f51b))
* **maci-cli:** check hardhat config file ([3a6ac6b](https://github.com/privacy-scaling-explorations/maci/commit/3a6ac6b41b759edff67533c0b665777329d63735))
* **poll:** unify pollId type ([21d01ef](https://github.com/privacy-scaling-explorations/maci/commit/21d01efc565df74ea8b71dfeeead60be5a07db56))
* **publishing:** remove bash script for empty ballot roots contract ([025287c](https://github.com/privacy-scaling-explorations/maci/commit/025287c778547e0acb1582532f3412e022cca6fa))
* rebased with the dev branch ([8165968](https://github.com/privacy-scaling-explorations/maci/commit/8165968fb18aa599a30c2f4ba48553cf65a16980))
* **release:** publish 1.1.2 ([10b3a85](https://github.com/privacy-scaling-explorations/maci/commit/10b3a85cc9b53c0fc1ccdf54221a48ec8d6efe0d))
* remove `gitHead` field from package.json ([d38ba71](https://github.com/privacy-scaling-explorations/maci/commit/d38ba71301469f350b3d80eab5bf94e779dda9cc))
* run prettier ([d09cd0e](https://github.com/privacy-scaling-explorations/maci/commit/d09cd0e01ac747245307ceec5343d9ed30d7a6f0))
* run prettier fix after bumping version ([e1f85a5](https://github.com/privacy-scaling-explorations/maci/commit/e1f85a53bbb72696b6998af5406748fd18df4701))
* **topup:** implement test cases for the topup feature ([7775a8b](https://github.com/privacy-scaling-explorations/maci/commit/7775a8b3295f29b098446d3e78a4200c03c847dd))
* update ptauFiles URLs ([b11b56a](https://github.com/privacy-scaling-explorations/maci/commit/b11b56ae09d78ef89443b094adad5b1916438ca1))
* **website:** apply linter for website and remove unused packages ([1a3b343](https://github.com/privacy-scaling-explorations/maci/commit/1a3b343948f9f48ed4948a5ade63b4b55645f4ab))



## [1.1.2](https://github.com/gurrpi/maci/compare/v1.1.1...v1.1.2) (2023-01-19)

### Code Refactoring

- **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/gurrpi/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))

### Miscellaneous

- add a badges to README.md ([888524b](https://github.com/gurrpi/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
- **changelog:** add CHANGELOG of v1.1.1 ([ea1f0ca](https://github.com/gurrpi/maci/commit/ea1f0ca93f1618df0ba046f1f01b2abad57e0ee1))

## [1.1.1](https://github.com/gurrpi/maci/compare/v1.1.0...v1.1.1) (2022-12-03)

### Bug Fixes

- **maci:** upgraded minor version and fixed bug in testnet deployment ([5ef5ed8](https://github.com/gurrpi/maci/commit/5ef5ed842360277ac823c6919e171d0c51ff5702)), closes [#551](https://github.com/gurrpi/maci/issues/551) [#552](https://github.com/gurrpi/maci/issues/552)
- **maci:** upgraded snarkjs and other dependencies ([0ce643a](https://github.com/gurrpi/maci/commit/0ce643a18704c1a2d9245e8e85032874a11f004e))
