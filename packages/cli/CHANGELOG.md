# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.3.0...v2.4.0) (2024-09-30)


### Features

* **scripts:** added merkleproof gatekeeper to signup script and utils ([#1823](https://github.com/privacy-scaling-explorations/maci/issues/1823)) ([f5d7e6d](https://github.com/privacy-scaling-explorations/maci/commit/f5d7e6df2aab2dc264235264a9593282054bdfa2))


### Bug Fixes

* ensure nightly workflow use correct paths ([#1814](https://github.com/privacy-scaling-explorations/maci/issues/1814)) ([e0c81ac](https://github.com/privacy-scaling-explorations/maci/commit/e0c81ac310fdceb35b6a18c390751164444dc28b))


### Miscellaneous

* **deps-dev:** bump @types/mocha from 10.0.7 to 10.0.8 ([#1827](https://github.com/privacy-scaling-explorations/maci/issues/1827)) ([4deae8b](https://github.com/privacy-scaling-explorations/maci/commit/4deae8bb3a4ea5cf1b4ad16018186a593142adb8))
* **deps-dev:** bump @types/prompt from 1.1.8 to 1.1.9 ([#1826](https://github.com/privacy-scaling-explorations/maci/issues/1826)) ([52bf4b6](https://github.com/privacy-scaling-explorations/maci/commit/52bf4b60d8a34201f2acc2e2283144eb2a584abe))



## [2.3.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.1...v2.3.0) (2024-09-05)


### Miscellaneous

* **ceremony:** update ceremony tests to work with v2 params and keys ([#1807](https://github.com/privacy-scaling-explorations/maci/issues/1807)) ([6bf1ffb](https://github.com/privacy-scaling-explorations/maci/commit/6bf1ffb42e4537dba52fb25b1fc7e370e9a39d76))
* get poll mode within sdk ([#1800](https://github.com/privacy-scaling-explorations/maci/issues/1800)) ([71545c1](https://github.com/privacy-scaling-explorations/maci/commit/71545c1ceb3b082c812081639eb2c0c15a58113f))



## [2.2.1](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.0...v2.2.1) (2024-08-19)

**Note:** Version bump only for package maci-cli





## [2.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.1.0...v2.2.0) (2024-08-19)


### Features

* return voice credits on signup ([d1b7e3d](https://github.com/privacy-scaling-explorations/maci/commit/d1b7e3ddbfa7fdef33a3badd09e259d83eebd55b))


### Miscellaneous

* **deps-dev:** bump @types/node from 22.1.0 to 22.2.0 ([ac18985](https://github.com/privacy-scaling-explorations/maci/commit/ac189852bf6abb787736c474ad87927afaa5163c))
* **deps-dev:** bump @types/node from 22.2.0 to 22.4.1 ([#1779](https://github.com/privacy-scaling-explorations/maci/issues/1779)) ([4a929e0](https://github.com/privacy-scaling-explorations/maci/commit/4a929e0b9a5c4de5ac0345e742668a3400798867))
* **deps-dev:** bump mocha from 10.7.0 to 10.7.3 ([6ba908f](https://github.com/privacy-scaling-explorations/maci/commit/6ba908f5f78628aa6afe973b3d71ae54ff08c735))
* **deps:** bump hardhat from 2.22.7 to 2.22.8 ([#1755](https://github.com/privacy-scaling-explorations/maci/issues/1755)) ([92b30af](https://github.com/privacy-scaling-explorations/maci/commit/92b30af1c18f8261235c26f61de6004287107351))



## [2.1.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.0.0...v2.1.0) (2024-08-07)


### Features

* **sdk:** get hats gatekeeper data ([a06fa6b](https://github.com/privacy-scaling-explorations/maci/commit/a06fa6b9a400192ea96c98441ba489f4c23e56e6))



## [2.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.2.0...v2.0.0) (2024-08-06)


### ⚠ BREAKING CHANGES

* **topup:** No more topups

### Features

* add extractVkToFile function to cli command ([346ebee](https://github.com/privacy-scaling-explorations/maci/commit/346ebee25b0cc624bccfc0f06f9f5a6c05b0e00c))
* **cli:** add export from contracts, circuits for cli package ([8f90c79](https://github.com/privacy-scaling-explorations/maci/commit/8f90c7952444b3dbd209310229bad05d6f02a9fc))
* **cli:** add initial voice credits from signup event ([0900e69](https://github.com/privacy-scaling-explorations/maci/commit/0900e69fb5bde930cab760e7a4ec150e61f1af17))
* **cli:** add provider fallback for poll data sdk method ([580b92e](https://github.com/privacy-scaling-explorations/maci/commit/580b92e27050c16e61a133207ccc419b64f34a26))
* **cli:** add publish batch method for cli sdk ([843fe7e](https://github.com/privacy-scaling-explorations/maci/commit/843fe7e764c55201b21520981185fa925e473835))
* **cli:** add sdk command to get eas gatekeeper data ([#1701](https://github.com/privacy-scaling-explorations/maci/issues/1701)) ([bd894d8](https://github.com/privacy-scaling-explorations/maci/commit/bd894d8378413d54f878b2b076cdbf16e498f012))
* **cli:** add start block for signup event parsing ([9657b6e](https://github.com/privacy-scaling-explorations/maci/commit/9657b6e47eb47cdfb7bfb076893d473f5a99fd52))
* **cli:** return additional data from publish batch command ([7271d5f](https://github.com/privacy-scaling-explorations/maci/commit/7271d5ff76d6957e460a84b152af54f92f7ec0a6))
* **contracts:** add new adapter for lowdb to support browser env ([a3c2371](https://github.com/privacy-scaling-explorations/maci/commit/a3c23719f22ae2dd54e21805aa478041517adbce))
* **contracts:** added message processor and tally addresses to the maci contract ([#1715](https://github.com/privacy-scaling-explorations/maci/issues/1715)) ([801b774](https://github.com/privacy-scaling-explorations/maci/commit/801b7747852a63885ed8d6ae43d81260dab9c76f))
* **contracts:** tally qv and non-qv optimisations ([b0b7b38](https://github.com/privacy-scaling-explorations/maci/commit/b0b7b38bf008e8a542b550c75ada40ac21854944))
* **contract:** support qv and non-qv verification keys ([a0cce8c](https://github.com/privacy-scaling-explorations/maci/commit/a0cce8c52950b2232c5cd47e98825ce401aac002))
* export extractVkToFile function ([e65ca2e](https://github.com/privacy-scaling-explorations/maci/commit/e65ca2ebe65094eec477ef796887b2b3fc7dd9dd))
* export merge function and modify package version ([#1584](https://github.com/privacy-scaling-explorations/maci/issues/1584)) ([f6ae34a](https://github.com/privacy-scaling-explorations/maci/commit/f6ae34a3f9ea375cd5dac8f0ce8618e33509f8ad))
* export pubkey and update description of deployment ([c782d24](https://github.com/privacy-scaling-explorations/maci/commit/c782d2496b2ddd1c8d12c1bd31b2ea948a364fdf))
* **multiple-polls:** allow concurrent polls ([14e89ba](https://github.com/privacy-scaling-explorations/maci/commit/14e89baea1ede9bc9bad79fafb5c362d6a6a81e9))
* **sdk:** add function to get zupass gatekeeper data ([#1649](https://github.com/privacy-scaling-explorations/maci/issues/1649)) ([49794ab](https://github.com/privacy-scaling-explorations/maci/commit/49794ab9e195f353e1df6c281e1159f0968bd95a))
* support deployment without hardhat ([dab5e2b](https://github.com/privacy-scaling-explorations/maci/commit/dab5e2b0c05f00d4ede53b67ea118d05a952c5c3))
* use mode instead of flag for voting option ([34421de](https://github.com/privacy-scaling-explorations/maci/commit/34421deb4da54da732cd34d868e76e04a5eea501))


### Bug Fixes

* add coordinator public key hash public input ([9766bbf](https://github.com/privacy-scaling-explorations/maci/commit/9766bbfcecd41bd0f39c1422978d959705b1b500))
* add uq argument in cli/index ([6a0dd44](https://github.com/privacy-scaling-explorations/maci/commit/6a0dd443ba5e678e6d76140db8cfc3a4e25b60a0))
* avoid export prompt in cli/sdk ([#1591](https://github.com/privacy-scaling-explorations/maci/issues/1591)) ([8479dd7](https://github.com/privacy-scaling-explorations/maci/commit/8479dd790e7d130d423a04831521a62fdc2fc058))
* **cli-signup:** added comments ([6192759](https://github.com/privacy-scaling-explorations/maci/commit/6192759fd5e1c8006ab8ef9933c182e7434ffcd4))
* **cli-signup:** changed validation for the signup data and voice credit data ([a099aff](https://github.com/privacy-scaling-explorations/maci/commit/a099aff68f2e2f580c597a8e797fbf5191e31b88))
* **cli:** fix cli vkRegistry typo ([499582b](https://github.com/privacy-scaling-explorations/maci/commit/499582b836f64a238728bd38d57bc67c2c53a1b0))
* **cli:** fix vk commands flags ([#1587](https://github.com/privacy-scaling-explorations/maci/issues/1587)) ([8ab3d7d](https://github.com/privacy-scaling-explorations/maci/commit/8ab3d7d9df178939116f45e85c119ac8403b8440))
* **cli:** generate ecdh shared key only one time ([a75ccae](https://github.com/privacy-scaling-explorations/maci/commit/a75ccae86338c1d62435cec83309ae3668a906b9))
* **cli:** genLocalState '-o' arg is a string and does not need parsing ([3326d4a](https://github.com/privacy-scaling-explorations/maci/commit/3326d4ad17911e244bfa1f45b4cd005e0139de08))
* **cli:** read state index from event args ([7d7991b](https://github.com/privacy-scaling-explorations/maci/commit/7d7991b3f525e9be509987baecb3c99cf24f8c4a))
* do not import enum as type ([#1641](https://github.com/privacy-scaling-explorations/maci/issues/1641)) ([45fca46](https://github.com/privacy-scaling-explorations/maci/commit/45fca46c48fc7090fc16d47a7b29b71f248faf23))
* export typechain instead of contract ([#1590](https://github.com/privacy-scaling-explorations/maci/issues/1590)) ([4e792c4](https://github.com/privacy-scaling-explorations/maci/commit/4e792c4fad6253207422fd16764b19e24a4041fb))
* export value from utils/interfaces vs utils ([#1642](https://github.com/privacy-scaling-explorations/maci/issues/1642)) ([c0a5a52](https://github.com/privacy-scaling-explorations/maci/commit/c0a5a52e7d1c9803a7d7cd3f0de48e77991de7e4))
* **isregistered:** use a block range to fetch events ([#1514](https://github.com/privacy-scaling-explorations/maci/issues/1514)) ([2740e4c](https://github.com/privacy-scaling-explorations/maci/commit/2740e4cc795d631a780dffccbedc09f0417fda59))
* **nightly-ceremony:** fix wrong path in zkey/dat filename ([57c79be](https://github.com/privacy-scaling-explorations/maci/commit/57c79bef4126769f5af2567a27f8012971252aed))
* **nightly:** checkout tag v1.2.2 on nightly-ceremony workflow ([ef5cfd9](https://github.com/privacy-scaling-explorations/maci/commit/ef5cfd9a7e9960c5a61133508d5b934b8a1d03a5))
* **nightly:** fix issue with artifacts not found due to wrong filename ([908e377](https://github.com/privacy-scaling-explorations/maci/commit/908e377e45abbad3f450f93197ffc450cf85cf4d))
* **poll-command:** fixed poll command to support merged state root ([#1477](https://github.com/privacy-scaling-explorations/maci/issues/1477)) ([ee6a16e](https://github.com/privacy-scaling-explorations/maci/commit/ee6a16eb366b75b4ec86095467cf4f15e05e07bb))
* publish proof onchain ([e813174](https://github.com/privacy-scaling-explorations/maci/commit/e8131741b3fb5059572822c04cb61b1cbae9599d))
* remove se flag in testscript ([c13cdec](https://github.com/privacy-scaling-explorations/maci/commit/c13cdec8fb937b44fb42326c4b84178a4ff0646e))


### Code Refactoring

* **contracts:** do not return contract addresses on poll deploy ([43d5224](https://github.com/privacy-scaling-explorations/maci/commit/43d52240755a3371ff0f7e0454e6a0dad80ddce4))
* general cleanup, variables/events/functions renaming ([b5f5015](https://github.com/privacy-scaling-explorations/maci/commit/b5f50150c9c97265207d8b6fd89d92d11a4b70cf))
* **maci:** remove subsidy feature to simplify further protocol improvements ([52fc7c5](https://github.com/privacy-scaling-explorations/maci/commit/52fc7c5b8f2d389868bca6171ffd15a94b1d1659))
* **topup:** remove the topup feature ([67711d4](https://github.com/privacy-scaling-explorations/maci/commit/67711d44058831302d4556f12d1972ffacede653))


### Miscellaneous

* add @types/snarkjs package ([57bf0ed](https://github.com/privacy-scaling-explorations/maci/commit/57bf0edf4453d18c7c154ae928c30899b6996ebd))
* add doc entries for new maci version (currently being developed) ([c72a130](https://github.com/privacy-scaling-explorations/maci/commit/c72a130cf6dcd4e8e5e59b374d8a63c1cfaae8cd))
* add forking options ([2f0908b](https://github.com/privacy-scaling-explorations/maci/commit/2f0908b67c0068385fe399e67ed2d44790588a5c))
* add function to get semaphore gatekeeper details ([c877d21](https://github.com/privacy-scaling-explorations/maci/commit/c877d21b698ea884773a06455e0d6a4bff57b8b0))
* add name to gatekeepers and add sdk function ([#1639](https://github.com/privacy-scaling-explorations/maci/issues/1639)) ([30984d0](https://github.com/privacy-scaling-explorations/maci/commit/30984d0f0a2b4a5e76dd3414d008b98ae9809c01))
* add qv and non-qv key setup during deploy ([29f9e17](https://github.com/privacy-scaling-explorations/maci/commit/29f9e173e788105b420b2ec0ea4f40d423b27685))
* bump to 1.2.2 ([e63278f](https://github.com/privacy-scaling-explorations/maci/commit/e63278f71937a1fa908ec8f4be2d43114701c134))
* **ceremony:** update ceremony params tests ([b78830d](https://github.com/privacy-scaling-explorations/maci/commit/b78830d921d39952fbbca0fe7529340ee47ca59f))
* **contracts:** add typedoc script for contracts package ([43459a0](https://github.com/privacy-scaling-explorations/maci/commit/43459a02301f102e80a709a0a722dd591e8e00ef))
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
* **deps-dev:** bump nyc from 15.1.0 to 17.0.0 ([c7f4414](https://github.com/privacy-scaling-explorations/maci/commit/c7f441417d7c7ec8019867801b77e7b5c07c2307))
* **deps-dev:** bump typescript from 5.3.3 to 5.4.2 ([591c767](https://github.com/privacy-scaling-explorations/maci/commit/591c767308f746fbfc32a9f184192912895f080c))
* **deps-dev:** bump typescript from 5.4.2 to 5.4.3 ([a2f5c8a](https://github.com/privacy-scaling-explorations/maci/commit/a2f5c8ac32394fc7672051d5342baf7e6f9567ce))
* **deps-dev:** bump typescript from 5.4.3 to 5.4.4 ([5e047ea](https://github.com/privacy-scaling-explorations/maci/commit/5e047eaa96d508addf34e35764ddaf4deb221593))
* **deps-dev:** bump typescript from 5.4.4 to 5.4.5 ([ea6339d](https://github.com/privacy-scaling-explorations/maci/commit/ea6339da96dda38a931cb6d39615c9267ca45b81))
* **deps-dev:** bump typescript from 5.4.5 to 5.5.2 ([e2b4d45](https://github.com/privacy-scaling-explorations/maci/commit/e2b4d45235c82bba349d959a164442cae90ad97f))
* **deps-dev:** bump typescript from 5.5.2 to 5.5.3 ([c979188](https://github.com/privacy-scaling-explorations/maci/commit/c979188358becfc4b434a2f73331e640ce595846))
* **deps-dev:** bump typescript from 5.5.3 to 5.5.4 ([8ed2e2b](https://github.com/privacy-scaling-explorations/maci/commit/8ed2e2b109a950137dd289aa7d3eca4268079272))
* **deps:** bump @commander-js/extra-typings from 12.0.0 to 12.0.1 ([59c205c](https://github.com/privacy-scaling-explorations/maci/commit/59c205caad88d9388d35f6e6d7db357571abbaf9))
* **deps:** bump @nomicfoundation/hardhat-toolbox from 4.0.0 to 5.0.0 ([c403cb4](https://github.com/privacy-scaling-explorations/maci/commit/c403cb4b9c27e15958493a6d19555161ecef743c))
* **deps:** bump ethers from 6.11.1 to 6.12.0 ([9db5a93](https://github.com/privacy-scaling-explorations/maci/commit/9db5a93d32396d80b76e2d20d1af529e6a97292a))
* **deps:** bump ethers from 6.12.0 to 6.12.1 ([16b4615](https://github.com/privacy-scaling-explorations/maci/commit/16b46159a132abb82b4659c424a065bb418bd31e))
* **deps:** bump ethers from 6.13.0 to 6.13.1 ([b32694d](https://github.com/privacy-scaling-explorations/maci/commit/b32694da7aa60e0215daa56d2b64ed5e5f8d9d45))
* **deps:** bump ethers from 6.13.1 to 6.13.2 ([#1709](https://github.com/privacy-scaling-explorations/maci/issues/1709)) ([c9de72e](https://github.com/privacy-scaling-explorations/maci/commit/c9de72eead282027cc9dcab0edd9170a0fbe5a2e))
* **deps:** bump hardhat from 2.22.1 to 2.22.2 ([397e50b](https://github.com/privacy-scaling-explorations/maci/commit/397e50b6ded4cc81ce299747b2847254af7ea1ce))
* **deps:** bump hardhat from 2.22.3 to 2.22.4 ([481a1e7](https://github.com/privacy-scaling-explorations/maci/commit/481a1e7a83ad8984880a98aa09824b3dc689acd9))
* **deps:** bump hardhat from 2.22.5 to 2.22.6 ([6949eee](https://github.com/privacy-scaling-explorations/maci/commit/6949eee8717c16c129b15c570283ea58ce39ec33))
* **deps:** bump snarkjs from 0.7.3 to 0.7.4 ([50642af](https://github.com/privacy-scaling-explorations/maci/commit/50642afa368a91c47ebe32089f4bdb4a159ac1cd))
* **docs:** fixed broken links ([#1585](https://github.com/privacy-scaling-explorations/maci/issues/1585)) ([4b2012e](https://github.com/privacy-scaling-explorations/maci/commit/4b2012eb3827611e8a7fb0d441e6fd1da8df478e))
* fix typos ([96ae030](https://github.com/privacy-scaling-explorations/maci/commit/96ae030bfe10b0fb94e1304cd017f8775cd58b1d))
* **genlocalstate:** add start block calculation on genLocalState cli command ([615dee4](https://github.com/privacy-scaling-explorations/maci/commit/615dee4012faa3524de1f04d38ea37ee8d113f73))
* **keys:** update maci keys in docs and scripts ([403262f](https://github.com/privacy-scaling-explorations/maci/commit/403262f3941a2b4e41b9cc05cc8dc340ebe5e759))
* optimize message processor and tally ([d75b244](https://github.com/privacy-scaling-explorations/maci/commit/d75b2446c2ee012d146afe8d7bc423f5b94e4579))
* **release:** publish 1.2.1 ([93564f8](https://github.com/privacy-scaling-explorations/maci/commit/93564f8a98baa0fee65db16e2e40209d9ac1b3ae))
* **release:** publish 2.0.0 ([04e647d](https://github.com/privacy-scaling-explorations/maci/commit/04e647d231df34952569ad6ff802e0b2333eb658))
* remove duplicate words ([f138abe](https://github.com/privacy-scaling-explorations/maci/commit/f138abe87bb19219a8355aa34a484be8a16637a5))
* remove max values ([8f951b0](https://github.com/privacy-scaling-explorations/maci/commit/8f951b0fcc73212d99d3ddc962fbaa9788471fb6))
* **signup:** fix flaky test ([#1582](https://github.com/privacy-scaling-explorations/maci/issues/1582)) ([69663ea](https://github.com/privacy-scaling-explorations/maci/commit/69663ea7f81b418ceb0034662296367297e85f0a))
* unify maci address arguments ([dfc5fd2](https://github.com/privacy-scaling-explorations/maci/commit/dfc5fd2050f60e869c940d656ed66c895dc23fe5))
* update hardhat to 2.21.1 ([ba6e236](https://github.com/privacy-scaling-explorations/maci/commit/ba6e236be14ff9b29126e887c9d552bc207e7467))
* use async fs instead of sync version ([fb8317e](https://github.com/privacy-scaling-explorations/maci/commit/fb8317ef3943a8434083de6e1b0f9469f15dd113))
* use non-zero start and end blocks for proof generation ([59887e7](https://github.com/privacy-scaling-explorations/maci/commit/59887e760fb1bc8741ee9322ea90305334df280d))
* **zkeys:** use ts to download zkey artifacts and simplify repo ([d364f24](https://github.com/privacy-scaling-explorations/maci/commit/d364f24c074a860744d10ed62eae73c58f8c3250))



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
