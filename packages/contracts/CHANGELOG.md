# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.4.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.3.0...v2.4.0) (2024-09-30)


### Features

* **contracts:** add virtual modifiers for poll ([0c4806f](https://github.com/privacy-scaling-explorations/maci/commit/0c4806f18fe2f3f3bf44233799a7d127a88dd9c1))
* **merkleroot-gatekeeper:** added deploy scripts and config ([#1822](https://github.com/privacy-scaling-explorations/maci/issues/1822)) ([0a55bbc](https://github.com/privacy-scaling-explorations/maci/commit/0a55bbc38e690d876cf920709f13e973dd844267))
* **merkleroot-gatekeeper:** adds a gatekeeper that uses merkle tree ([#1821](https://github.com/privacy-scaling-explorations/maci/issues/1821)) ([1cce59a](https://github.com/privacy-scaling-explorations/maci/commit/1cce59ab1eb8aafd37a374a8eb70cff77a07e99c))


### Bug Fixes

* **deploy-maci:** sets the maci instance of any gatekeeper ([4d5ae24](https://github.com/privacy-scaling-explorations/maci/commit/4d5ae24c8401f21d8c2fed82ca3599963c5e1301))
* **zupass-gatekeeper:** event id was stored at the wrong index ([#1836](https://github.com/privacy-scaling-explorations/maci/issues/1836)) ([d5bc146](https://github.com/privacy-scaling-explorations/maci/commit/d5bc146d67dde8bb8a20c6799024a4d3da08d1fc))


### Miscellaneous

* **deps-dev:** bump @types/mocha from 10.0.7 to 10.0.8 ([#1827](https://github.com/privacy-scaling-explorations/maci/issues/1827)) ([4deae8b](https://github.com/privacy-scaling-explorations/maci/commit/4deae8bb3a4ea5cf1b4ad16018186a593142adb8))



## [2.3.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.1...v2.3.0) (2024-09-05)


### Features

* **contracts:** make poll modifiers virtual ([b4af027](https://github.com/privacy-scaling-explorations/maci/commit/b4af027ca8bc14ecd849030559c9d1129b475264))


### Bug Fixes

* do not cleanup thread all the time while doing parallel proof gen ([#1808](https://github.com/privacy-scaling-explorations/maci/issues/1808)) ([d683cb3](https://github.com/privacy-scaling-explorations/maci/commit/d683cb35e3b1fb54df05e200be85386fb7328de5))
* ensure prove task works ([#1789](https://github.com/privacy-scaling-explorations/maci/issues/1789)) ([87762e0](https://github.com/privacy-scaling-explorations/maci/commit/87762e021f279852ab3c019a720782b017af80ab))


### Miscellaneous

* added polygon and gnosis to supported networks and benchmark ([0a4ead0](https://github.com/privacy-scaling-explorations/maci/commit/0a4ead0aa9b00244206687d5a13bbdd35628c30c))
* **contracts:** extend ids for contract storage and deployment ([f711ba9](https://github.com/privacy-scaling-explorations/maci/commit/f711ba90e0cf8f45a800193ca146fda93451e8c6))
* deploy to sepolia and store contracts ([1de2d9a](https://github.com/privacy-scaling-explorations/maci/commit/1de2d9ae2bc69da694a77f3967b8425174345318))
* update message tree depth programmatically in benchmarks ([#1799](https://github.com/privacy-scaling-explorations/maci/issues/1799)) ([eb1ce58](https://github.com/privacy-scaling-explorations/maci/commit/eb1ce58d70a2d5e5cf4567d403bbd2ec57e97e2d))



## [2.2.1](https://github.com/privacy-scaling-explorations/maci/compare/v2.2.0...v2.2.1) (2024-08-19)


### Bug Fixes

* **contracts:** remove poseidon builders from exports ([8890da5](https://github.com/privacy-scaling-explorations/maci/commit/8890da549d121e1b108371ffcdb0f9a161940991))


### Miscellaneous

* **contracts:** add deploy params type ([74252cb](https://github.com/privacy-scaling-explorations/maci/commit/74252cbaa74add4a6b5c9014af7d226f88caf3c1))
* **contracts:** move poseidon creation to compile script ([1e9f790](https://github.com/privacy-scaling-explorations/maci/commit/1e9f7906ef28e1c484115c4484733c475c81f8b4))



## [2.2.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.1.0...v2.2.0) (2024-08-19)


### Features

* **contracts:** add first registry and payout extensions ([d75164b](https://github.com/privacy-scaling-explorations/maci/commit/d75164b364a126e4e39c385942b65037f3ae7b9a))
* **contracts:** add virtual modifiers ([#1770](https://github.com/privacy-scaling-explorations/maci/issues/1770)) ([7b98e58](https://github.com/privacy-scaling-explorations/maci/commit/7b98e5830f4cca74d893a427c072563b98a9b766))
* **contracts:** support custom factories for maci test deployment ([156f523](https://github.com/privacy-scaling-explorations/maci/commit/156f5235def5f9a929a3ad4c6cbdc5785c1feb13))
* **hats:** add hats gatekeeper deployment steps ([2a8ac1a](https://github.com/privacy-scaling-explorations/maci/commit/2a8ac1a4d8ce12be1d1dfc133334a8d73903194e))
* **storage:** add storage path and function to get deployment args ([46b7350](https://github.com/privacy-scaling-explorations/maci/commit/46b7350cf09e1bd626f0e4bc369ed723c76ebfba))


### Bug Fixes

* use state_tree_depth for tally batch size and import from maci-core ([#1768](https://github.com/privacy-scaling-explorations/maci/issues/1768)) ([4401ae0](https://github.com/privacy-scaling-explorations/maci/commit/4401ae0755a8a00bb1312df3ffc139d419ff015e))


### Code Refactoring

* **contracts:** use custom factories for maci test deploys ([2e8fbca](https://github.com/privacy-scaling-explorations/maci/commit/2e8fbca2a6ac3bb3935dbfdee1c18831e6464f8d))


### Miscellaneous

* add enum for gatekeepers and voice credits proxy ([#1782](https://github.com/privacy-scaling-explorations/maci/issues/1782)) ([9afb27d](https://github.com/privacy-scaling-explorations/maci/commit/9afb27ddf79c2ba179754e9a55c4d3b24ecd2eb5))
* **contracts:** deploy contracts to L2s, store addresses and benchmark message batch size ([#1751](https://github.com/privacy-scaling-explorations/maci/issues/1751)) ([9e771a0](https://github.com/privacy-scaling-explorations/maci/commit/9e771a09b8f5de8c47ad89f5bb53b542aed6db05))
* **contracts:** use cwd path for contract storage and config ([a78408d](https://github.com/privacy-scaling-explorations/maci/commit/a78408dd597106a712fbc0a4dfd6451fd270bc45))
* **deps-dev:** bump @types/node from 22.1.0 to 22.2.0 ([ac18985](https://github.com/privacy-scaling-explorations/maci/commit/ac189852bf6abb787736c474ad87927afaa5163c))
* **deps-dev:** bump @types/node from 22.2.0 to 22.4.1 ([#1779](https://github.com/privacy-scaling-explorations/maci/issues/1779)) ([4a929e0](https://github.com/privacy-scaling-explorations/maci/commit/4a929e0b9a5c4de5ac0345e742668a3400798867))
* **deps:** bump hardhat from 2.22.7 to 2.22.8 ([#1755](https://github.com/privacy-scaling-explorations/maci/issues/1755)) ([92b30af](https://github.com/privacy-scaling-explorations/maci/commit/92b30af1c18f8261235c26f61de6004287107351))
* remove simple payout ([049bab7](https://github.com/privacy-scaling-explorations/maci/commit/049bab7112e4b88e47a56f32d01ab6235ebbb751))



## [2.1.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.0.0...v2.1.0) (2024-08-07)


### Bug Fixes

* contract verification for maci ([#1747](https://github.com/privacy-scaling-explorations/maci/issues/1747)) ([08a83b6](https://github.com/privacy-scaling-explorations/maci/commit/08a83b6d2749c2c5f08147eeb1184bada8c23062))
* ensure we store all constructor args for the poll contract ([#1748](https://github.com/privacy-scaling-explorations/maci/issues/1748)) ([18dbda3](https://github.com/privacy-scaling-explorations/maci/commit/18dbda319f226e0e7653307a97541e08c86ae63b))



## [2.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v1.2.0...v2.0.0) (2024-08-06)


### ⚠ BREAKING CHANGES

* **topup:** No more topups

### Features

* add signer as input for deploy contract with linked libraries ([7fbe965](https://github.com/privacy-scaling-explorations/maci/commit/7fbe96545859236613082f85cc196d7c1e4ec7fa))
* allow getContract without hardhat environment ([a2ce5e1](https://github.com/privacy-scaling-explorations/maci/commit/a2ce5e191fefee6e2d60d30f03edb2bdcd5466d3))
* **cli:** add sdk command to get eas gatekeeper data ([#1701](https://github.com/privacy-scaling-explorations/maci/issues/1701)) ([bd894d8](https://github.com/privacy-scaling-explorations/maci/commit/bd894d8378413d54f878b2b076cdbf16e498f012))
* **cli:** add start block for signup event parsing ([9657b6e](https://github.com/privacy-scaling-explorations/maci/commit/9657b6e47eb47cdfb7bfb076893d473f5a99fd52))
* **contracts:** add deployment code for SemaphoreGatekeeper ([#1588](https://github.com/privacy-scaling-explorations/maci/issues/1588)) ([149df59](https://github.com/privacy-scaling-explorations/maci/commit/149df599c52762d41b6708b762b64028fc1b1eb4))
* **contracts:** add deploySemaphoreGatekeeper() ([#1628](https://github.com/privacy-scaling-explorations/maci/issues/1628)) ([e714d5a](https://github.com/privacy-scaling-explorations/maci/commit/e714d5a8b3a2860aef510d529e3e183f1e0b4f00))
* **contracts:** add new adapter for lowdb to support browser env ([a3c2371](https://github.com/privacy-scaling-explorations/maci/commit/a3c23719f22ae2dd54e21805aa478041517adbce))
* **contracts:** added message processor and tally addresses to the maci contract ([#1715](https://github.com/privacy-scaling-explorations/maci/issues/1715)) ([801b774](https://github.com/privacy-scaling-explorations/maci/commit/801b7747852a63885ed8d6ae43d81260dab9c76f))
* **contracts:** allow for dynamic emptyBallotRoots ([#1695](https://github.com/privacy-scaling-explorations/maci/issues/1695)) ([e7aa4dd](https://github.com/privacy-scaling-explorations/maci/commit/e7aa4dda5ddaf005d19c95342a642fbc798f5d6b))
* **contracts:** implement semaphore gatekeeper ([#1579](https://github.com/privacy-scaling-explorations/maci/issues/1579)) ([d1f744e](https://github.com/privacy-scaling-explorations/maci/commit/d1f744e782ff09a542ef980b94bd2eb377b9e714))
* **contracts:** tally qv and non-qv optimisations ([b0b7b38](https://github.com/privacy-scaling-explorations/maci/commit/b0b7b38bf008e8a542b550c75ada40ac21854944))
* **contract:** support qv and non-qv verification keys ([a0cce8c](https://github.com/privacy-scaling-explorations/maci/commit/a0cce8c52950b2232c5cd47e98825ce401aac002))
* **coordinator:** add coordinator controller ([da0b29b](https://github.com/privacy-scaling-explorations/maci/commit/da0b29b1834da631c00296c0f74662a93c90e0a5))
* **coordinator:** add crypto and proof generation services ([6c9891e](https://github.com/privacy-scaling-explorations/maci/commit/6c9891e870f47f59619f57c3423bb5b60862bccd))
* **coordinator:** add websockets support ([8442105](https://github.com/privacy-scaling-explorations/maci/commit/84421057108bdf37a4965aecfceb5c19d1e7f4b0))
* **deploy-task:** added zupass gatekeeper to the deploy tasks ([bea57e0](https://github.com/privacy-scaling-explorations/maci/commit/bea57e0092c1cb5f992e288069a25afa8bbc61de))
* export merge function and modify package version ([#1584](https://github.com/privacy-scaling-explorations/maci/issues/1584)) ([f6ae34a](https://github.com/privacy-scaling-explorations/maci/commit/f6ae34a3f9ea375cd5dac8f0ce8618e33509f8ad))
* export pubkey and update description of deployment ([c782d24](https://github.com/privacy-scaling-explorations/maci/commit/c782d2496b2ddd1c8d12c1bd31b2ea948a364fdf))
* **gatekeepers:** implement a gitcoin passport gatekeeper ([df44f7e](https://github.com/privacy-scaling-explorations/maci/commit/df44f7ed02c220ec03393f4aec8d81deb7e3a84d))
* **gatekeepers:** implement a Zupass gatekeeper ([3f615fd](https://github.com/privacy-scaling-explorations/maci/commit/3f615fdbb87eee9dd37138374a022178852c7d60))
* **HatsGatekeepers:** add Hats gatekeeper contracts ([fd38a5a](https://github.com/privacy-scaling-explorations/maci/commit/fd38a5a0cc4d5e7609e9e42252f7f6cdfca18660))
* **HatsGatekeepers:** add zero-address check to `setMaciInstance()` ([88c0bdc](https://github.com/privacy-scaling-explorations/maci/commit/88c0bdccd8e36f6acfb3d617d2d0c4d73de674c7))
* **multiple-polls:** allow concurrent polls ([14e89ba](https://github.com/privacy-scaling-explorations/maci/commit/14e89baea1ede9bc9bad79fafb5c362d6a6a81e9))
* proof parallelization ([#1627](https://github.com/privacy-scaling-explorations/maci/issues/1627)) ([4e7f9eb](https://github.com/privacy-scaling-explorations/maci/commit/4e7f9eba79b5422fc1722978cc9d0f259381df60))
* store deployment transaction hash in contract storage and add a getter ([#1494](https://github.com/privacy-scaling-explorations/maci/issues/1494)) ([0abbebb](https://github.com/privacy-scaling-explorations/maci/commit/0abbebb094a60a7a2c956497da437b9f129f20a0))
* **subgraph:** store poll mode on subgraph ([#1620](https://github.com/privacy-scaling-explorations/maci/issues/1620)) ([29c53dc](https://github.com/privacy-scaling-explorations/maci/commit/29c53dc694b204d1e08967cb8ca8b1719fa79bae))
* support deployment without hardhat ([dab5e2b](https://github.com/privacy-scaling-explorations/maci/commit/dab5e2b0c05f00d4ede53b67ea118d05a952c5c3))
* use mode instead of flag for voting option ([34421de](https://github.com/privacy-scaling-explorations/maci/commit/34421deb4da54da732cd34d868e76e04a5eea501))


### Bug Fixes

* add coordinator public key hash public input ([9766bbf](https://github.com/privacy-scaling-explorations/maci/commit/9766bbfcecd41bd0f39c1422978d959705b1b500))
* **contract:** fix vkRegistryContract typo ([f4caaf0](https://github.com/privacy-scaling-explorations/maci/commit/f4caaf0a2ca8c499bb0150b3038ef1d5869c5448))
* **contract:** gatekeeper deploy config skip ([caf65bb](https://github.com/privacy-scaling-explorations/maci/commit/caf65bbc9ddc9629386d1de3b9cbeaec9c5a405a))
* **contracts:** address [@ctrlc03](https://github.com/ctrlc03) comments ([431a4a7](https://github.com/privacy-scaling-explorations/maci/commit/431a4a7216d4f01b8d14d2dd2fb0293fba0a6214))
* **contracts:** apply small changes suggested by [@kittybest](https://github.com/kittybest) ([bb429ae](https://github.com/privacy-scaling-explorations/maci/commit/bb429aece0eed2eed5d526e2a23522722c42ba5c))
* **contracts:** correctly deploy test contracts ([81880b3](https://github.com/privacy-scaling-explorations/maci/commit/81880b39056e5ae18da4b3218233d2ca965e9c2e))
* **contracts:** ensure `gasPrice` has sufficient value ([#1703](https://github.com/privacy-scaling-explorations/maci/issues/1703)) ([a3d46e8](https://github.com/privacy-scaling-explorations/maci/commit/a3d46e847244ae648ea47397c81324d4ccaac874))
* **contracts:** ensure we call setMaci when deploying semaphoreGatekeeper ([#1647](https://github.com/privacy-scaling-explorations/maci/issues/1647)) ([45ed819](https://github.com/privacy-scaling-explorations/maci/commit/45ed8199194a46054e709ebd3a19f8f1f14ea935))
* **contracts:** fix a deploy error in the hardhat task ([#1702](https://github.com/privacy-scaling-explorations/maci/issues/1702)) ([0c01532](https://github.com/privacy-scaling-explorations/maci/commit/0c015323ced584795d5f2accdd76bfbe03575e48))
* **contracts:** use for-loop instead of async promise ([ccb2c14](https://github.com/privacy-scaling-explorations/maci/commit/ccb2c146f64322108c3217d2f34e6eb52af7e72e))
* do not accept invalid maci keys ([9f9e858](https://github.com/privacy-scaling-explorations/maci/commit/9f9e858755a3e064f854675a678ef2fb18041fab))
* **hardhat-deploy-tasks:** removed topup from deploy scripts ([790e6e0](https://github.com/privacy-scaling-explorations/maci/commit/790e6e05eb543d6485b870d883ac89f0160d8a05))
* publish proof onchain ([e813174](https://github.com/privacy-scaling-explorations/maci/commit/e8131741b3fb5059572822c04cb61b1cbae9599d))
* tests for hats gatekeeper and ownable ([9653154](https://github.com/privacy-scaling-explorations/maci/commit/9653154264f83217cbbedefc000d8f037a5c8e0d))


### Code Refactoring

* **config-example:** added gitcoin to config example ([cbeccee](https://github.com/privacy-scaling-explorations/maci/commit/cbeccee701cd7251dcace9f882202ffdedeabb28))
* **contracts:** do not return contract addresses on poll deploy ([43d5224](https://github.com/privacy-scaling-explorations/maci/commit/43d52240755a3371ff0f7e0454e6a0dad80ddce4))
* **contracts:** optimize contract tasks and scripts ([f9f5722](https://github.com/privacy-scaling-explorations/maci/commit/f9f57227ea3e011a3b8199fdc806159bbc3d15eb))
* **deploy-task:** fixed recommendations ([3cc00dc](https://github.com/privacy-scaling-explorations/maci/commit/3cc00dc6fcc5e79138ff1a9f9c74235607688264))
* **deploy-task:** renamed numeric representation ([9a09a8b](https://github.com/privacy-scaling-explorations/maci/commit/9a09a8bb66477de88f34ca05ba9e50dd0f564b36))
* **deploy-tasks:** added recommendation ([76c5652](https://github.com/privacy-scaling-explorations/maci/commit/76c56520216bd33e59222926df3f8f490c8e5457))
* **fixed-comments:** fixed comments ([afdd6d8](https://github.com/privacy-scaling-explorations/maci/commit/afdd6d8da3d90f7662274f6e6317c00aace1004a))
* general cleanup, variables/events/functions renaming ([b5f5015](https://github.com/privacy-scaling-explorations/maci/commit/b5f50150c9c97265207d8b6fd89d92d11a4b70cf))
* **HatsGatekeepers:** split into one file per contract per [@0xmad](https://github.com/0xmad) suggestion ([a4d1dce](https://github.com/privacy-scaling-explorations/maci/commit/a4d1dce6d4299149495e9275017343bf03eea6ba))
* **maci:** remove subsidy feature to simplify further protocol improvements ([52fc7c5](https://github.com/privacy-scaling-explorations/maci/commit/52fc7c5b8f2d389868bca6171ffd15a94b1d1659))
* optimize poll and tally contracts variables ([f3b6035](https://github.com/privacy-scaling-explorations/maci/commit/f3b603543e86038a878f8d1b254717a13d84d59a))
* **prove-task:** must get set to true ([296bc2c](https://github.com/privacy-scaling-explorations/maci/commit/296bc2c87c280f71b6ee87f9cf62745e6076fe39))
* **remove-unused-type:** remove unused type ([491e329](https://github.com/privacy-scaling-explorations/maci/commit/491e3291510fb7273227af0308c445fbd8b2e26d))
* **tasks:** removed params from prove task ([c9df22e](https://github.com/privacy-scaling-explorations/maci/commit/c9df22efe5b6258e3cabee61fd3d8cfe93c14d96))
* **topup:** remove the topup feature ([67711d4](https://github.com/privacy-scaling-explorations/maci/commit/67711d44058831302d4556f12d1972ffacede653))


### Miscellaneous

* add @types/snarkjs package ([57bf0ed](https://github.com/privacy-scaling-explorations/maci/commit/57bf0edf4453d18c7c154ae928c30899b6996ebd))
* add doc entries for new maci version (currently being developed) ([c72a130](https://github.com/privacy-scaling-explorations/maci/commit/c72a130cf6dcd4e8e5e59b374d8a63c1cfaae8cd))
* add forking options ([2f0908b](https://github.com/privacy-scaling-explorations/maci/commit/2f0908b67c0068385fe399e67ed2d44790588a5c))
* add name to gatekeepers and add sdk function ([#1639](https://github.com/privacy-scaling-explorations/maci/issues/1639)) ([30984d0](https://github.com/privacy-scaling-explorations/maci/commit/30984d0f0a2b4a5e76dd3414d008b98ae9809c01))
* add port as env variable and remove redundant param in testScript ([#1577](https://github.com/privacy-scaling-explorations/maci/issues/1577)) ([71014a9](https://github.com/privacy-scaling-explorations/maci/commit/71014a967920aada6ca58a1885c684dac4eb12b5))
* add qv and non-qv key setup during deploy ([29f9e17](https://github.com/privacy-scaling-explorations/maci/commit/29f9e173e788105b420b2ec0ea4f40d423b27685))
* bump to 1.2.2 ([e63278f](https://github.com/privacy-scaling-explorations/maci/commit/e63278f71937a1fa908ec8f4be2d43114701c134))
* **cleanup:** remove references to topup ([1cda690](https://github.com/privacy-scaling-explorations/maci/commit/1cda690ceaaac49525e02fffcbaa11bad77541e8))
* **config:** added optimism to config and fixed broken link ([#1578](https://github.com/privacy-scaling-explorations/maci/issues/1578)) ([3a278fb](https://github.com/privacy-scaling-explorations/maci/commit/3a278fb6a30aab9386f23f5cf1722c9985d71d24))
* **config:** added scroll to config and fixed broken links ([#1565](https://github.com/privacy-scaling-explorations/maci/issues/1565)) ([507e60a](https://github.com/privacy-scaling-explorations/maci/commit/507e60a366a36b5238d52a4ff70c397f4a3fc74e))
* **contracts:** add acc queue contract to deployed contracts ([b12d8a6](https://github.com/privacy-scaling-explorations/maci/commit/b12d8a6e9b4c5b9339420b6aa80f06274f9c64ef))
* **contracts:** cleanup contracts tests ([7f8fc25](https://github.com/privacy-scaling-explorations/maci/commit/7f8fc2557fc940c81dd6e98c47186754fac1976a))
* **contracts:** contracts optimizations ([7f69ddc](https://github.com/privacy-scaling-explorations/maci/commit/7f69ddc123d7347fba8ba5a36d274c9935dfdd6a))
* **contracts:** fix eas_gatekeeper tests ([5bb933c](https://github.com/privacy-scaling-explorations/maci/commit/5bb933cfb4f7ef0a8bb0a7fd92d3f6227af09f3a))
* **contracts:** get rid of bash scripts for prebuild command ([3459f4e](https://github.com/privacy-scaling-explorations/maci/commit/3459f4ed04ab6231e9dc5537d652d6edfff45f12))
* **contracts:** move away from infura key to full rpc url ([2b4912f](https://github.com/privacy-scaling-explorations/maci/commit/2b4912f7ac33acfb0e2f2b4a7d7223252d70bcd7))
* **contracts:** optimization and typo fixes ([b0c6fbd](https://github.com/privacy-scaling-explorations/maci/commit/b0c6fbda664381b52946514119122c254c0c847e))
* **contracts:** support op sepolia deployment ([1dabd76](https://github.com/privacy-scaling-explorations/maci/commit/1dabd761cba9b2dcccbaa16add2635352cbe7551))
* **contracts:** use deployment helper for deploy commands ([8751913](https://github.com/privacy-scaling-explorations/maci/commit/8751913f84fbc9d9d46f4d1e57ce773d6541afa7))
* **deployment:** add missing text ([#1645](https://github.com/privacy-scaling-explorations/maci/issues/1645)) ([6444188](https://github.com/privacy-scaling-explorations/maci/commit/64441882f2d49d55ec36f4253d2265671f6a5c07))
* **deployment:** deploy to testnets and update docs ([799668e](https://github.com/privacy-scaling-explorations/maci/commit/799668e4b6e5a8587c9d3e3e90391f65eb02bef8))
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
* **deps-dev:** bump @types/uuid from 9.0.8 to 10.0.0 ([5197bb2](https://github.com/privacy-scaling-explorations/maci/commit/5197bb265a42e0643f63c3edec9cd6e8406cf633))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([#1728](https://github.com/privacy-scaling-explorations/maci/issues/1728)) ([a04e234](https://github.com/privacy-scaling-explorations/maci/commit/a04e234cb10d735dc8d514f54d70058ea93487c8))
* **deps-dev:** bump typescript from 5.3.3 to 5.4.2 ([591c767](https://github.com/privacy-scaling-explorations/maci/commit/591c767308f746fbfc32a9f184192912895f080c))
* **deps-dev:** bump typescript from 5.4.2 to 5.4.3 ([a2f5c8a](https://github.com/privacy-scaling-explorations/maci/commit/a2f5c8ac32394fc7672051d5342baf7e6f9567ce))
* **deps-dev:** bump typescript from 5.4.3 to 5.4.4 ([5e047ea](https://github.com/privacy-scaling-explorations/maci/commit/5e047eaa96d508addf34e35764ddaf4deb221593))
* **deps-dev:** bump typescript from 5.4.4 to 5.4.5 ([ea6339d](https://github.com/privacy-scaling-explorations/maci/commit/ea6339da96dda38a931cb6d39615c9267ca45b81))
* **deps-dev:** bump typescript from 5.4.5 to 5.5.2 ([e2b4d45](https://github.com/privacy-scaling-explorations/maci/commit/e2b4d45235c82bba349d959a164442cae90ad97f))
* **deps-dev:** bump typescript from 5.5.2 to 5.5.3 ([c979188](https://github.com/privacy-scaling-explorations/maci/commit/c979188358becfc4b434a2f73331e640ce595846))
* **deps-dev:** bump typescript from 5.5.3 to 5.5.4 ([8ed2e2b](https://github.com/privacy-scaling-explorations/maci/commit/8ed2e2b109a950137dd289aa7d3eca4268079272))
* **deps:** bump @nomicfoundation/hardhat-ethers from 3.0.5 to 3.0.6 ([f0a0869](https://github.com/privacy-scaling-explorations/maci/commit/f0a08696eb8b458c9f3ab8e35612152cc7528589))
* **deps:** bump @nomicfoundation/hardhat-toolbox from 4.0.0 to 5.0.0 ([c403cb4](https://github.com/privacy-scaling-explorations/maci/commit/c403cb4b9c27e15958493a6d19555161ecef743c))
* **deps:** bump ethers from 6.11.1 to 6.12.0 ([9db5a93](https://github.com/privacy-scaling-explorations/maci/commit/9db5a93d32396d80b76e2d20d1af529e6a97292a))
* **deps:** bump ethers from 6.12.0 to 6.12.1 ([16b4615](https://github.com/privacy-scaling-explorations/maci/commit/16b46159a132abb82b4659c424a065bb418bd31e))
* **deps:** bump ethers from 6.13.0 to 6.13.1 ([b32694d](https://github.com/privacy-scaling-explorations/maci/commit/b32694da7aa60e0215daa56d2b64ed5e5f8d9d45))
* **deps:** bump ethers from 6.13.1 to 6.13.2 ([#1709](https://github.com/privacy-scaling-explorations/maci/issues/1709)) ([c9de72e](https://github.com/privacy-scaling-explorations/maci/commit/c9de72eead282027cc9dcab0edd9170a0fbe5a2e))
* **deps:** bump hardhat from 2.22.1 to 2.22.2 ([397e50b](https://github.com/privacy-scaling-explorations/maci/commit/397e50b6ded4cc81ce299747b2847254af7ea1ce))
* **deps:** bump hardhat from 2.22.3 to 2.22.4 ([481a1e7](https://github.com/privacy-scaling-explorations/maci/commit/481a1e7a83ad8984880a98aa09824b3dc689acd9))
* **deps:** bump hardhat from 2.22.5 to 2.22.6 ([6949eee](https://github.com/privacy-scaling-explorations/maci/commit/6949eee8717c16c129b15c570283ea58ce39ec33))
* **deps:** bump uuid from 9.0.1 to 10.0.0 ([13285a7](https://github.com/privacy-scaling-explorations/maci/commit/13285a77a59cec0e5948f1469b5540009e394509))
* **docs:** fixed broken links ([#1585](https://github.com/privacy-scaling-explorations/maci/issues/1585)) ([4b2012e](https://github.com/privacy-scaling-explorations/maci/commit/4b2012eb3827611e8a7fb0d441e6fd1da8df478e))
* **eas:** mock eas gatekeeper tests ([8f3fd14](https://github.com/privacy-scaling-explorations/maci/commit/8f3fd1416520434c293dd9efadb56b2101f45fc5))
* fix typos ([96ae030](https://github.com/privacy-scaling-explorations/maci/commit/96ae030bfe10b0fb94e1304cd017f8775cd58b1d))
* **HatsGatekeepers:** add new lines in tests ([d8cd814](https://github.com/privacy-scaling-explorations/maci/commit/d8cd814edf0f354c485c9a8e3f6ac9f506627d2a))
* **HatsGatekeepers:** adds natspec to IHats.sol ([8793fb3](https://github.com/privacy-scaling-explorations/maci/commit/8793fb3f3c1306926f95941ea6ab78a4944091f1))
* **HatsGatekeepers:** get hardhat forked network ci tests passing ([c04a23e](https://github.com/privacy-scaling-explorations/maci/commit/c04a23e63431716a6497bb176e1c8c6d5e822100))
* **hats:** mock hats gatekeeper tests ([b744b11](https://github.com/privacy-scaling-explorations/maci/commit/b744b119ce266e3c60e21654cb81538731fea04b))
* optimize message processor and tally ([d75b244](https://github.com/privacy-scaling-explorations/maci/commit/d75b2446c2ee012d146afe8d7bc423f5b94e4579))
* **release:** publish 1.2.1 ([93564f8](https://github.com/privacy-scaling-explorations/maci/commit/93564f8a98baa0fee65db16e2e40209d9ac1b3ae))
* **release:** publish 2.0.0 ([04e647d](https://github.com/privacy-scaling-explorations/maci/commit/04e647d231df34952569ad6ff802e0b2333eb658))
* remove max values ([8f951b0](https://github.com/privacy-scaling-explorations/maci/commit/8f951b0fcc73212d99d3ddc962fbaa9788471fb6))
* update @openzeppelin/contracts to 5.0.2 ([188b259](https://github.com/privacy-scaling-explorations/maci/commit/188b25990124ac69bf7796d2c1907a797e095481))
* update hardhat to 2.21.1 ([ba6e236](https://github.com/privacy-scaling-explorations/maci/commit/ba6e236be14ff9b29126e887c9d552bc207e7467))
* use async fs instead of sync version ([fb8317e](https://github.com/privacy-scaling-explorations/maci/commit/fb8317ef3943a8434083de6e1b0f9469f15dd113))
* use non-zero start and end blocks for proof generation ([59887e7](https://github.com/privacy-scaling-explorations/maci/commit/59887e760fb1bc8741ee9322ea90305334df280d))



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
