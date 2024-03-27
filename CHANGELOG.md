# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.1.1...v1.2.0) (2024-02-23)


### Features

* add branch info ([52deba2](https://github.com/privacy-scaling-explorations/maci/commit/52deba23880b2a4d5a7a433aac34edd788547983))
* add favicon ([4baefd6](https://github.com/privacy-scaling-explorations/maci/commit/4baefd6f4c5ebda3168dd3a2565535fd878a85f1))
* add hero image opacity ([4408bc0](https://github.com/privacy-scaling-explorations/maci/commit/4408bc072817b15d046a75670f3d90173bbd69cc))
* add homepage metadata ([be1ae0d](https://github.com/privacy-scaling-explorations/maci/commit/be1ae0d38627cbe0c88785355b901578d2b8e58d))
* add info disclaimer to roadmap ([dc1f210](https://github.com/privacy-scaling-explorations/maci/commit/dc1f2104ef011b81b4583a904fd98550e594f515))
* add info disclaimer to roadmap ([be3a3bb](https://github.com/privacy-scaling-explorations/maci/commit/be3a3bb794b31f3258575d8760f1905bc9829368))
* add info disclaimer to spec ([6a7bdeb](https://github.com/privacy-scaling-explorations/maci/commit/6a7bdeb3b2982d13fb3b0022afea9dfaec0ed920))
* add interfaces and factory contracts with Natspec ([579a53f](https://github.com/privacy-scaling-explorations/maci/commit/579a53f1f9a501e95fbfb064d39272c57a9e4f21))
* add roadmap webpage ([c849237](https://github.com/privacy-scaling-explorations/maci/commit/c84923751f2b9a1ff6adb1bfc0dc23d7a5bb6aa4))
* add roadmap webpage ([90bf276](https://github.com/privacy-scaling-explorations/maci/commit/90bf276bdf421d582d1583b0238c67cb2a70fc61))
* add tech stack page [[#851](https://github.com/privacy-scaling-explorations/maci/issues/851)] ([d27b229](https://github.com/privacy-scaling-explorations/maci/commit/d27b229e2a644bc90c0500fde9a586e565c1a079))
* add tech stack page [[#851](https://github.com/privacy-scaling-explorations/maci/issues/851)] ([c581be9](https://github.com/privacy-scaling-explorations/maci/commit/c581be961d10c65b0722650fec1b782e473243e8))
* add versioning info [Fixes [#807](https://github.com/privacy-scaling-explorations/maci/issues/807)] ([518ffe8](https://github.com/privacy-scaling-explorations/maci/commit/518ffe8225387843c3cba3e23b35b3fc8f83e38f))
* build typedoc for website ([bd75ea4](https://github.com/privacy-scaling-explorations/maci/commit/bd75ea4a8aa7346ac2fcd5797527923c2038f66c))
* **circuits:** remove circomlib fork in favour of latest and zk-kit ([bf11b40](https://github.com/privacy-scaling-explorations/maci/commit/bf11b4092cd531cf0993534061cf7c24e8de44e2)), closes [#772](https://github.com/privacy-scaling-explorations/maci/issues/772)
* **circuits:** remove zkey-manager in favour of circomkit ([d79e9c0](https://github.com/privacy-scaling-explorations/maci/commit/d79e9c0ee18df27c3bd3e5e49924db21303d1c45))
* **cli:** accept signer as parameter to cli commands ([b1802e7](https://github.com/privacy-scaling-explorations/maci/commit/b1802e79ac853aa796ba7078e994683b0db35061))
* **cli:** add get poll cli command ([e6e2dd3](https://github.com/privacy-scaling-explorations/maci/commit/e6e2dd3714ff4a5261a864f26aef5fb9e745ac22))
* **cli:** add relevant information in tally.json to simplify verify interface ([6fa9c1e](https://github.com/privacy-scaling-explorations/maci/commit/6fa9c1ee62fabff44410e4bd3ab71847de4338ed))
* **cli:** add seed param for generate keypair command ([29d7b20](https://github.com/privacy-scaling-explorations/maci/commit/29d7b2057741012811622c30f91cda74cf4906eb))
* **cli:** improve cli integration ux ([7727ab1](https://github.com/privacy-scaling-explorations/maci/commit/7727ab1d99096b296d6c3f25956b0465d036aa4d))
* **contracts:** made `nextPollId` public to support third-party apps more easily ([c5c6bdb](https://github.com/privacy-scaling-explorations/maci/commit/c5c6bdb3db3e4ce25d0de642e75278becc405d61))
* **contracts:** return contract addresses when deploying the poll contract ([e94998c](https://github.com/privacy-scaling-explorations/maci/commit/e94998c12d8a5f2bde2fb54b4af384d42e35d646))
* **eas-gatekeeper:** implement an eas gatekeeper for MACI ([8b25d94](https://github.com/privacy-scaling-explorations/maci/commit/8b25d94c7a99ab1b5e5e75062d782a6dae239b34))
* make image zoomable by adding package ([ee34a25](https://github.com/privacy-scaling-explorations/maci/commit/ee34a253521efe79f308456080fcbbf79e7484ab))
* modify cli/.env.template and allow hardhat.config.ts to read env variables ([a206df1](https://github.com/privacy-scaling-explorations/maci/commit/a206df111ef8439bb1c0b7d484a288087602c9f2))
* optimize deployment and tally event ([185b407](https://github.com/privacy-scaling-explorations/maci/commit/185b407df6db0484824b99286a6b0e866a7345bf))
* **poll:** add message batch submission ([005258b](https://github.com/privacy-scaling-explorations/maci/commit/005258bad7a87f52fe2d770c55b69e4f300bcca7))
* **proofs:** make preferred witness type in circuit's genProof function ([2b95044](https://github.com/privacy-scaling-explorations/maci/commit/2b95044921cd0bed72694d069e2f9ed8fa44e72e))
* **qv:** add optional flag to use quadratic voting or not in MACI ([86ba854](https://github.com/privacy-scaling-explorations/maci/commit/86ba8548780049245482e5277cc47f4a8776e9e6))
* specify we use SemVer ([078ccf6](https://github.com/privacy-scaling-explorations/maci/commit/078ccf6fd02671527593ea43efb4f9960eead755))
* **tally:** remove ballotsTallied event and add view function ([32f840e](https://github.com/privacy-scaling-explorations/maci/commit/32f840ec5e61bac8b0bc1d1711fb27fc5b9dbf22))
* update features on homepage ([9e930a8](https://github.com/privacy-scaling-explorations/maci/commit/9e930a840209986ea76ac8f4bcfc0bf335707975))
* update fonts ([2d8efdb](https://github.com/privacy-scaling-explorations/maci/commit/2d8efdbcb823b122a17ef5e9c750370c03c12236))
* update meta image ([bd4a330](https://github.com/privacy-scaling-explorations/maci/commit/bd4a3308b2601f61fdb5f5de8f57865293df4077))
* update sidebar ([6206a1b](https://github.com/privacy-scaling-explorations/maci/commit/6206a1b8849108d78997e00b01c6e7f11efce124))
* update ui ([6571b1e](https://github.com/privacy-scaling-explorations/maci/commit/6571b1e08b389aec92411da13269b23a0dc3b67b))
* update ui ([f62398e](https://github.com/privacy-scaling-explorations/maci/commit/f62398e0b9a35aa6e2f4ea198c21e7383d5675cc))


### Bug Fixes

* add on-chain verification ([6427f37](https://github.com/privacy-scaling-explorations/maci/commit/6427f373d805805adb6205270f5074561d5c3a35))
* **add safelessthan:** add SafeLessThan in utility.circom and use it in incrementalQuinnTree.circom ([60727d4](https://github.com/privacy-scaling-explorations/maci/commit/60727d4d10406edda32ad28e53d399d41d45ed88))
* **address messageprocessor issues:** address and fixed PR reviews on MessageProcessor.sol ([6505fb2](https://github.com/privacy-scaling-explorations/maci/commit/6505fb2464866bf96c293dad2f3662638930cde8))
* **address pr reviews:** address PR reviews issues for Tally.sol ([10f2c7f](https://github.com/privacy-scaling-explorations/maci/commit/10f2c7f486de115e3d2706de1a773a93854ca505))
* **build:** fix bug that prevented c witness from being compiled ([d22caad](https://github.com/privacy-scaling-explorations/maci/commit/d22caadca15dc6de639720faf1d9a53259714ce8))
* **circuits:** enforce use of stateIndex from message ([510e6ee](https://github.com/privacy-scaling-explorations/maci/commit/510e6ee365958e8c7f72cfca6cea75d15a89d28b))
* **circuits:** ensure we account for correct num signups in messageValidator ([04c847c](https://github.com/privacy-scaling-explorations/maci/commit/04c847cbc3f34979f292ec7561109f14e274efaf))
* **circuits:** fix coordinator censoring by passing currentVoteWeight = 0 ([22e091d](https://github.com/privacy-scaling-explorations/maci/commit/22e091d2941b5e86ecd7df2f228bd0e10b6c4c47))
* **circuits:** replace execSync with execFileSync ([4c121ca](https://github.com/privacy-scaling-explorations/maci/commit/4c121ca0413495979be7af87da5474a9f0b093bf))
* **cli:** add a check that the subsidy verifying key was set correctly on chain ([6bda14d](https://github.com/privacy-scaling-explorations/maci/commit/6bda14dd7021846a639ce8cffef3a863eda2b447)), closes [#446](https://github.com/privacy-scaling-explorations/maci/issues/446)
* **cli:** add auto mining option for hardhat ([e5ad345](https://github.com/privacy-scaling-explorations/maci/commit/e5ad3452b77be5007b0ddbe593606a7bcd2a9fc5))
* **cli:** add env initialization for hardhat config ([5442b8a](https://github.com/privacy-scaling-explorations/maci/commit/5442b8a88e3133f2cbdbcf68ed1710207d5f0988))
* **cli:** export genLocalState ([0026669](https://github.com/privacy-scaling-explorations/maci/commit/0026669b31420ad31da1fa7eb716822217a3df30))
* **cli:** give priority to gatekeeper and voice credit proxy args ([1597ee3](https://github.com/privacy-scaling-explorations/maci/commit/1597ee3a00c05fdf8ff46811804a78af450f066c))
* **cli:** prioritize contract addresses params ([8ec36c4](https://github.com/privacy-scaling-explorations/maci/commit/8ec36c4d65329b40d7e232861c63208761d73b0a)), closes [#1039](https://github.com/privacy-scaling-explorations/maci/issues/1039)
* **cli:** remove files property from package.json ([5c544c6](https://github.com/privacy-scaling-explorations/maci/commit/5c544c62f071f7e9e2d613fe80c0bfda2a75e202))
* **cli:** remove hardcoded gas limit from signup and publish ([1bf3a4b](https://github.com/privacy-scaling-explorations/maci/commit/1bf3a4b525956bf06a99cdb93aa5f3eef2d34390)), closes [#1086](https://github.com/privacy-scaling-explorations/maci/issues/1086)
* **cli:** remove redundant local check for poll address ([8b19756](https://github.com/privacy-scaling-explorations/maci/commit/8b1975665fdacffc9b116822d99d4b711f4e2871)), closes [#1084](https://github.com/privacy-scaling-explorations/maci/issues/1084)
* **cli:** run all the tests for package ([859a8cf](https://github.com/privacy-scaling-explorations/maci/commit/859a8cfd4a45fa8919a536f9503fc838b5aa4568))
* **cli:** signup loop length ([bfecd5b](https://github.com/privacy-scaling-explorations/maci/commit/bfecd5be779b5564d0a4436ad7725d2aedcbb320))
* **constraint updatesbcommitment:** add onlyOwner modifier to updateSbCommitment ([5b8ee10](https://github.com/privacy-scaling-explorations/maci/commit/5b8ee101f40ed02a79e4bf09a9eaf946b54a8ee2))
* **contract unit test:** fixed unit test suites error caused by contracts refactor ([0dca2c0](https://github.com/privacy-scaling-explorations/maci/commit/0dca2c07a1fb0199128bf809d35a06f71da36b74))
* **contracts:** enforce msgType = 1 for vote messages at the contract level ([c547e9c](https://github.com/privacy-scaling-explorations/maci/commit/c547e9c2f32414ab6ec3b1e714217850fd52e18b))
* **contracts:** fix wrong tally processing check ([a90bcf8](https://github.com/privacy-scaling-explorations/maci/commit/a90bcf838a1236f212e9e22a725e3e605dbc707e)), closes [#1137](https://github.com/privacy-scaling-explorations/maci/issues/1137)
* **contracts:** prevent user DoS the stateAq tree merging ([d07d3bf](https://github.com/privacy-scaling-explorations/maci/commit/d07d3bf565df0a1882b7296ba58e494eb0092681))
* **contracts:** save numSignups after merging maciStateAq inside the Poll contract ([4985b2d](https://github.com/privacy-scaling-explorations/maci/commit/4985b2d61655f3b802186fc03c2d85a658c0f0da)), closes [#1091](https://github.com/privacy-scaling-explorations/maci/issues/1091)
* **crypto:** get rid of potential prototype polution ([9b8a97c](https://github.com/privacy-scaling-explorations/maci/commit/9b8a97cc9661e0ee6f535cdcab19b4aa0fa98136))
* dark mode search result ([632b465](https://github.com/privacy-scaling-explorations/maci/commit/632b46587a2973b6898bc720af836e4777a1a0f0))
* **fetch:** fix bugs related to logs fetching ([7c7874e](https://github.com/privacy-scaling-explorations/maci/commit/7c7874e86ccfff35a45b33caa7587bd3c0b1cf01)), closes [#1043](https://github.com/privacy-scaling-explorations/maci/issues/1043) [#1044](https://github.com/privacy-scaling-explorations/maci/issues/1044)
* **fix integrationtests:** fix integrationTests caused by refactoring ([09ae37f](https://github.com/privacy-scaling-explorations/maci/commit/09ae37fd63db7ee75b977d33e67ded050ce7441d))
* **fix subsidy.sol issues:** address PR on Subsidy.sol ([bb68116](https://github.com/privacy-scaling-explorations/maci/commit/bb6811667f912c9ab0b3af2af083a5421a0d832b))
* fixed the maci-circuit package to allow building on circom >2.0.7 ([e954f78](https://github.com/privacy-scaling-explorations/maci/commit/e954f78224d53342826bfe73b082b673e0f147c8))
* footer link hover ([5fef6b3](https://github.com/privacy-scaling-explorations/maci/commit/5fef6b30199f6b47ca2fa72c5b052d13bdbc4ac7))
* header for Pre-Compiled Artifacts for testing ([967a8e0](https://github.com/privacy-scaling-explorations/maci/commit/967a8e056f4248ddf25da782318b13d7a618d0d4))
* homepage header ([cde43cf](https://github.com/privacy-scaling-explorations/maci/commit/cde43cfc4460d01371a3637e58f5a96b27f99bb6))
* **incrementalquintree:** remove unnecessary condition check in incrementalQuinnTree.circom ([87b3397](https://github.com/privacy-scaling-explorations/maci/commit/87b339790a5d44adb8c5bf447346e16933c48d5c))
* install wget in DockerFile ([4d357cf](https://github.com/privacy-scaling-explorations/maci/commit/4d357cf5ec7cc8f342b8165d8fe160fd2d75eb24))
* **integrationTests:** add auto mining option for hardhat ([fe336a2](https://github.com/privacy-scaling-explorations/maci/commit/fe336a269c62b3b8dc40b9c387ca1796759be49b))
* internal doc links ([c906a94](https://github.com/privacy-scaling-explorations/maci/commit/c906a94b5e201e6102795c0881058f74699cc629))
* **message-batch-index:** remove redundant check ([98c00a6](https://github.com/privacy-scaling-explorations/maci/commit/98c00a674133e020ea42ab3fee5d089a15d47920))
* move GH PR template ([a395812](https://github.com/privacy-scaling-explorations/maci/commit/a395812a9eaec3f87c775ac67d27f2c626ca5a11))
* **nightly:** add back snarkjs to cli as dev dependency and fix poll duration ([1e5e41d](https://github.com/privacy-scaling-explorations/maci/commit/1e5e41d1b1d322af50935058c2dde71c6ccc91bb))
* **optimisedmt:** update d.ts file formatting and remove any types ([4fe4aea](https://github.com/privacy-scaling-explorations/maci/commit/4fe4aea403ece0418112defe2f9572939ee600cf))
* **publish:** ensure test packages import exact version ([0ed2f61](https://github.com/privacy-scaling-explorations/maci/commit/0ed2f61617805a1d7ef58074caf89922126609a8))
* **publish:** ensure we commit unstaged files first ([42cd197](https://github.com/privacy-scaling-explorations/maci/commit/42cd1979531d2510b253e79bcd5d3c39beee5dee))
* **publish:** ensure we publish the correct files ([bc42724](https://github.com/privacy-scaling-explorations/maci/commit/bc42724b34cf0c047c5692fbf477ed013a102aee))
* **publishing:** do not publish benchmarks folder ([f2fbc36](https://github.com/privacy-scaling-explorations/maci/commit/f2fbc368a8a9520288b365e6fdf04fd3fee9e685))
* re-add blog image ([7822c9c](https://github.com/privacy-scaling-explorations/maci/commit/7822c9c2298edc9dbe97084bf182a9d12aaaf868))
* remove extra blank line ([41d0bb1](https://github.com/privacy-scaling-explorations/maci/commit/41d0bb198176047d699666cd427eae12d1eb1e75))
* remove HackMD TOC ([7554524](https://github.com/privacy-scaling-explorations/maci/commit/755452414b85c78ff52e5b2ea3b14123a5748602))
* remove trailing chars ([3101a60](https://github.com/privacy-scaling-explorations/maci/commit/3101a6016ebda3385273b47b2de33f5fd9c1221f))
* remove trailing chars ([101fdaf](https://github.com/privacy-scaling-explorations/maci/commit/101fdafe3c094b3615b651b8ff33337f338d2178))
* return new poll address ([acb38ba](https://github.com/privacy-scaling-explorations/maci/commit/acb38bafe3527ec5541e53c712981127246a007f))
* reword main branch list item ([789128a](https://github.com/privacy-scaling-explorations/maci/commit/789128a5380a5dfeb2f7668bacd1f133b51d7937))
* **safelessthan:** replaced several LessThan with SafeLessThan; fixed check on enoughVoiceCredit ([2d7a3a0](https://github.com/privacy-scaling-explorations/maci/commit/2d7a3a0efd33dfc3a5f4d3f95bec3adda7abb963))
* **server:** expanded regex to include capital case values ([ed5915e](https://github.com/privacy-scaling-explorations/maci/commit/ed5915eb524b92299b3a52f2de1000161a8f1a32))
* **server:** fix arbitrary parameters being injected into cli commands ([295f73f](https://github.com/privacy-scaling-explorations/maci/commit/295f73fe6744e924e677726987bb07b8c4761852))
* **signups:** ensure we account for the blank state leaf ([b1c8c97](https://github.com/privacy-scaling-explorations/maci/commit/b1c8c9719da5d47b92408f1222399c9c4acf3df9)), closes [#947](https://github.com/privacy-scaling-explorations/maci/issues/947)
* **tests:** fix ceremony params nightly workflow and convert to ts ([b2b4d4a](https://github.com/privacy-scaling-explorations/maci/commit/b2b4d4ad8f3e02ca8eacce7e694b65e104f668e0))
* **tests:** remove wrong chai matcher from integrationTests ([33d1d4d](https://github.com/privacy-scaling-explorations/maci/commit/33d1d4d726594eed1a27f2ef851daf5f65a36c9e))
* **topup:** check valid new state leaf balance ([ec12d2b](https://github.com/privacy-scaling-explorations/maci/commit/ec12d2b1ec31b0607f65be49a5679fcae5e3939d))
* undefined error reading totalSpentVoiceCredits ([10e46af](https://github.com/privacy-scaling-explorations/maci/commit/10e46afd39ec265d0c74f69a3ee13a57340e8955))
* update 'ceremony' to 'PR' ([f13ff56](https://github.com/privacy-scaling-explorations/maci/commit/f13ff5650d608535638ccc9ec370e7c069a55d1b))
* update broken GH links ([c414d31](https://github.com/privacy-scaling-explorations/maci/commit/c414d31226c57496014dba594fad8c5e9b9a7721))
* update broken links ([4f689d5](https://github.com/privacy-scaling-explorations/maci/commit/4f689d581fd5e3aa120adb327706a0a0d27ec996))
* update GH repo links to v1.1.1 tag ([8474267](https://github.com/privacy-scaling-explorations/maci/commit/847426712b202839762061fff2beabcdfc314119))
* update to singular "in detail" ([d352781](https://github.com/privacy-scaling-explorations/maci/commit/d352781fa6dbc117dbc036720fa536fc7247a93c))


### Code Refactoring

* **circuits:** fix ts types, improve docs ([a849486](https://github.com/privacy-scaling-explorations/maci/commit/a84948685d2e4be426cef50c5c608c107b5142b1))
* **cli:** print relevant values when comparing fails ([2e26126](https://github.com/privacy-scaling-explorations/maci/commit/2e26126f61cf95417aa3f5021775fc657cae7b95))
* **cli:** use object args for cli commands ([41c4333](https://github.com/privacy-scaling-explorations/maci/commit/41c4333f8471b6a9ed616e5081dd99684b458b51))
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
* **core:** cleanup the core package and ensure every function has a proper type ([f277e48](https://github.com/privacy-scaling-explorations/maci/commit/f277e48c040148f741e7a8cd8dbea9e6bf4ea1cc))
* **core:** export `TestHarness` from core test utils ([f8d4ccb](https://github.com/privacy-scaling-explorations/maci/commit/f8d4ccb3b70c006bb4aa59d67e5528f7bbf91d8e))
* **core:** refactor the core package subsidy and tally functions ([0af7dd2](https://github.com/privacy-scaling-explorations/maci/commit/0af7dd2d448c4796c3872665d43654343f9fc3e3))
* **core:** refactor the process message functions and general cleanup ([823cacd](https://github.com/privacy-scaling-explorations/maci/commit/823cacd8659281b8390b74c8d765b23ee7a83a80))
* **core:** remove redundant code which could slow down processing ([5a6fe98](https://github.com/privacy-scaling-explorations/maci/commit/5a6fe987a8e648abbcfd7ce2d768e216c19231a3))
* **core:** remove unnecessary messageAq from Poll ([d3930f7](https://github.com/privacy-scaling-explorations/maci/commit/d3930f706963747903305cce1ee5a716ea28c31d))
* **core:** remove unnecessary stateAq from MaciState ([22a4f28](https://github.com/privacy-scaling-explorations/maci/commit/22a4f286010ff5add413eee88d933c0e74898346))
* **core:** update README.md ([11ba386](https://github.com/privacy-scaling-explorations/maci/commit/11ba386a37cc802c4fd6a3c243e493de8e04a339))
* **crypto:** improve discoverability of the package by further separating classes and functions ([ed85bc5](https://github.com/privacy-scaling-explorations/maci/commit/ed85bc513336ac8e9d3dacbe98fd58fbaed31151))
* **crypto:** modify genPrivKey to generate a random seed vs a babyjubjub compatible value ([0f1e9ba](https://github.com/privacy-scaling-explorations/maci/commit/0f1e9bad81a872e67a09e6912beb48784cc19a4b))
* **crypto:** remove ffjavascript and implement utils functions locally ([0b2986f](https://github.com/privacy-scaling-explorations/maci/commit/0b2986fcaadbfce37ff9fc0007ddeae97573924e)), closes [#458](https://github.com/privacy-scaling-explorations/maci/issues/458)
* fix ESLint issues ([6c0ed97](https://github.com/privacy-scaling-explorations/maci/commit/6c0ed97c0976a81b5e5506699d550ec93a553cb8))
* **maci-core:** refactor directory structure for quick core component access ([3aeba77](https://github.com/privacy-scaling-explorations/maci/commit/3aeba77435fbd783e5cecf88a1f2c0d4c58c8022))
* **nonqv:** optimize tally votes non qv circuit and contracts ([ea632a9](https://github.com/privacy-scaling-explorations/maci/commit/ea632a97862c4304c764f511ab480b3664224b5f))
* **optimisedmt:** remove dependency and implement locally ([c7d81e2](https://github.com/privacy-scaling-explorations/maci/commit/c7d81e20aaf6308c7d4e1efc09c497729f6a8f10))
* **refactor verify.ts:** refactor verify cli command for Tally and Subsidy contracts ([dedfda6](https://github.com/privacy-scaling-explorations/maci/commit/dedfda6364d9a0ba26492eda6621a32c07fc0683))
* **remove messageaqfactory:** remove messageAqFactory; remove redundant pollFactory dependency ([dcd1c67](https://github.com/privacy-scaling-explorations/maci/commit/dcd1c67f14f0cb92979d13e7887373ff6e354a6f))
* **repo:** remove redundant code from certain packages ([d55497a](https://github.com/privacy-scaling-explorations/maci/commit/d55497a9805812b2d2472386caecf75995d6efcf))
* **zk-kit-poseidon:** remove old circomlib dependencies in crypto ([0340f79](https://github.com/privacy-scaling-explorations/maci/commit/0340f7960a2214410d8885541ac542419a980a34))


### Miscellaneous

* add .editorconfig ([85646b1](https://github.com/privacy-scaling-explorations/maci/commit/85646b1c98dee7060f7c8ea7f286b9083030bbd2))
* add a badges to README.md ([888524b](https://github.com/privacy-scaling-explorations/maci/commit/888524baae82d56edbf0c794e587de174906c34c))
* add contributing docs ([d5ca0cd](https://github.com/privacy-scaling-explorations/maci/commit/d5ca0cd81c88607779f7ed73f07087a71e1a4de5))
* add dependabot and codeowners ([1b31cbd](https://github.com/privacy-scaling-explorations/maci/commit/1b31cbd96f46357a9f1d72a04ac5473d9e7a03f4))
* add description to updateMentionFiles function, add typedoc/ in website/.gitignore ([1f7a509](https://github.com/privacy-scaling-explorations/maci/commit/1f7a509d85dc44f1fad0c7a96e37001143d75899))
* add licence link to README ([ea33510](https://github.com/privacy-scaling-explorations/maci/commit/ea33510406a945649609c8ece85685babe9f8266))
* add lint-staged to pre-commit hook for automatic ESLint fix ([7186bf3](https://github.com/privacy-scaling-explorations/maci/commit/7186bf3a1a24789f5cfa70ca857ac9734bc79aa1))
* add maci 1.0 spec ([87aa8f8](https://github.com/privacy-scaling-explorations/maci/commit/87aa8f80061fec243bccf83299db1b45dc22219b))
* add prettier ([fd915a3](https://github.com/privacy-scaling-explorations/maci/commit/fd915a306c6edf61526cad45ad523d7123a6b7f8))
* add prettier command to .lintstagedrc.json ([a2ceafd](https://github.com/privacy-scaling-explorations/maci/commit/a2ceafd4d88ecfb9f876c83956503a69644a7b2d))
* add programming language links ([7e850a0](https://github.com/privacy-scaling-explorations/maci/commit/7e850a00ace0be010f8206574c3feb7372fb689b))
* add roadmap blog post ([3a0c732](https://github.com/privacy-scaling-explorations/maci/commit/3a0c7321ed4d884f28354ba248fff6933e0e94b0))
* add slither github action ([7dcd048](https://github.com/privacy-scaling-explorations/maci/commit/7dcd048e37a157757f4b2334a235a68a509c2dba))
* add test file routes to circuit test commands ([6f0228f](https://github.com/privacy-scaling-explorations/maci/commit/6f0228f115211f8cf6581d7e80438791f98f6de0))
* add types check ([69f038f](https://github.com/privacy-scaling-explorations/maci/commit/69f038f55e6c740d43b8b5376db999bcf92de845))
* apply prettier ([8b905c0](https://github.com/privacy-scaling-explorations/maci/commit/8b905c0948d4a1f950653c6812067ec98ebfcbc8))
* **blog-post:** fixed header in v1.0 release post ([06590ca](https://github.com/privacy-scaling-explorations/maci/commit/06590ca5dd80e9336a60bd65092db84020950230))
* bump docusaurus packages ([00f5e38](https://github.com/privacy-scaling-explorations/maci/commit/00f5e38d892f6323edb3df6c430438763252a11c))
* bump homepage copy font size ([4692832](https://github.com/privacy-scaling-explorations/maci/commit/4692832ff1d3cf8ae33b87116bb156a471b22fd8))
* bump position of troublshooting page ([04440d7](https://github.com/privacy-scaling-explorations/maci/commit/04440d77847e9c0d44d66e122b894759621ef08c))
* bundle size optimizations ([18da49c](https://github.com/privacy-scaling-explorations/maci/commit/18da49c791e53350158659df8248d48af8e80f6d))
* **ceremony:** add circuit tests with ceremony params ([58611db](https://github.com/privacy-scaling-explorations/maci/commit/58611dbf62f2dc01cf978d6bf01cf15bdef77356))
* **changelog:** add CHANGELOG of v1.1.1 ([f0c315a](https://github.com/privacy-scaling-explorations/maci/commit/f0c315a4c1b86f88839f2dbe4c4b9f59193f7be4))
* **circuits:** fix wrong circuit param description ([0ede225](https://github.com/privacy-scaling-explorations/maci/commit/0ede2250defefeb7064e944ba691c5cf8913f175))
* **circuits:** integrate linter ([93e8a65](https://github.com/privacy-scaling-explorations/maci/commit/93e8a657fccb3232b18bf191984c6bea5ccabf85))
* **circuits:** refactor and add tests for the circom circuits ([4d6419b](https://github.com/privacy-scaling-explorations/maci/commit/4d6419b4962af6e94929721a3008406b6bc29c1e))
* **circuits:** remove todo messages ([071acc4](https://github.com/privacy-scaling-explorations/maci/commit/071acc42322be736932ef05d6e02356da4808bda))
* clarify installation instructions in readme ([88f947c](https://github.com/privacy-scaling-explorations/maci/commit/88f947cf057315c5d401f93829f7fc8059b1f035))
* clean up README ([e323734](https://github.com/privacy-scaling-explorations/maci/commit/e323734a168270f3dcb7ec3e0019cc75f5ef62ae))
* **cli:** change maci-cli script run instructions ([c51c34d](https://github.com/privacy-scaling-explorations/maci/commit/c51c34dc915721770474ad3555853ce1264aea07))
* **cli:** clarify cli commands ([3aa4f33](https://github.com/privacy-scaling-explorations/maci/commit/3aa4f33aa7f4558f16da65b5a3fb93b282bd4fe5))
* **cli:** integrate linter ([49571a1](https://github.com/privacy-scaling-explorations/maci/commit/49571a1199a8a027c64a7c39bd21f46a3a268f43))
* **cli:** optimize bundle size ([39268b2](https://github.com/privacy-scaling-explorations/maci/commit/39268b2ff8e0d27d062c6d3bc52a63ce8038ec5e))
* **cli:** prepare cli package for web apps ([f706d9a](https://github.com/privacy-scaling-explorations/maci/commit/f706d9aa5689f58e646650d92b188f27e5beb4d8))
* **cli:** reorganize e2e tests and add more tests for cli commands ([6000227](https://github.com/privacy-scaling-explorations/maci/commit/6000227231bee3917686b64685c14ca329fcf38b))
* **cli:** support install for web apps ([3166cdd](https://github.com/privacy-scaling-explorations/maci/commit/3166cdd249450c36f069e0d9703980902339eb54))
* **cli:** unify publish arg type ([50635dc](https://github.com/privacy-scaling-explorations/maci/commit/50635dc429f8784dde3815d91384c3d67eae8f85))
* **cli:** update cli docs to reflect latest changes ([ca1a1eb](https://github.com/privacy-scaling-explorations/maci/commit/ca1a1eb86464fcc76fdaa9811070277a91748704))
* comment out new font-family ([d0624ef](https://github.com/privacy-scaling-explorations/maci/commit/d0624ef27cf9eb636e8dd08ac121dd9acb531af5))
* **commitizen:** add commit-msg hook and npm script for committing ([352fce5](https://github.com/privacy-scaling-explorations/maci/commit/352fce5ec2ddb5c009132f8ee2248a817df7a10a))
* **contract:** add contract verification task ([ab4718f](https://github.com/privacy-scaling-explorations/maci/commit/ab4718f2084588ac443812ffb873d2cdcac0742b))
* **contract:** add deploy script for eas gatekeeper ([65d883c](https://github.com/privacy-scaling-explorations/maci/commit/65d883c5686e8ba21c4858d298c08bf118ad91ad))
* **contract:** add deploy tasks for maci ([8b58688](https://github.com/privacy-scaling-explorations/maci/commit/8b586889033c0703b6358ddda78753725b8d07c9))
* **contract:** apply linter for deploy scripts and contracts ([9af9c04](https://github.com/privacy-scaling-explorations/maci/commit/9af9c0497a2491eaf89fbff475cf0f60bc04f59c))
* **contract:** disable empty code blocks warnings ([f30bda2](https://github.com/privacy-scaling-explorations/maci/commit/f30bda2cd1cc58da5864f9954b177558e592e1f5))
* **contract:** improve the content of the index.md file used as TOC for NatSpec docs ([017e1f8](https://github.com/privacy-scaling-explorations/maci/commit/017e1f8ee5cee77b77f269ace4e176322c329b7d))
* **contracts:** add documentation for deployment workflow ([243690e](https://github.com/privacy-scaling-explorations/maci/commit/243690ea11fb91eb8bad3aea5539c1a19720e740))
* **contracts:** add gas reporter to hardhat config ([fd00eb5](https://github.com/privacy-scaling-explorations/maci/commit/fd00eb5d073b12e3c8a6236d1629fe9ccc80f2e3))
* **contracts:** add merge signups and messages task ([5ee0237](https://github.com/privacy-scaling-explorations/maci/commit/5ee023761f4c448f52a01007a1f2f84b74edd446))
* **contracts:** add proof generation for task coordinator ([c145883](https://github.com/privacy-scaling-explorations/maci/commit/c145883ecc42b87170a401894b68cd2287d15832))
* **contracts:** clarify EASGatekeeper description ([301a42b](https://github.com/privacy-scaling-explorations/maci/commit/301a42b9cf9921932b013f0c2882bce444e61113))
* **contracts:** deploy poll ([f3ae8f8](https://github.com/privacy-scaling-explorations/maci/commit/f3ae8f8895c78e8e7f932c341a2063bad6f52f0e))
* **contracts:** enable linter ([5c92154](https://github.com/privacy-scaling-explorations/maci/commit/5c92154fc09f0c59ca5054229798f3c8ad7d134d))
* **contracts:** re-organize smart contract tests in separate files ([c7ee31e](https://github.com/privacy-scaling-explorations/maci/commit/c7ee31e0f2ef623e069cc5a5261ebcd40dbba4c6))
* **contracts:** refactor and add unit tests to the current suite ([32c3485](https://github.com/privacy-scaling-explorations/maci/commit/32c348556e5bf7b0a586ed8925ef7037f6623af9))
* **core:** add `CircuitInputs` type ([c4b72b0](https://github.com/privacy-scaling-explorations/maci/commit/c4b72b0f0b25a1bb147348a728a9550c8b6460a1))
* **core:** add quiet flag to process messages to log errors ([8793a09](https://github.com/privacy-scaling-explorations/maci/commit/8793a09dd3c52021d467b27e1cb64c023faba317)), closes [#1135](https://github.com/privacy-scaling-explorations/maci/issues/1135)
* **core:** add Typedoc comments ([a8521ee](https://github.com/privacy-scaling-explorations/maci/commit/a8521eea97bca47298bc2c59ae1c31df9533258b))
* **core:** add unit tests for the process messages functions of the core package ([c78e1b4](https://github.com/privacy-scaling-explorations/maci/commit/c78e1b4c4a7acea9e18beef7291c8258b7b08c65))
* **core:** integrate linter ([614e76b](https://github.com/privacy-scaling-explorations/maci/commit/614e76b1b1de5d2c9876b11f15439e92b86db8f6))
* **core:** process messages test ([3db370e](https://github.com/privacy-scaling-explorations/maci/commit/3db370ef876213b1cefce39fb98b00640d9750e9))
* **core:** publish a declaration file ([0b55568](https://github.com/privacy-scaling-explorations/maci/commit/0b55568ee41dc9191b342dab057feccd1745b5fd))
* **core:** refactor and add tests for the core package ([4aedb83](https://github.com/privacy-scaling-explorations/maci/commit/4aedb83c917c0590f88a982a4b2eb910a2aab893))
* **core:** remove unnecessary code ([5f6d6b5](https://github.com/privacy-scaling-explorations/maci/commit/5f6d6b507665c64a7f6b0c81b0fc2475bc073984))
* **core:** replace repeated chaining call ([0588ef6](https://github.com/privacy-scaling-explorations/maci/commit/0588ef649420b850c9fe6f115dc5431016b741fb))
* **coverage:** setup coverage for TS packages ([f4e6964](https://github.com/privacy-scaling-explorations/maci/commit/f4e6964b3e268e4d3f2819b85e6abf3e34bcb10e))
* **crypto:** add type export for path elements ([35866fb](https://github.com/privacy-scaling-explorations/maci/commit/35866fb0f086b18835b74e5ecdb55aaceb3ef8db))
* **crypto:** complete unit tests for the crypto package ([80bd832](https://github.com/privacy-scaling-explorations/maci/commit/80bd832e49613172ef2b3972986f6e85c768c963))
* cut down /roadmap length ([5815208](https://github.com/privacy-scaling-explorations/maci/commit/5815208158143b42ba2083786cfdad5502cd80b2))
* **dependencies:** update project dependencies and remove redundant ones ([4c5ac27](https://github.com/privacy-scaling-explorations/maci/commit/4c5ac27767492c9867a6e2ab2acd6b10fe132847))
* **deps-dev:** bump @commitlint/cli from 18.4.3 to 18.4.4 ([87d2edb](https://github.com/privacy-scaling-explorations/maci/commit/87d2edb614a0d067c5f34604dddba63525206d3b))
* **deps-dev:** bump @commitlint/cli from 18.4.4 to 18.5.0 ([6057392](https://github.com/privacy-scaling-explorations/maci/commit/6057392770bcdd65e562f9ff767e2214ecca3b14))
* **deps-dev:** bump @commitlint/cli from 18.5.0 to 18.6.0 ([97dda5f](https://github.com/privacy-scaling-explorations/maci/commit/97dda5fd89ccf9d251b78892586ddbd15d06ec21))
* **deps-dev:** bump @commitlint/cli from 18.6.0 to 18.6.1 ([db86198](https://github.com/privacy-scaling-explorations/maci/commit/db86198c961c4a211566ae24431d62a085245092))
* **deps-dev:** bump @commitlint/config-conventional ([125ffd6](https://github.com/privacy-scaling-explorations/maci/commit/125ffd652a42e1704110bd1009c96b882506b4fd))
* **deps-dev:** bump @commitlint/config-conventional ([75fecbe](https://github.com/privacy-scaling-explorations/maci/commit/75fecbe165683101fad54eac41d6465a0607066c))
* **deps-dev:** bump @commitlint/config-conventional ([45c5491](https://github.com/privacy-scaling-explorations/maci/commit/45c54916f2e9059b281db8166343b13f31ec0f70))
* **deps-dev:** bump @commitlint/config-conventional ([511a64b](https://github.com/privacy-scaling-explorations/maci/commit/511a64b5c11a6baf0e02180fa9acc78d472ae802))
* **deps-dev:** bump @docusaurus/module-type-aliases ([ee4314d](https://github.com/privacy-scaling-explorations/maci/commit/ee4314d224cabdf620e2dd2e9d6deeae867e12f9))
* **deps-dev:** bump @docusaurus/module-type-aliases ([64aaad6](https://github.com/privacy-scaling-explorations/maci/commit/64aaad6734e3e235b84a66ca15bfee0d917e12ae))
* **deps-dev:** bump @docusaurus/tsconfig from 3.1.0 to 3.1.1 ([1d86718](https://github.com/privacy-scaling-explorations/maci/commit/1d867180f7a461a024458da43f0bf11df70a706c))
* **deps-dev:** bump @docusaurus/types from 3.0.0 to 3.1.0 ([2de823f](https://github.com/privacy-scaling-explorations/maci/commit/2de823fd5f480a4f0cbf7028ffd19b59cc007ade))
* **deps-dev:** bump @types/node from 18.19.6 to 20.10.8 ([6645120](https://github.com/privacy-scaling-explorations/maci/commit/664512038212d36d40799e8c4787847735bd7d82))
* **deps-dev:** bump @types/node from 20.10.8 to 20.11.0 ([805d253](https://github.com/privacy-scaling-explorations/maci/commit/805d2536a54478c51403362419ecad0b6ab736a7))
* **deps-dev:** bump @types/node from 20.11.0 to 20.11.2 ([45839e8](https://github.com/privacy-scaling-explorations/maci/commit/45839e8c2668ec56ea06221758605f88029ea8a1))
* **deps-dev:** bump @types/node from 20.11.10 to 20.11.16 ([8144919](https://github.com/privacy-scaling-explorations/maci/commit/8144919939f7d9a841eb6fce7182628cedbf8746))
* **deps-dev:** bump @types/node from 20.11.16 to 20.11.17 ([44de5db](https://github.com/privacy-scaling-explorations/maci/commit/44de5db0c25a5fdfd5c13c397f49edb7185bf1f5))
* **deps-dev:** bump @types/node from 20.11.17 to 20.11.19 ([8d86b32](https://github.com/privacy-scaling-explorations/maci/commit/8d86b32ef70b89f4239aad3903fd36937cf6a90f))
* **deps-dev:** bump @types/node from 20.11.2 to 20.11.5 ([7698ede](https://github.com/privacy-scaling-explorations/maci/commit/7698edef2b95bc017e54c1fc0d796ccc9da3de85))
* **deps-dev:** bump @types/node from 20.11.5 to 20.11.10 ([a2c445a](https://github.com/privacy-scaling-explorations/maci/commit/a2c445a295e792e421f6c1537b2b21f8a7648683))
* **deps-dev:** bump @types/snarkjs from 0.7.7 to 0.7.8 ([0d98828](https://github.com/privacy-scaling-explorations/maci/commit/0d988285b1694d57c40f815a1d1ec5f6a50e5296))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([9353753](https://github.com/privacy-scaling-explorations/maci/commit/9353753174b391a0f397aebb0a34b912c70fff64))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([83bd561](https://github.com/privacy-scaling-explorations/maci/commit/83bd561e3d6bad7293fa97ec9747b18213fa93e8))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([0f3bbba](https://github.com/privacy-scaling-explorations/maci/commit/0f3bbba41e1d83e2ab1d68498cb063401f58cc1d))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([b5186a1](https://github.com/privacy-scaling-explorations/maci/commit/b5186a1930e0162b2961a8db3134fcd7973fe329))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([acbef4c](https://github.com/privacy-scaling-explorations/maci/commit/acbef4c9116307fa10004c1c94faabafaf1fb807))
* **deps-dev:** bump @typescript-eslint/parser from 6.13.2 to 6.18.1 ([3901c97](https://github.com/privacy-scaling-explorations/maci/commit/3901c9760301c4f27caa83a173a9e8eb7a924b30))
* **deps-dev:** bump @typescript-eslint/parser from 6.18.1 to 6.19.0 ([a6992b5](https://github.com/privacy-scaling-explorations/maci/commit/a6992b57f88c321edcc01e71a65f7eb1935170f3))
* **deps-dev:** bump @typescript-eslint/parser from 6.19.0 to 6.19.1 ([bb064c3](https://github.com/privacy-scaling-explorations/maci/commit/bb064c328f492873aca8102a0e6b7a3c6fb58170))
* **deps-dev:** bump @typescript-eslint/parser from 6.19.1 to 6.20.0 ([b131368](https://github.com/privacy-scaling-explorations/maci/commit/b1313684dcc00d652f37b21dcb94bb79fbb230f1))
* **deps-dev:** bump @typescript-eslint/parser from 6.20.0 to 6.21.0 ([3724850](https://github.com/privacy-scaling-explorations/maci/commit/3724850a5bed27114a84f258b643467e1087b6b9))
* **deps-dev:** bump conventional-changelog-conventionalcommits ([5ded61d](https://github.com/privacy-scaling-explorations/maci/commit/5ded61d4f37976848aa1c60bb5290bf0bf8531cf))
* **deps-dev:** bump eslint from 8.55.0 to 8.56.0 ([f6269e7](https://github.com/privacy-scaling-explorations/maci/commit/f6269e78460086bcf23a73f12e0e3200695cca1c))
* **deps-dev:** bump eslint-plugin-import from 2.29.0 to 2.29.1 ([865eb63](https://github.com/privacy-scaling-explorations/maci/commit/865eb6321b54d4d033a09c9ef97ab194b59382b3))
* **deps-dev:** bump eslint-plugin-prettier from 5.0.1 to 5.1.3 ([1de434e](https://github.com/privacy-scaling-explorations/maci/commit/1de434ea3db4fb1529a3d76f903be57468797db3))
* **deps-dev:** bump eslint-plugin-unused-imports from 3.0.0 to 3.1.0 ([7231e08](https://github.com/privacy-scaling-explorations/maci/commit/7231e086c27ce7abfa81d1084428c14197b1a6e2))
* **deps-dev:** bump husky from 8.0.3 to 9.0.7 ([183594c](https://github.com/privacy-scaling-explorations/maci/commit/183594c98bef18084a778688a08b2499039c54be))
* **deps-dev:** bump husky from 9.0.10 to 9.0.11 ([3fa6e68](https://github.com/privacy-scaling-explorations/maci/commit/3fa6e684f72eb957c6a527b5aa039d03c6e71c34))
* **deps-dev:** bump husky from 9.0.7 to 9.0.10 ([4751e21](https://github.com/privacy-scaling-explorations/maci/commit/4751e21d89ae20e2827814c16528e07186e6d9c8))
* **deps-dev:** bump lerna from 6.6.2 to 8.0.2 ([4b150ad](https://github.com/privacy-scaling-explorations/maci/commit/4b150ade7c4fbaf88eb0e1f629cec6749377706d))
* **deps-dev:** bump lerna from 8.0.2 to 8.1.2 ([472501c](https://github.com/privacy-scaling-explorations/maci/commit/472501c053858394195bb82d1fb36dbfc4eabd21))
* **deps-dev:** bump lint-staged from 15.2.0 to 15.2.2 ([84ce33e](https://github.com/privacy-scaling-explorations/maci/commit/84ce33e38d2d6e8901e12814da134b8e90f2a2e3))
* **deps-dev:** bump mocha from 10.2.0 to 10.3.0 ([2b76e04](https://github.com/privacy-scaling-explorations/maci/commit/2b76e0445f5da5864a335352f66eac33c070ab29))
* **deps-dev:** bump prettier from 3.1.0 to 3.1.1 ([5d3e8e7](https://github.com/privacy-scaling-explorations/maci/commit/5d3e8e780b4503facd43b563a2d4de058f479993))
* **deps-dev:** bump prettier from 3.1.1 to 3.2.2 ([5ece5c9](https://github.com/privacy-scaling-explorations/maci/commit/5ece5c9cb1188b2a0d6bdeff52d2713a1d92612e))
* **deps-dev:** bump prettier from 3.2.2 to 3.2.4 ([1cafebb](https://github.com/privacy-scaling-explorations/maci/commit/1cafebbae2a29b1c28e9561f7ae75ed023d8e7bd))
* **deps-dev:** bump prettier from 3.2.4 to 3.2.5 ([ab2e7e3](https://github.com/privacy-scaling-explorations/maci/commit/ab2e7e3c3c97f1fc30219ed6bc1a7c5667d32e73))
* **deps-dev:** bump prettier-plugin-solidity from 1.2.0 to 1.3.1 ([8e3089e](https://github.com/privacy-scaling-explorations/maci/commit/8e3089e2c2f8669c2fdf2a1d571b2f025500338d))
* **deps-dev:** bump solhint from 4.0.0 to 4.1.1 ([e020ae1](https://github.com/privacy-scaling-explorations/maci/commit/e020ae10f53ce5fbd41b1d83f81097247d331b10))
* **deps-dev:** bump typedoc from 0.25.4 to 0.25.7 ([1b51ef1](https://github.com/privacy-scaling-explorations/maci/commit/1b51ef14935b7c5a60b3ddc309efcd38f79ccd84))
* **deps-dev:** bump typedoc from 0.25.7 to 0.25.8 ([929f00c](https://github.com/privacy-scaling-explorations/maci/commit/929f00ca3621030d3bce1dc5edb131bfa4ec6247))
* **deps-dev:** bump typescript from 5.2.2 to 5.3.3 ([4ec399d](https://github.com/privacy-scaling-explorations/maci/commit/4ec399dd6e984c12ebd24d0b20c14c1104872500))
* **deps:** bump @commander-js/extra-typings from 11.1.0 to 12.0.0 ([8688daa](https://github.com/privacy-scaling-explorations/maci/commit/8688daadb2cd2f863bbee718e30cf8d9e8c9b110))
* **deps:** bump @docusaurus/preset-classic from 3.1.0 to 3.1.1 ([35e1954](https://github.com/privacy-scaling-explorations/maci/commit/35e1954b810e4185d2f370b51efed4273ee7811b))
* **deps:** bump @docusaurus/theme-classic from 3.0.0 to 3.1.0 ([9ff0c26](https://github.com/privacy-scaling-explorations/maci/commit/9ff0c26904ede3dfea76652d7072369e583d5175))
* **deps:** bump @docusaurus/theme-classic from 3.1.0 to 3.1.1 ([049bb10](https://github.com/privacy-scaling-explorations/maci/commit/049bb103a0f2cc288dbff29ccf64768dedb7705a))
* **deps:** bump @easyops-cn/docusaurus-search-local ([ae6cd48](https://github.com/privacy-scaling-explorations/maci/commit/ae6cd489d55634b8415ade080ec73abbc9d747a1))
* **deps:** bump @mdx-js/react from 3.0.0 to 3.0.1 ([69990ab](https://github.com/privacy-scaling-explorations/maci/commit/69990abe87f21f85d643fa7bf649a1486903928c))
* **deps:** bump @zk-kit/poseidon-cipher from 0.1.1 to 0.2.1 ([7fb1d67](https://github.com/privacy-scaling-explorations/maci/commit/7fb1d671d48d5dd364d39eff752ce0f2f9b67d26))
* **deps:** bump actions/setup-node from 3 to 4 ([f358085](https://github.com/privacy-scaling-explorations/maci/commit/f35808528611bf4e36db593d97eb643b3d542184))
* **deps:** bump circomkit from 0.0.21 to 0.0.22 ([1c4e405](https://github.com/privacy-scaling-explorations/maci/commit/1c4e4051920e84df88a28b1ed908ee8e6d3266b8))
* **deps:** bump circomkit from 0.0.22 to 0.0.24 ([2ff4d38](https://github.com/privacy-scaling-explorations/maci/commit/2ff4d380d6601e363abd2435d59ac150ca2c190f))
* **deps:** bump clsx from 1.2.1 to 2.1.0 ([6e625b3](https://github.com/privacy-scaling-explorations/maci/commit/6e625b3c67a1899d73aa5dc23a3b4d8d0e91f316))
* **deps:** bump commander from 11.1.0 to 12.0.0 ([72b1a2e](https://github.com/privacy-scaling-explorations/maci/commit/72b1a2e672d4808d3b2c7a3ad13e92b7db0811c8))
* **deps:** bump crytic/slither-action from 0.3.0 to 0.3.1 ([847c259](https://github.com/privacy-scaling-explorations/maci/commit/847c25989c8ad7f8967305fc7b4633ab06130da0))
* **deps:** bump docusaurus-plugin-image-zoom from 1.0.1 to 2.0.0 ([2fa993c](https://github.com/privacy-scaling-explorations/maci/commit/2fa993c86a56cd97b8700fc8c6aca3a20598cfb0))
* **deps:** bump dotenv from 16.3.1 to 16.3.2 ([845becc](https://github.com/privacy-scaling-explorations/maci/commit/845becc8508d841b01430eb56379f828687b840b))
* **deps:** bump dotenv from 16.3.2 to 16.4.1 ([2430c50](https://github.com/privacy-scaling-explorations/maci/commit/2430c50ba5625f87f632f302c420a7fd10f5467a))
* **deps:** bump dotenv from 16.4.1 to 16.4.2 ([8431e74](https://github.com/privacy-scaling-explorations/maci/commit/8431e74c22099dcd7201e7005dbc25bc03c9e65c))
* **deps:** bump dotenv from 16.4.2 to 16.4.4 ([472c616](https://github.com/privacy-scaling-explorations/maci/commit/472c616570c427f508f3854e1cd357ceed4a8e1a))
* **deps:** bump ethers from 6.10.0 to 6.11.0 ([815696d](https://github.com/privacy-scaling-explorations/maci/commit/815696de4268c41e466ab6794215807a38906938))
* **deps:** bump ethers from 6.11.0 to 6.11.1 ([a01f434](https://github.com/privacy-scaling-explorations/maci/commit/a01f434451a377447052518236a23ad3c9051d17))
* **deps:** bump ethers from 6.9.2 to 6.10.0 ([dd8b4a0](https://github.com/privacy-scaling-explorations/maci/commit/dd8b4a048c013f28be175cc0db17fe5fc45d5976))
* **deps:** bump github/codeql-action from 2 to 3 ([e06e5ec](https://github.com/privacy-scaling-explorations/maci/commit/e06e5ec49e345b52deb46f71fe57453c98c68fe8))
* **deps:** bump hardhat from 2.19.4 to 2.19.5 ([40ab10d](https://github.com/privacy-scaling-explorations/maci/commit/40ab10defff0a538aefa81d67fd6ce04b69f5eb6))
* **deps:** bump hardhat from 2.19.5 to 2.20.1 ([68543a6](https://github.com/privacy-scaling-explorations/maci/commit/68543a6886b2836c42fd18b77f9e98f322fb971e))
* **deps:** bump pnpm/action-setup from 2 to 3 ([859cb7c](https://github.com/privacy-scaling-explorations/maci/commit/859cb7c9ed7a783f9122569583fa95f83645aa84))
* **deps:** bump snarkjs from 0.7.2 to 0.7.3 ([cf95b6f](https://github.com/privacy-scaling-explorations/maci/commit/cf95b6ff6f66342e3b75dedd5c70d62f8f0816b1))
* **deps:** remove circomlib and add big-integer ([50eff2f](https://github.com/privacy-scaling-explorations/maci/commit/50eff2f6a8e009c19eab50b3b3e15b779d63f8f3))
* **deps:** update circomkit to latest version and add console logs ([9f7ec50](https://github.com/privacy-scaling-explorations/maci/commit/9f7ec50dadcfb1a27bccb845f1552a2af2b8b1f2))
* **domainobjs:** apply linter rules and fixes ([6649ca6](https://github.com/privacy-scaling-explorations/maci/commit/6649ca6d2afc83cfec60008fa6314add1cd837cd))
* **domainobjs:** implement unit tests for the domainobjs package ([c19d1d3](https://github.com/privacy-scaling-explorations/maci/commit/c19d1d3b6652d306e5ae7f4083eb20c4832c1233))
* enable codeql and workflows cleanup ([37a735c](https://github.com/privacy-scaling-explorations/maci/commit/37a735c349eeb1f7fc13fd8930041967a4813b11))
* fix description of circuit parameter ([26b08eb](https://github.com/privacy-scaling-explorations/maci/commit/26b08eba98394f97f054163a6d4d91bbd0595f44))
* fix emojis ([65bd610](https://github.com/privacy-scaling-explorations/maci/commit/65bd610ee4e8a1a9caf75fa586d29c854dc65d66))
* fix grammar ([075ce47](https://github.com/privacy-scaling-explorations/maci/commit/075ce47011209271cf9ab4b64ec2ba36409ec26a))
* fix markdown syntax in README.md ([4540f22](https://github.com/privacy-scaling-explorations/maci/commit/4540f227139e72061085bcdf9bdfd48bc7c57c2a))
* fix typo ([60f66ad](https://github.com/privacy-scaling-explorations/maci/commit/60f66ad70f698ebe3ce18e7907889929076fbbc2))
* fix typos and remove redundant introductions ([99d1e91](https://github.com/privacy-scaling-explorations/maci/commit/99d1e9174d38192f8b525fd0aeae1f87a72de560))
* fix word repetition ([92d7174](https://github.com/privacy-scaling-explorations/maci/commit/92d717496bc94d23d1d631e637a7fff1756d2352))
* **git hooks:** add commit-msg and pre-commit hooks to package.json ([1da19d8](https://github.com/privacy-scaling-explorations/maci/commit/1da19d8beeb37b27be789c84c98e418f369a8af6))
* ignore dependabot commit messages for linting ([3e79ddf](https://github.com/privacy-scaling-explorations/maci/commit/3e79ddffd3a18a87f637d54dcef2e19580577de8))
* **integration:** clarify integraration docs ([09edffd](https://github.com/privacy-scaling-explorations/maci/commit/09edffd7e6c2f58c1242dd92fb0bbd681444b937))
* **integration:** ensure integration tests are using the correct user keys ([5b6aa92](https://github.com/privacy-scaling-explorations/maci/commit/5b6aa9255907cd0e02f692ad7d8487f9bd9a70f3))
* **intergationTests:** apply linter for intergration tests package ([ef75ec3](https://github.com/privacy-scaling-explorations/maci/commit/ef75ec37b2b4e000ad4b3fcdbdf85ba822690512))
* keep footer links consistent on hover ([35da4c9](https://github.com/privacy-scaling-explorations/maci/commit/35da4c941d17a4c53f51e3ebac862785a0279c6c))
* **key-change:** add tests and docs around key-change ([ce394e2](https://github.com/privacy-scaling-explorations/maci/commit/ce394e2d2bf3c8c6748cf8e8d1e401b8f3c924ee))
* linter ([42ea4f0](https://github.com/privacy-scaling-explorations/maci/commit/42ea4f0ae8b342f6bd5ca5ac86f1bdd143978324))
* linter unification ([61a8bcd](https://github.com/privacy-scaling-explorations/maci/commit/61a8bcd915fd3e4b4da3c00d40704d892c02f51b))
* **maci-cli:** check hardhat config file ([3a6ac6b](https://github.com/privacy-scaling-explorations/maci/commit/3a6ac6b41b759edff67533c0b665777329d63735))
* **maci:** added audit report and amended Contract's README ([0c6d28b](https://github.com/privacy-scaling-explorations/maci/commit/0c6d28b66091609a3cf62b1a0faa08e87b5c82aa))
* **maci:** added README for the circuit package and fixed typo in contract's README ([4d0f74b](https://github.com/privacy-scaling-explorations/maci/commit/4d0f74b8480cd2d20e835d43b33c2aab6578d194))
* **maci:** amended and added new sections in the docs ([d9780fa](https://github.com/privacy-scaling-explorations/maci/commit/d9780fabed10e9d97bb72cf6d118e061b83157b9)), closes [#531](https://github.com/privacy-scaling-explorations/maci/issues/531)
* **maci:** updated docs after review ([fd0da34](https://github.com/privacy-scaling-explorations/maci/commit/fd0da346406a5c2c6648bbff1b081863039bcf2b)), closes [#531](https://github.com/privacy-scaling-explorations/maci/issues/531) [#556](https://github.com/privacy-scaling-explorations/maci/issues/556)
* migrate to husky v9 ([6dc83de](https://github.com/privacy-scaling-explorations/maci/commit/6dc83de1d3701883966091df9dd3b486823aaf4c))
* minor updates to roadmap page ([6a8ada8](https://github.com/privacy-scaling-explorations/maci/commit/6a8ada85a2a9486926bd8dbbb56e33f476b5d8de))
* minor updates to roadmap page ([046b922](https://github.com/privacy-scaling-explorations/maci/commit/046b92257027591978e56c472d0b2d11fc76d67a))
* **non-qv:** update docs to reflect the integration of non-quadratic voting ([35ff781](https://github.com/privacy-scaling-explorations/maci/commit/35ff7818dc62152a0b2d7449bebc8990dae7f0d4))
* **poll:** unify pollId type ([21d01ef](https://github.com/privacy-scaling-explorations/maci/commit/21d01efc565df74ea8b71dfeeead60be5a07db56))
* **publish:** fix publishing scripts to publish contracts with ceremony params ([f27af1c](https://github.com/privacy-scaling-explorations/maci/commit/f27af1cbea7070848686fdbebb234bce47a180c8)), closes [#973](https://github.com/privacy-scaling-explorations/maci/issues/973)
* **publishing:** remove bash script for empty ballot roots contract ([025287c](https://github.com/privacy-scaling-explorations/maci/commit/025287c778547e0acb1582532f3412e022cca6fa))
* rebased with the dev branch ([8165968](https://github.com/privacy-scaling-explorations/maci/commit/8165968fb18aa599a30c2f4ba48553cf65a16980))
* refer md files to contributing docs ([21c2fe4](https://github.com/privacy-scaling-explorations/maci/commit/21c2fe4a01f0ff699eed7088b403b3c00c9903ab))
* refer README links to website docs ([c3ce015](https://github.com/privacy-scaling-explorations/maci/commit/c3ce0154749a2b72bffd89255910777b45f6a685))
* **release:** publish 1.1.2 ([10b3a85](https://github.com/privacy-scaling-explorations/maci/commit/10b3a85cc9b53c0fc1ccdf54221a48ec8d6efe0d))
* remove `gitHead` field from package.json ([d38ba71](https://github.com/privacy-scaling-explorations/maci/commit/d38ba71301469f350b3d80eab5bf94e779dda9cc))
* remove 2023 section ([38a9507](https://github.com/privacy-scaling-explorations/maci/commit/38a9507500a4d9e6e9d72c01e734136053b1880c))
* remove placeholder post ([71fd332](https://github.com/privacy-scaling-explorations/maci/commit/71fd332e5844797feda1ed734273cfa4a5fbd4d2))
* remove QFI ([db1d931](https://github.com/privacy-scaling-explorations/maci/commit/db1d931062bd1ce5305eeb850608533565bcad7c))
* remove resource requirements ([62f9b89](https://github.com/privacy-scaling-explorations/maci/commit/62f9b89c772e1f46e53f271b8a36e92f54d92014))
* remove TOC line ([83d8d56](https://github.com/privacy-scaling-explorations/maci/commit/83d8d56d712864d62afe3cc93b964f52398e7f7e))
* rename file to testing-in-detail ([cf7fdf9](https://github.com/privacy-scaling-explorations/maci/commit/cf7fdf9d528358ebceb50fce0281f1b4d1bd4fa5))
* rename page to "Overview" ([5c98942](https://github.com/privacy-scaling-explorations/maci/commit/5c989424842fcabd5d3ae54ce0d4a3035a63789d))
* **repo:** rebase master into dev and amend CI ([0d7b99c](https://github.com/privacy-scaling-explorations/maci/commit/0d7b99c00cde64a7f49b92fcd3b9e3ff1320e29b))
* run prettier ([d09cd0e](https://github.com/privacy-scaling-explorations/maci/commit/d09cd0e01ac747245307ceec5343d9ed30d7a6f0))
* run prettier fix after bumping version ([e1f85a5](https://github.com/privacy-scaling-explorations/maci/commit/e1f85a53bbb72696b6998af5406748fd18df4701))
* set format for CHANGELOG ([3ad82e5](https://github.com/privacy-scaling-explorations/maci/commit/3ad82e54e160569b7879f14c180bb8db482e939c))
* **testing:** revisit testing docs and add more in detail info ([183c1d8](https://github.com/privacy-scaling-explorations/maci/commit/183c1d8361bdf3a192a212ef610ae7855c96c587))
* **topup:** implement test cases for the topup feature ([7775a8b](https://github.com/privacy-scaling-explorations/maci/commit/7775a8b3295f29b098446d3e78a4200c03c847dd))
* tweak secure feature copy ([e259bef](https://github.com/privacy-scaling-explorations/maci/commit/e259befbbbd75296b4800bea85fd789659347e29))
* update /release page to /versioning ([7e662fc](https://github.com/privacy-scaling-explorations/maci/commit/7e662fc843b6fd6beacd3af4e27e90010c797b83))
* update blog slugs to kebab case ([afa6329](https://github.com/privacy-scaling-explorations/maci/commit/afa632940b8504ab8a42da3f852a19789522c8d6))
* update blog slugs to kebab case ([ad914a1](https://github.com/privacy-scaling-explorations/maci/commit/ad914a124d02d08a1d8e7ba86d3b4b192824c0ad))
* update circomlib dependency format in package.json ([f0e8d19](https://github.com/privacy-scaling-explorations/maci/commit/f0e8d1978db6a0771d876b828843bc763e397220))
* update docs ([d33e7e6](https://github.com/privacy-scaling-explorations/maci/commit/d33e7e6bc833907bec1d5575ec4f46656011028c))
* update GH template links ([917d092](https://github.com/privacy-scaling-explorations/maci/commit/917d09219fe869fb1739d932b1d31db20c3084d0))
* update headers for testing page ([dd99e55](https://github.com/privacy-scaling-explorations/maci/commit/dd99e55dcdacfb4b69c21b938736897bd8e9cc3e))
* update homepage copy ([2f2439b](https://github.com/privacy-scaling-explorations/maci/commit/2f2439baa7087add03b28b37bf0ca18091395b38))
* update into page ([38752b9](https://github.com/privacy-scaling-explorations/maci/commit/38752b991415da12043d2c4140838b8abf8d88f4))
* update intro with Discord link ([f3881fd](https://github.com/privacy-scaling-explorations/maci/commit/f3881fd40f333283f0bea3c70fa403c6fd31f2c1))
* update main README.md ([596705c](https://github.com/privacy-scaling-explorations/maci/commit/596705c5aef223ed44c8920676d2f69aa47a5352))
* update missing docusaurus deps ([a3a1fbf](https://github.com/privacy-scaling-explorations/maci/commit/a3a1fbfab0c9d410e8d13f64bce3dec820c6a406))
* update overview page ([f1682b2](https://github.com/privacy-scaling-explorations/maci/commit/f1682b2a0abc50941fceb5af6df64de221fb156a))
* update PR template ([4dd95f2](https://github.com/privacy-scaling-explorations/maci/commit/4dd95f2f59ec44a0ab2290aa3bfe753ee0e4dff5))
* update ptauFiles URLs ([b11b56a](https://github.com/privacy-scaling-explorations/maci/commit/b11b56ae09d78ef89443b094adad5b1916438ca1))
* update QF site links ([6120d89](https://github.com/privacy-scaling-explorations/maci/commit/6120d89e94bbea732e306aacac972d9e2907e77d))
* update README with build guide for MACI circuits ([77fdb63](https://github.com/privacy-scaling-explorations/maci/commit/77fdb63c9993612117505bc8319555321bf8b9d0))
* update README.md to reflect current status ([14ac799](https://github.com/privacy-scaling-explorations/maci/commit/14ac7994aa7148cff9fdb9b9cd36ecac93290cda))
* update sidebar_position of docs ([93a6faf](https://github.com/privacy-scaling-explorations/maci/commit/93a6fafdd7e483937a55d16e6cc99dd6e8aae4a2))
* update sidebar_position of docs ([63be592](https://github.com/privacy-scaling-explorations/maci/commit/63be5928ee47dc53af9326516deabb5d8639d905))
* update testing header ([688225c](https://github.com/privacy-scaling-explorations/maci/commit/688225c0a5d783fa8b585578e4ca0662e4ad1bd1))
* update the favicon file ([1056fe7](https://github.com/privacy-scaling-explorations/maci/commit/1056fe74f7dd265e7125c8031897980b83148816))
* use pnpm instead of npx ([fbe968f](https://github.com/privacy-scaling-explorations/maci/commit/fbe968f229121cd30eb5a58f187b813b955a8e1b))
* **website/versioned_docs/version-v1.x:** typo fix ([#893](https://github.com/privacy-scaling-explorations/maci/issues/893)) ([c90466c](https://github.com/privacy-scaling-explorations/maci/commit/c90466c1cac756fc3aa711874cd7d63d1b8ada73))
* **website:** apply linter for website and remove unused packages ([1a3b343](https://github.com/privacy-scaling-explorations/maci/commit/1a3b343948f9f48ed4948a5ade63b4b55645f4ab))

## [0.9.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.9.3...v0.9.4) (2021-07-08)

## [0.9.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.9.2...v0.9.3) (2021-07-08)

## [0.9.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.9.1...v0.9.2) (2021-07-06)

## [0.9.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.8.4...v0.9.1) (2021-07-05)

## [0.8.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.8.3...v0.8.4) (2021-05-28)

## [0.8.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.8.1...v0.8.3) (2021-05-28)

## [0.8.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.7.4...v0.8.1) (2021-05-28)

## [0.7.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.7.3...v0.7.4) (2021-05-09)

## [0.7.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.8.0...v0.7.3) (2021-05-07)

## [0.8.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.7.0...v0.8.0) (2021-04-01)

## [0.7.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.6.7...v0.7.0) (2021-03-25)

## [0.6.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.6.6...v0.6.7) (2021-03-19)

## [0.6.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.6.3...v0.6.6) (2021-03-19)

## [0.6.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.6.1...v0.6.3) (2021-03-19)

## [0.6.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.6.0...v0.6.1) (2021-03-18)

## [0.6.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.16...v0.6.0) (2021-03-18)

## [0.5.16](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.15...v0.5.16) (2021-03-03)

## [0.5.15](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.14...v0.5.15) (2021-03-03)

## [0.5.14](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.13...v0.5.14) (2021-03-03)

## [0.5.13](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.12...v0.5.13) (2021-03-02)

## [0.5.12](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.11...v0.5.12) (2021-03-02)

## [0.5.11](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.10...v0.5.11) (2021-03-01)

## [0.5.10](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.9...v0.5.10) (2021-02-22)

## [0.5.9](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.8...v0.5.9) (2021-02-22)

## [0.5.8](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.7...v0.5.8) (2021-02-22)

## [0.5.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.6...v0.5.7) (2021-02-06)

## [0.5.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.5...v0.5.6) (2021-02-05)

## [0.5.5](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.4...v0.5.5) (2021-01-22)

## [0.5.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.3...v0.5.4) (2021-01-20)

## [0.5.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.2...v0.5.3) (2021-01-19)

## [0.5.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.1...v0.5.2) (2021-01-19)

## [0.5.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.5.0...v0.5.1) (2021-01-19)

## [0.5.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.11...v0.5.0) (2021-01-19)

## [0.4.11](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.10...v0.4.11) (2020-11-16)

## [0.4.10](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.9...v0.4.10) (2020-11-15)

## [0.4.9](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.8...v0.4.9) (2020-11-15)

## [0.4.8](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.7...v0.4.8) (2020-11-14)

## [0.4.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.6...v0.4.7) (2020-11-14)

## [0.4.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.5...v0.4.6) (2020-11-14)

## [0.4.5](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.4...v0.4.5) (2020-11-14)

## [0.4.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.3...v0.4.4) (2020-11-14)

## [0.4.3](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.2...v0.4.3) (2020-11-14)

## [0.4.2](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.1...v0.4.2) (2020-11-14)

## [0.4.1](https://github.com/privacy-scaling-explorations/maci/compare/v0.4.0...v0.4.1) (2020-11-14)

## [0.4.0](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.8...v0.4.0) (2020-11-14)

## [0.3.8](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.7...v0.3.8) (2020-10-18)

## [0.3.7](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.6...v0.3.7) (2020-10-18)

## [0.3.6](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.5...v0.3.6) (2020-10-18)

## [0.3.5](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.4...v0.3.5) (2020-10-18)

## [0.3.4](https://github.com/privacy-scaling-explorations/maci/compare/v0.3.2...v0.3.4) (2020-10-12)



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
