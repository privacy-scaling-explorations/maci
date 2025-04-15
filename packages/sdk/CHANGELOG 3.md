# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.0](https://github.com/privacy-scaling-explorations/maci/compare/v2.5.0...v3.0.0) (2025-03-28)


### Features

* add invalidate votes function ([#2219](https://github.com/privacy-scaling-explorations/maci/issues/2219)) ([6531fee](https://github.com/privacy-scaling-explorations/maci/commit/6531feef1b2384180736c69a3b7bb307b922d085))
* add logs output option for debugging and auditing ([d638fb6](https://github.com/privacy-scaling-explorations/maci/commit/d638fb67348ce34c2f93222911b0c29c14a6b9b2))
* add start and end timestmap for poll ([cf67b53](https://github.com/privacy-scaling-explorations/maci/commit/cf67b539d7d5dfd8b83ba3e0becaa20d0292b410))
* allow to download artifacts on browser ([58a163f](https://github.com/privacy-scaling-explorations/maci/commit/58a163f82c65d440c05200ae3f00e22790d70a4e))
* check if a user is registered ([#2278](https://github.com/privacy-scaling-explorations/maci/issues/2278)) ([6c0a2d9](https://github.com/privacy-scaling-explorations/maci/commit/6c0a2d9829639fc2af6e8f2efcb1aa33af5037ce))
* **contracts:** add anon aadhaar gatekeeper checker ([13f14b0](https://github.com/privacy-scaling-explorations/maci/commit/13f14b07fd5fe8433d46b6fc6bab94216b06c97d))
* **contracts:** add checker and deployment for proxy gatekeepers ([87f6d3b](https://github.com/privacy-scaling-explorations/maci/commit/87f6d3b7f32bf8dddcbf99b855dbe4b7b6c2a58e))
* **contracts:** add eas gatekeeper checker ([6e90591](https://github.com/privacy-scaling-explorations/maci/commit/6e90591923f8104c06558a8c8a4a5f26d16e63c1))
* **contracts:** add hats gatekeeper checker ([8ba97ae](https://github.com/privacy-scaling-explorations/maci/commit/8ba97ae09de1cc738df04a7b868d97c74027de3c))
* **contracts:** add merkle proof gatekeeper checker ([e386f91](https://github.com/privacy-scaling-explorations/maci/commit/e386f914807a0d82140ae077cdcb866a4f9dc053))
* **contracts:** add semaphore gatekeeper checker ([b7419c9](https://github.com/privacy-scaling-explorations/maci/commit/b7419c9b53da2ca043696ef25f8902d8c0a736e2))
* **contracts:** add zupass gatekeeper checker ([d69702b](https://github.com/privacy-scaling-explorations/maci/commit/d69702b7962617aef6b48b7de1c9a2fe4c857676))
* **contracts:** integrate excubiae for gatekeepers ([fae260b](https://github.com/privacy-scaling-explorations/maci/commit/fae260bbdd4d6b7a8749f61c0310526448a6c030))
* **sdk:** add relayer functions ([6273ef8](https://github.com/privacy-scaling-explorations/maci/commit/6273ef8c07675aaebe6d1d73d2c1e51de1ccfc56))
* **sdk:** return processProofs, tallyProofs and tallyData in generateProofs ([#2193](https://github.com/privacy-scaling-explorations/maci/issues/2193)) ([dfbc410](https://github.com/privacy-scaling-explorations/maci/commit/dfbc410d4267fb6e3d327aa3b645792d7380aff7))
* use excubiae policies instead of gatekeepers ([a2319b1](https://github.com/privacy-scaling-explorations/maci/commit/a2319b19e473e683a301bd79b3ab2b06e83f9452))


### Bug Fixes

* add export without deploy functions ([#2284](https://github.com/privacy-scaling-explorations/maci/issues/2284)) ([2252806](https://github.com/privacy-scaling-explorations/maci/commit/2252806497eb10d0e57f5d081dd446d47ff29b73))


### Code Refactoring

* **cli:** cleanup signup command ([601269c](https://github.com/privacy-scaling-explorations/maci/commit/601269c8c5c508289e3f95ac6b55603c73d19779))
* **cli:** move deploy vk registry and testing commands to sdk ([bcd8d12](https://github.com/privacy-scaling-explorations/maci/commit/bcd8d12980067a5d1618fe43c8d3a9b5c5d5be84))
* **cli:** move key generation commands to sdk ([08634a1](https://github.com/privacy-scaling-explorations/maci/commit/08634a150bc8ca2428069a741a5ebda7a197dc8d))
* **cli:** move maci state generation to sdk ([f922298](https://github.com/privacy-scaling-explorations/maci/commit/f92229850ad4c6416274dcab64fd981de070a491))
* **cli:** move proof generation and poll deploy to sdk ([31922b2](https://github.com/privacy-scaling-explorations/maci/commit/31922b2f816ecdd254d761e49b25081f5c9fa9a3))
* **cli:** move prove onchain to sdk ([452a68a](https://github.com/privacy-scaling-explorations/maci/commit/452a68a452ac33f9186ecf735e8d5df852a5c5e1))
* **cli:** move publish commands to sdk ([aa16343](https://github.com/privacy-scaling-explorations/maci/commit/aa1634325c2617f3a8a95e3013adc60758b996ae))
* **cli:** move signups merging to sdk ([36a8d6d](https://github.com/privacy-scaling-explorations/maci/commit/36a8d6de45ae2dc8e9fb49fb2a1092b31216ed66))
* **cli:** move vk commands to sdk ([1f2a81e](https://github.com/privacy-scaling-explorations/maci/commit/1f2a81e67ccdea1ca6136dd71005cb7f91ae02fb))
* **cli:** use contract storage for cli ([b417ee7](https://github.com/privacy-scaling-explorations/maci/commit/b417ee7de9c54fb875c363ca38c1c41eb34d8e8e))
* contract imports and proofs ([#2074](https://github.com/privacy-scaling-explorations/maci/issues/2074)) ([66dfab7](https://github.com/privacy-scaling-explorations/maci/commit/66dfab7e0916f5891f47ae1448b89f7b0fd0ed27))
* deploy maci command ([3eb6915](https://github.com/privacy-scaling-explorations/maci/commit/3eb691568a01e94cbbdb2f4f806efae002b19328))
* gen proofs ([7bba1c5](https://github.com/privacy-scaling-explorations/maci/commit/7bba1c5ab0abfb0d518400cefbc00a3cd75dadd2))
* join poll sdk ([52607a7](https://github.com/privacy-scaling-explorations/maci/commit/52607a7df7c73f1b8371035f19fbd2433beab8b5))
* make separate testing package ([#2229](https://github.com/privacy-scaling-explorations/maci/issues/2229)) ([bd07a7f](https://github.com/privacy-scaling-explorations/maci/commit/bd07a7f0783b2efe2659bc18255f8f4ed2e3c0d3))
* poll deploy sdk ([#2189](https://github.com/privacy-scaling-explorations/maci/issues/2189)) ([da1b785](https://github.com/privacy-scaling-explorations/maci/commit/da1b7852cea94663a97ef7ceef1c3e9b8ca3eda8))
* remove redundant param ([#2161](https://github.com/privacy-scaling-explorations/maci/issues/2161)) ([2cc986f](https://github.com/privacy-scaling-explorations/maci/commit/2cc986fadd91283cd78f3f90bc8825d2aa44e2a5))
* **sdk:** change sdk package structure ([3255909](https://github.com/privacy-scaling-explorations/maci/commit/3255909f685e613446d2a499f3fb9caa89dc4f24))
* **sdk:** separate keys functions ([e22cb16](https://github.com/privacy-scaling-explorations/maci/commit/e22cb1657ee46477d6abb649d77bde07ea97bad0))
* setVerifyingKeys ([8ce195b](https://github.com/privacy-scaling-explorations/maci/commit/8ce195baa5191bce63fd807cd75f3f75e2ad0d76))
* test suite cleanup ([#2233](https://github.com/privacy-scaling-explorations/maci/issues/2233)) ([#2232](https://github.com/privacy-scaling-explorations/maci/issues/2232)) ([0d42bb0](https://github.com/privacy-scaling-explorations/maci/commit/0d42bb09da9025d0481c45def982d155fda79b76))
* user sdk ([#2064](https://github.com/privacy-scaling-explorations/maci/issues/2064)) ([aac1ce7](https://github.com/privacy-scaling-explorations/maci/commit/aac1ce7d4db7141a6d57bf9c940751d0886b5d9e))
* verifying keys sdk ([#2070](https://github.com/privacy-scaling-explorations/maci/issues/2070)) ([44c9e1e](https://github.com/privacy-scaling-explorations/maci/commit/44c9e1e79f4d4c34c95fd46c33e4008be8cf4a07))
* vote sdk ([#2089](https://github.com/privacy-scaling-explorations/maci/issues/2089)) ([fed0e25](https://github.com/privacy-scaling-explorations/maci/commit/fed0e251bf09e1e34ec0a43ba58d89d3a95aa02c))
* vote submission ([a66da9e](https://github.com/privacy-scaling-explorations/maci/commit/a66da9e1725f9f458341c5f6f269bca0d2d6aa37))


### Miscellaneous

* add logger for contract helpers ([a688400](https://github.com/privacy-scaling-explorations/maci/commit/a6884006427f91f46ee2804fc75bd7a51533cdd6))
* **deps-dev:** bump @types/node from 20.17.19 to 22.13.9 ([aa7c356](https://github.com/privacy-scaling-explorations/maci/commit/aa7c356469592547f3d60c05077268267d7ea186))
* **deps-dev:** bump @types/node from 22.10.7 to 22.12.0 ([#2073](https://github.com/privacy-scaling-explorations/maci/issues/2073)) ([1dcb28e](https://github.com/privacy-scaling-explorations/maci/commit/1dcb28e33699ee91f9691c1073d4da0293e406c0))
* **deps-dev:** bump @types/node from 22.12.0 to 22.13.1 ([5f06af0](https://github.com/privacy-scaling-explorations/maci/commit/5f06af0180f522f552519529c07d2bb660fdd586))
* **deps-dev:** bump @types/node from 22.13.1 to 22.13.4 ([dba94f4](https://github.com/privacy-scaling-explorations/maci/commit/dba94f4fe6d405eaca655dfdc8ca01d57664b99b))
* **deps-dev:** bump @types/node from 22.13.9 to 22.13.10 ([#2241](https://github.com/privacy-scaling-explorations/maci/issues/2241)) ([3f50bb6](https://github.com/privacy-scaling-explorations/maci/commit/3f50bb65db4cd83b5ebe9d4fb1b7a6d650bb1c51))
* **deps-dev:** bump mocha from 10.8.2 to 11.1.0 ([f524a07](https://github.com/privacy-scaling-explorations/maci/commit/f524a07f5a3b1e94eaf6f230ecf16476f4c6810d))
* **deps-dev:** bump ts-jest from 29.2.5 to 29.2.6 ([aaf7978](https://github.com/privacy-scaling-explorations/maci/commit/aaf797861177b92cb1395048e32898367cd65bd5))
* **deps-dev:** bump typescript from 5.7.3 to 5.8.2 ([e37f1bf](https://github.com/privacy-scaling-explorations/maci/commit/e37f1bffd8193de316e748d0406cfb606455cb46))
* **deps:** bump @zk-kit/lean-imt from 2.2.2 to 2.2.3 ([a269d5c](https://github.com/privacy-scaling-explorations/maci/commit/a269d5ce4e47145e02a58b30c793672ab43a9c30))
* **deps:** bump multiformats from 9.9.0 to 13.3.2 ([4a9853f](https://github.com/privacy-scaling-explorations/maci/commit/4a9853f0b72fdd54fb608864620a421a027ee255))
* fix multiformat version for sdk ([b765391](https://github.com/privacy-scaling-explorations/maci/commit/b765391dc3b3a52a0b20bfe8645ae15998323dfc))
* move tests over to testing package ([fad40c3](https://github.com/privacy-scaling-explorations/maci/commit/fad40c30323135483244cc6e3c89ffba51d5120b))
* **relayer:** add checks for onchain publishing ([a25f4bd](https://github.com/privacy-scaling-explorations/maci/commit/a25f4bdd4c106920f429a4dc0deb09fb3275b57e))
* **relayer:** add more e2e tests ([0cbfc40](https://github.com/privacy-scaling-explorations/maci/commit/0cbfc40b2915924cdc6b6fc7db4392868f6f8845))
* update the readme ([#2242](https://github.com/privacy-scaling-explorations/maci/issues/2242)) ([ffdceee](https://github.com/privacy-scaling-explorations/maci/commit/ffdceee3074446f81deae5ef4e3df67f98aaada7))
