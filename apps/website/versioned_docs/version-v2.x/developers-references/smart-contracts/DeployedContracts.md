---
title: Deployed MACI Smart Contracts
description: Deployed MACI Smart Contracts
sidebar_label: Deployed MACI Smart Contracts
sidebar_position: 10
---

There are a number of MACI's smart contracts which can be re-used by different deployments. These are the following:

- [VkRegistry](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/VkRegistry.sol)
- [PoseidonHashers](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/crypto/Hasher.sol)
- [PollFactory](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/PollFactory.sol)
- [MessageProcessorFactory](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/MessageProcessorFactory.sol)
- [TallyFactory](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/TallyFactory.sol)
- [Verifier](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/crypto/Verifier.sol)
- [FreeForAllGatekeeper](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/gatekeepers/FreeForAllGatekeeper.sol)
- [ConstantInitialVoiceCreditProxy](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol) - if you are happy to work with a fixed amount of credits

VkRegistries can be re-used by different protocols to share the same set of verifying keys. Please be advised that you should be verifying that those verifying keys are the ones that have undergone a trusted setup ceremony.

In order to verify you will need the following:

- configure the cli (`cd cli && cp .env.example .env` and set the correct env vars)
- download the keys (`pnpm download-zkeys:ceremony` from the monorepo root)
- run checkVerifyingKeys with the cli (see below)

```bash
cd cli && node build/ts/index.js checkVerifyingKeys -q false -vk 0x74569d524a193daC0D3Df17B9E207C916174745b -s 6 -i 2 -m 9 -v 3 -b 2 -p ./zkeys/ProcessMessages_6-9-2-3/processMessages_6-9-2-3.zkey -t ./zkeys/TallyVotes_6-2-3/tallyVotes_6-2-3.zkey
```

:::info
You should change the -vk parameter to the VkRegistry address for the chain you are deploying to. Also you might need to modify the parameters based on the circuit configuration. Please refer to the [circuits page](/docs/developers-references/zk-snark-circuits/setup) for more information. Also you can add `-uq false` if you want to check non quadratic voting keys.
:::

## Contract Addresses

### Arbitrum Sepolia

| Contract                                     | Address                                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9](https://sepolia.arbiscan.io/address/0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9) |
| FreeForAllGatekeeper                         | [0x9e98cAA76492338627BAD0e5a6AA2762d827E169](https://sepolia.arbiscan.io/address/0x9e98cAA76492338627BAD0e5a6AA2762d827E169) |
| Verifier                                     | [0xB400794f463d90ce5f462A43d8E6f9155656d02d](https://sepolia.arbiscan.io/address/0xB400794f463d90ce5f462A43d8E6f9155656d02d) |
| PollFactory                                  | [0xBa350B0cF67a0dEDa103A5d0d297bd120bF87E39](https://sepolia.arbiscan.io/address/0xBa350B0cF67a0dEDa103A5d0d297bd120bF87E39) |
| MessageProcessorFactory                      | [0x96FD5e4E40671Bf8d5f1d0E3F3402488680B8376](https://sepolia.arbiscan.io/address/0x96FD5e4E40671Bf8d5f1d0E3F3402488680B8376) |
| TallyFactory                                 | [0xEEBc671e15B3f1c7483161F866d76ad84645d7C8](https://sepolia.arbiscan.io/address/0xEEBc671e15B3f1c7483161F866d76ad84645d7C8) |
| MACI (stateTreeDepth = 10)                   | [0x1446a1a1af027e58C8Bd29e231C01dB35b2F485E](https://sepolia.arbiscan.io/address/0x1446a1a1af027e58C8Bd29e231C01dB35b2F485E) |
| VkRegistry (10-2-1-2 and 10-1-2)             | [0xE21F9Ea298b62032B3C2206955cd12c4Ab0a046b](https://sepolia.arbiscan.io/address/0xE21F9Ea298b62032B3C2206955cd12c4Ab0a046b) |
| PoseidonT3                                   | [0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A](https://sepolia.arbiscan.io/address/0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A) |
| PoseidonT4                                   | [0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2](https://sepolia.arbiscan.io/address/0x0CC8B7Aed7d79a8B948636242706265548D0B10a) |
| PoseidonT5                                   | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://sepolia.arbiscan.io/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                   | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://sepolia.arbiscan.io/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |

### Arbitrum Mainnet

| Contract                                      | Address                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://arbiscan.io/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| FreeForAllGatekeeper                          | [0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f](https://arbiscan.io/address/0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f) |
| Verifier                                      | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://arbiscan.io/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PollFactory                                   | [0x2F1A5B4F8F3B7348C66A1522622b1DB712261607](https://arbiscan.io/address/0x2F1A5B4F8F3B7348C66A1522622b1DB712261607) |
| MessageProcessorFactory                       | [0xE4c9d4248F1371C5C61d406A9859f9FE667567a5](https://arbiscan.io/address/0xE4c9d4248F1371C5C61d406A9859f9FE667567a5) |
| TallyFactory                                  | [0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C](https://arbiscan.io/address/0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C) |
| MACI (stateTreeDepth = 14)                    | [0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761](https://arbiscan.io/address/0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761) |
| VkRegistry (14-9-2-3 and 14-2-3)              | [0x6aA5baD99aC44bB008930c68CE2249549Cf10944](https://arbiscan.io/address/0x6aA5baD99aC44bB008930c68CE2249549Cf10944) |
| PoseidonT3                                    | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://arbiscan.io/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                    | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://arbiscan.io/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                    | [0x43B519FF023757508311518AC41B5fA1CfD57181](https://arbiscan.io/address/0x43B519FF023757508311518AC41B5fA1CfD57181) |
| PoseidonT6                                    | [0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1](https://arbiscan.io/address/0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1) |

### Optimism

| Contract                                      | Address                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x83dD551541C580e338206f1f677835D427C92dE2](https://optimistic.etherscan.io/address/0x83dD551541C580e338206f1f677835D427C92dE2) |
| FreeForAllGatekeeper                          | [0xD5C41106db85EDd0298279AcFCE5A722060cc5f9](https://optimistic.etherscan.io/address/0xD5C41106db85EDd0298279AcFCE5A722060cc5f9) |
| Verifier                                      | [0x88C2c6A7535463962A34757FE63cc4F296381aba](https://optimistic.etherscan.io/address/0x88C2c6A7535463962A34757FE63cc4F296381aba) |
| PollFactory                                   | [0x50045B05cb1C76410783D8A3e5625a99d5729339](https://optimistic.etherscan.io/address/0x50045B05cb1C76410783D8A3e5625a99d5729339) |
| MessageProcessorFactory                       | [0xbB28555E989799478442483CD1f2D370a14e2C42](https://optimistic.etherscan.io/address/0xbB28555E989799478442483CD1f2D370a14e2C42) |
| TallyFactory                                  | [0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0](https://optimistic.etherscan.io/address/0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0) |
| MACI (stateTreeDepth = 14)                    | [0x3D4C58074DCD8E6526885F465ab5F311b6B290B5](https://optimistic.etherscan.io/address/0x3D4C58074DCD8E6526885F465ab5F311b6B290B5) |
| VkRegistry (14-9-2-3 and 14-2-3)              | [0x7E16271EaE58F52a0431F87Ee7E40c978178C63F](https://optimistic.etherscan.io/address/0x7E16271EaE58F52a0431F87Ee7E40c978178C63F) |
| PoseidonT3                                    | [0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66](https://optimistic.etherscan.io/address/0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66) |
| PoseidonT4                                    | [0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274](https://optimistic.etherscan.io/address/0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274) |
| PoseidonT5                                    | [0xD2F6c828606Ad8e985008Cd825012f269B50CD58](https://optimistic.etherscan.io/address/0xD2F6c828606Ad8e985008Cd825012f269B50CD58) |
| PoseidonT6                                    | [0x982530673Ce9e5Efa02438c694d48327Aa4fB592](https://optimistic.etherscan.io/address/0x982530673Ce9e5Efa02438c694d48327Aa4fB592) |

### Optimism Sepolia

| Contract                                     | Address                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF](https://sepolia-optimism.etherscan.io/address/0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF) |
| FreeForAllGatekeeper                         | [0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45](https://sepolia-optimism.etherscan.io/address/0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45) |
| Verifier                                     | [0xB1abb44291ff487f96636758b07Ccd9881f64c9A](https://sepolia-optimism.etherscan.io/address/0xB1abb44291ff487f96636758b07Ccd9881f64c9A) |
| PollFactory                                  | [0xad844a9567ada5996FFC0D2DeC78b3767a1c0501](https://sepolia-optimism.etherscan.io/address/0xad844a9567ada5996FFC0D2DeC78b3767a1c0501) |
| MessageProcessorFactory                      | [0xbBb6f1B4232F993e5a026217a3D596B332062CB3](https://sepolia-optimism.etherscan.io/address/0xbBb6f1B4232F993e5a026217a3D596B332062CB3) |
| TallyFactory                                 | [0x1356f05179cdcAD2D8708B539A75de082118de92](https://sepolia-optimism.etherscan.io/address/0x1356f05179cdcAD2D8708B539A75de082118de92) |
| MACI (stateTreeDepth = 10)                   | [0x94f29E6d14A01c1330CE8f7421Db489Fe5A14976](https://sepolia-optimism.etherscan.io/address/0x94f29E6d14A01c1330CE8f7421Db489Fe5A14976) |
| VkRegistry (10-2-1-2 and 10-1-2)             | [0x42B1AB3d98B8235204E75112e5d9E974cE7531cC](https://sepolia-optimism.etherscan.io/address/0x42B1AB3d98B8235204E75112e5d9E974cE7531cC) |
| PoseidonT3                                   | [0x07490eba00dc4ACA6721D052Fa4C5002Aa077233](https://sepolia-optimism.etherscan.io/address/0x07490eba00dc4ACA6721D052Fa4C5002Aa077233) |
| PoseidonT4                                   | [0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d](https://sepolia-optimism.etherscan.io/address/0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d) |
| PoseidonT5                                   | [0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679](https://sepolia-optimism.etherscan.io/address/0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679) |
| PoseidonT6                                   | [0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F](https://sepolia-optimism.etherscan.io/address/0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F) |

### Scroll Sepolia

| Contract                                     | Address                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0xB486cce9B4507A67Db147B0802D5673774C8D278](https://sepolia.scrollscan.com/address/0xB486cce9B4507A67Db147B0802D5673774C8D278) |
| FreeForAllGatekeeper                         | [0x83dD551541C580e338206f1f677835D427C92dE2](https://sepolia.scrollscan.com/address/0x83dD551541C580e338206f1f677835D427C92dE2) |
| Verifier                                     | [0xD5C41106db85EDd0298279AcFCE5A722060cc5f9](https://sepolia.scrollscan.com/address/0xD5C41106db85EDd0298279AcFCE5A722060cc5f9) |
| PollFactory                                  | [0x982530673Ce9e5Efa02438c694d48327Aa4fB592](https://sepolia.scrollscan.com/address/0x982530673Ce9e5Efa02438c694d48327Aa4fB592) |
| MessageProcessorFactory                      | [0x50045B05cb1C76410783D8A3e5625a99d5729339](https://sepolia.scrollscan.com/address/0x50045B05cb1C76410783D8A3e5625a99d5729339) |
| TallyFactory                                 | [0xbB28555E989799478442483CD1f2D370a14e2C42](https://sepolia.scrollscan.com/address/0xbB28555E989799478442483CD1f2D370a14e2C42) |
| MACI (stateTreeDepth = 10)                   | [0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0](https://sepolia.scrollscan.com/address/0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0) |
| VkRegistry (10-2-1-2 and 10-1-2)             | [0x3D4C58074DCD8E6526885F465ab5F311b6B290B5](https://sepolia.scrollscan.com/address/0x3D4C58074DCD8E6526885F465ab5F311b6B290B5) |
| PoseidonT3                                   | [0x88C2c6A7535463962A34757FE63cc4F296381aba](https://sepolia.scrollscan.com/address/0x88C2c6A7535463962A34757FE63cc4F296381aba) |
| PoseidonT4                                   | [0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274](https://sepolia.scrollscan.com/address/0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274) |
| PoseidonT5                                   | [0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679](https://sepolia.scrollscan.com/address/0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679) |
| PoseidonT6                                   | [0xD2F6c828606Ad8e985008Cd825012f269B50CD58](https://sepolia.scrollscan.com/address/0xD2F6c828606Ad8e985008Cd825012f269B50CD58) |

### Base

| Contract                                      | Address                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://basescan.org/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| FreeForAllGatekeeper                          | [0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f](https://basescan.org/address/0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f) |
| Verifier                                      | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://basescan.org/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PollFactory                                   | [0x2F1A5B4F8F3B7348C66A1522622b1DB712261607](https://basescan.org/address/0x2F1A5B4F8F3B7348C66A1522622b1DB712261607) |
| MessageProcessorFactory                       | [0xE4c9d4248F1371C5C61d406A9859f9FE667567a5](https://basescan.org/address/0xE4c9d4248F1371C5C61d406A9859f9FE667567a5) |
| TallyFactory                                  | [0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C](https://basescan.org/address/0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C) |
| MACI (stateTreeDepth = 14)                    | [0xe98D62574B1b780b8C13B1917700001dc5FEc68a](https://basescan.org/address/0xe98D62574B1b780b8C13B1917700001dc5FEc68a) |
| VkRegistry (14-9-2-3 and 14-2-3)              | [0x6aA5baD99aC44bB008930c68CE2249549Cf10944](https://basescan.org/address/0x6aA5baD99aC44bB008930c68CE2249549Cf10944) |
| PoseidonT3                                    | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://basescan.org/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                    | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://basescan.org/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                    | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://basescan.org/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                    | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://basescan.org/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |

### Base Sepolia

| Contract                                     | Address                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://sepolia.basescan.org/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| FreeForAllGatekeeper                         | [0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f](https://sepolia.basescan.org/address/0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f) |
| Verifier                                     | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://sepolia.basescan.org/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PollFactory                                  | [0x2F1A5B4F8F3B7348C66A1522622b1DB712261607](https://sepolia.basescan.org/address/0x2F1A5B4F8F3B7348C66A1522622b1DB712261607) |
| MessageProcessorFactory                      | [0xE4c9d4248F1371C5C61d406A9859f9FE667567a5](https://sepolia.basescan.org/address/0xE4c9d4248F1371C5C61d406A9859f9FE667567a5) |
| TallyFactory                                 | [0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C](https://sepolia.basescan.org/address/0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C) |
| MACI (stateTreeDepth = 10)                   | [0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761](https://sepolia.basescan.org/address/0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761) |
| VkRegistry (10-2-1-2 and 10-1-2)             | [0x6aA5baD99aC44bB008930c68CE2249549Cf10944](https://sepolia.basescan.org/address/0x6aA5baD99aC44bB008930c68CE2249549Cf10944) |
| PoseidonT3                                   | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://sepolia.basescan.org/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                   | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://sepolia.basescan.org/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                   | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://sepolia.basescan.org/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                   | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://sepolia.basescan.org/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |

## Raw JSON with deployed contracts and tx hashes

**packages/contracts/deployed-contracts.json**

```json
{
  "optimism_sepolia": {
    "instance": {
      "0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x8b62e4abe0db623981b8873a5f88f3c447b4202159e5d47b1d3158c1914afb91",
        "verify": {
          "args": "[\"99\"]"
        }
      },
      "0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x7fa84fe66edeb0f6d13999344289d0404eac443e52dab4c9b25d7415ff84e45b",
        "verify": {
          "args": "[]"
        }
      },
      "0xB1abb44291ff487f96636758b07Ccd9881f64c9A": {
        "id": "Verifier",
        "deploymentTxHash": "0x50377144a799369d26cb0f4de471a9c95a3b7de0a3aed18363cb1204ee45213a",
        "verify": {
          "args": "[]"
        }
      },
      "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x799a38ec8dfa740286f496da91d3549cfc923aa8f7c32cf0af2e03829ddb105f",
        "verify": {
          "args": "[]"
        }
      },
      "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0x82e8dedbfd9a583b7b09d5e3d7a0b14d0b7a5062438ab70d3154d15f888ef960",
        "verify": {
          "args": "[]"
        }
      },
      "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0xd57d72b7d519b81bd80b01c0b80669fb4c14b3b349b3d5555e7007ec0adae68d",
        "verify": {
          "args": "[]"
        }
      },
      "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xb37f2be891314378b5f8579ba5bd95df7b0f1652b4f91356ddeb9e86ea7311fe",
        "verify": {
          "args": "[]"
        }
      },
      "0xad844a9567ada5996FFC0D2DeC78b3767a1c0501": {
        "id": "PollFactory",
        "deploymentTxHash": "0x99a4dd853297e4aa9a824c509268926875f9ec2971b6c6e74b3179fd4f8845ca",
        "verify": {
          "args": "[]"
        }
      },
      "0xbBb6f1B4232F993e5a026217a3D596B332062CB3": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0xe817a6c240bdbb19a974f9a36eed9fd89794229496ed51db591b23382910bbb2",
        "verify": {
          "args": "[]"
        }
      },
      "0x1356f05179cdcAD2D8708B539A75de082118de92": {
        "id": "TallyFactory",
        "deploymentTxHash": "0x7b57994dccdbeeff25d9f7f58fde0f35cd10ce53eb160009c565033a370a0600",
        "verify": {
          "args": "[]"
        }
      },
      "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x1b05a22de2735ed74b58532303e7af01659b066206e696f4c8e6df61bc97f442",
        "verify": {
          "args": "[]"
        }
      },
      "0x6f9F7Fef2FF7F5D1Ff8966F751EC154146d8f431": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0xe5b6ce84a95af89c64cff82901bc26b96d67bf4ffb18d4e82ebfcbc19c4392f2",
        "verify": {
          "args": "[\"99\"]"
        }
      },
      "0x6b414ff158581Ac940797463a44221d0ba6A0B9C": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x5f7640018acb7155aa510e05cca92ad40003327dfe75fcab7d61bd21fefdea67",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "Verifier": {
        "address": "0xB1abb44291ff487f96636758b07Ccd9881f64c9A",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F",
        "count": 1
      },
      "PollFactory": {
        "address": "0xad844a9567ada5996FFC0D2DeC78b3767a1c0501",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xbBb6f1B4232F993e5a026217a3D596B332062CB3",
        "count": 1
      },
      "TallyFactory": {
        "address": "0x1356f05179cdcAD2D8708B539A75de082118de92",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC",
        "count": 1
      },
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x6f9F7Fef2FF7F5D1Ff8966F751EC154146d8f431",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x6b414ff158581Ac940797463a44221d0ba6A0B9C",
        "count": 1
      }
    }
  },
  "arbitrum_sepolia": {
    "instance": {
      "0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x897bfb740aba18fff51fcde7c5c1f97b2727f4a0122118fa300411684004211c",
        "verify": {
          "args": "[\"99\"]"
        }
      },
      "0x9e98cAA76492338627BAD0e5a6AA2762d827E169": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x5a740ad234560fab4097150f6c6acbf95224b4949ff3d82b477903a435a60621",
        "verify": {
          "args": "[]"
        }
      },
      "0xB400794f463d90ce5f462A43d8E6f9155656d02d": {
        "id": "Verifier",
        "deploymentTxHash": "0xbf743a2514c0a57bb7972a5a2cbaa2b57ffeac78c51ed730b5ccf29e2a428ad3",
        "verify": {
          "args": "[]"
        }
      },
      "0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x8c0f24d6d5837334143bf181ae74ae8c4d8218f40681146f88cc6d793b416065",
        "verify": {
          "args": "[]"
        }
      },
      "0x0CC8B7Aed7d79a8B948636242706265548D0B10a": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0xbc566db1ae8192e94418cfc9082d2a8f7dc71352438b92790a8ae9e01de86999",
        "verify": {
          "args": "[]"
        }
      },
      "0x43B519FF023757508311518AC41B5fA1CfD57181": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x28c63a2021aac9f0400affd73d9bd57de107a557bed40299ab0ee7adb58fdcb1",
        "verify": {
          "args": "[]"
        }
      },
      "0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xdfa42ab39a49f75c8d14cd750610b1cf2aaecf6f767362f732551416ae4445c5",
        "verify": {
          "args": "[]"
        }
      },
      "0xBa350B0cF67a0dEDa103A5d0d297bd120bF87E39": {
        "id": "PollFactory",
        "deploymentTxHash": "0x4a955482e8a4ecb0e275cb978980b2b85c765c0ced4e9005612ac989a5769d11",
        "verify": {
          "args": "[]"
        }
      },
      "0x96FD5e4E40671Bf8d5f1d0E3F3402488680B8376": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x51727155edfd8c178c583801f24714dd9e4fbdd6e7c9bbbe0e7663ea3d9a3198",
        "verify": {
          "args": "[]"
        }
      },
      "0xEEBc671e15B3f1c7483161F866d76ad84645d7C8": {
        "id": "TallyFactory",
        "deploymentTxHash": "0xc1c7e05a40164b8429517eed34b2042e593df11091840a9820451ee0d8f796c9",
        "verify": {
          "args": "[]"
        }
      },
      "0xE21F9Ea298b62032B3C2206955cd12c4Ab0a046b": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x2216dc97941a301e817d630a1a5ec31a7997f0d3ea5bcf5581defd374d8ab8aa",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x9e98cAA76492338627BAD0e5a6AA2762d827E169",
        "count": 1
      },
      "Verifier": {
        "address": "0xB400794f463d90ce5f462A43d8E6f9155656d02d",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0x0CC8B7Aed7d79a8B948636242706265548D0B10a",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0x43B519FF023757508311518AC41B5fA1CfD57181",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1",
        "count": 1
      },
      "PollFactory": {
        "address": "0xBa350B0cF67a0dEDa103A5d0d297bd120bF87E39",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0x96FD5e4E40671Bf8d5f1d0E3F3402488680B8376",
        "count": 1
      },
      "TallyFactory": {
        "address": "0xEEBc671e15B3f1c7483161F866d76ad84645d7C8",
        "count": 1
      },
      "VkRegistry": {
        "address": "0xE21F9Ea298b62032B3C2206955cd12c4Ab0a046b",
        "count": 1
      }
    }
  },
  "base_sepolia": {
    "instance": {
      "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x2d94f77f843c7f3f19eec1d0cac75a1260e0708e47ee9cb7fbf72c63ebcb156b",
        "verify": {
          "args": "[\"99\"]"
        }
      },
      "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x24c07b7ccc8ab143f03b03749ad81e4830456d4353f3c9783ffd08b3ea2d1004",
        "verify": {
          "args": "[]"
        }
      },
      "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27": {
        "id": "Verifier",
        "deploymentTxHash": "0x536d8665489c174d17d584b9dc3e6a6ccc595e5b232f8029879ae49e2c38c3d6",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0xc87ffe646d64cde4e819636490a8eb8d246233aeb58b42d06ff76ab04c07a301",
        "verify": {
          "args": "[]"
        }
      },
      "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0xcebcf39fd5857e595b50139004123c27a29c504ed12440c062833fcda2525848",
        "verify": {
          "args": "[]"
        }
      },
      "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x64d9db02a0b4cb29135e56becafe30c045919f20328e3d10a50f69f27add94e9",
        "verify": {
          "args": "[]"
        }
      },
      "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xfd556b278a7b10b70382207c733de3f9e97ad3e2ed6821a3acd16011f3b94084",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607": {
        "id": "PollFactory",
        "deploymentTxHash": "0xe89d4e3c14bd680691568382e38b9400034632672b802eb1ae684afc03f7bf82",
        "verify": {
          "args": "[]"
        }
      },
      "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x7d709c06be1a8055a9f12dc40eb71b27ce71fccddf5ffb1f488ed5ed3cadfbd6",
        "verify": {
          "args": "[]"
        }
      },
      "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C": {
        "id": "TallyFactory",
        "deploymentTxHash": "0xb5e583c45a53ac522d1025a0b594f3e58dd4fa1f837baadeb47bcc164eac0439",
        "verify": {
          "args": "[]"
        }
      },
      "0x6aA5baD99aC44bB008930c68CE2249549Cf10944": {
        "id": "VkRegistry",
        "deploymentTxHash": "0xdb1cbc7acc63c814dc238177adbf4012a1ccf743be3b2ef8ac2bde66177fe3a1",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f",
        "count": 1
      },
      "Verifier": {
        "address": "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E",
        "count": 1
      },
      "PollFactory": {
        "address": "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5",
        "count": 1
      },
      "TallyFactory": {
        "address": "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x6aA5baD99aC44bB008930c68CE2249549Cf10944",
        "count": 1
      }
    }
  },
  "scroll_sepolia": {
    "instance": {
      "0xB486cce9B4507A67Db147B0802D5673774C8D278": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x19fffe5a56c36405586b627d896513ca6949b654faac219e5d39041f7ce67d93",
        "verify": {
          "args": "[\"99\"]"
        }
      },
      "0x83dD551541C580e338206f1f677835D427C92dE2": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x637fbce4ecd191f31f768f3d46a67727c29e61149cd9d2f8830f2c685cda5019",
        "verify": {
          "args": "[]"
        }
      },
      "0xD5C41106db85EDd0298279AcFCE5A722060cc5f9": {
        "id": "Verifier",
        "deploymentTxHash": "0xeb106e6aa2ec41e7fd36306d843cdc2a70e6b2ed3e2156664177a23db29bf400",
        "verify": {
          "args": "[]"
        }
      },
      "0x88C2c6A7535463962A34757FE63cc4F296381aba": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0xe6f4d9bcbd8012fd7bf90aefe60818722cbeef7c40dff937aa4fb90c06e2384a",
        "verify": {
          "args": "[]"
        }
      },
      "0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0x041f2bfa9258dde9a411d9bf6155bdb9282dbd4eb4182cc9052e6285679c0ff1",
        "verify": {
          "args": "[]"
        }
      },
      "0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x197041bb741918efd7d1cb1ccdd58a76e53da56fdebfa7fa3f5850349cb457d6",
        "verify": {
          "args": "[]"
        }
      },
      "0xD2F6c828606Ad8e985008Cd825012f269B50CD58": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xff9c1393788a82b95c00b037bfac7fcb6857836e604bdadd42049cbf0d88537a",
        "verify": {
          "args": "[]"
        }
      },
      "0x982530673Ce9e5Efa02438c694d48327Aa4fB592": {
        "id": "PollFactory",
        "deploymentTxHash": "0x1a0ba85163df584ea645e3f4de1173d8e7c86d4bd1641b2f6f10d8d2a5cde971",
        "verify": {
          "args": "[]"
        }
      },
      "0x50045B05cb1C76410783D8A3e5625a99d5729339": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x85717a2b7f555c5a31d67a401b4c233a216de27c4e8ccbc8ead5ab4241f92dba",
        "verify": {
          "args": "[]"
        }
      },
      "0xbB28555E989799478442483CD1f2D370a14e2C42": {
        "id": "TallyFactory",
        "deploymentTxHash": "0xa7634556c12fb6e039fc189544b61ec5baa8fda94f5499e71751fa57e53c164e",
        "verify": {
          "args": "[]"
        }
      },
      "0x3D4C58074DCD8E6526885F465ab5F311b6B290B5": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x147fe06bd640870ef3e4dca188c89d8c75b35e3ce30bc9b972e0eae573658537",
        "verify": {
          "args": "[]"
        }
      },
      "0x33Cc5e8b6f158B9ee3600EcD3f3DE76c6B7765a7": {
        "id": "ZupassGatekeeper",
        "deploymentTxHash": "0xe6954597b9079895f6facc122e2a0bd9af00bc0401bf6f61d9d7824aed534754",
        "verify": {
          "args": "[\"280209352117126055869169359893920931853\",\"13908133709081944902758389525983124100292637002438232157513257158004852609027\",\"7654374482676219729919246464135900991450848628968334062174564799457623790084\",\"0xd81aB9859e1d423aC51170256BedD0Aa00e4eD5A\"]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0xB486cce9B4507A67Db147B0802D5673774C8D278",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x83dD551541C580e338206f1f677835D427C92dE2",
        "count": 1
      },
      "Verifier": {
        "address": "0xD5C41106db85EDd0298279AcFCE5A722060cc5f9",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x88C2c6A7535463962A34757FE63cc4F296381aba",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0xD2F6c828606Ad8e985008Cd825012f269B50CD58",
        "count": 1
      },
      "PollFactory": {
        "address": "0x982530673Ce9e5Efa02438c694d48327Aa4fB592",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0x50045B05cb1C76410783D8A3e5625a99d5729339",
        "count": 1
      },
      "TallyFactory": {
        "address": "0xbB28555E989799478442483CD1f2D370a14e2C42",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x3D4C58074DCD8E6526885F465ab5F311b6B290B5",
        "count": 1
      },
      "ZupassGatekeeper": {
        "address": "0x33Cc5e8b6f158B9ee3600EcD3f3DE76c6B7765a7",
        "count": 1
      }
    }
  },
  "base": {
    "instance": {
      "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x242651353bbceb375246239a73005c9d9359754e5739d354ad9f90b76e80be0c",
        "verify": {
          "args": "[\"200\"]"
        }
      },
      "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x9bd1a8595f8ab33fac82958a02dd8bfc59756d367c74a0c9d87718fdcf973060",
        "verify": {
          "args": "[]"
        }
      },
      "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27": {
        "id": "Verifier",
        "deploymentTxHash": "0x6eedd506c4339c14df939a98bd15b6e503eecc4e3a693dcb313a56a14ca7d8f9",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x0908efdd06741443bd38d57eab6d07daaa15f782a2eba0d485116580da21785d",
        "verify": {
          "args": "[]"
        }
      },
      "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0x4551ba77ad63c28cbf4910e2a3db99b6b8eb1a94e0d902c2366b08a8324b8819",
        "verify": {
          "args": "[]"
        }
      },
      "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x2dea3913d068f5c365b88da011b542f8c86daa78bff60b0239dfbc1284d8c6ef",
        "verify": {
          "args": "[]"
        }
      },
      "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0x56974c8cae477fba1c16ecebcf2bc929a112471e25e1779cdad3da43b45a6cd2",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607": {
        "id": "PollFactory",
        "deploymentTxHash": "0x9a9640ccb8a938f97729bfc78e891161082de511c10ab0b62b0e18edd514a017",
        "verify": {
          "args": "[]"
        }
      },
      "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x1a23828d513579f09360065323b553de620ae8ce7dfa487dc43397d30700f8fb",
        "verify": {
          "args": "[]"
        }
      },
      "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C": {
        "id": "TallyFactory",
        "deploymentTxHash": "0xa9afd6b34776d392bdeb5a8eea1c4d6692a2c0b000e131b9eecb4b5e0fc2bff6",
        "verify": {
          "args": "[]"
        }
      },
      "0x6aA5baD99aC44bB008930c68CE2249549Cf10944": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x15fd66ac9c193eae37b2b447621ff1d7603a4b55c54c73e0468f900136fc37cb",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f",
        "count": 1
      },
      "Verifier": {
        "address": "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E",
        "count": 1
      },
      "PollFactory": {
        "address": "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5",
        "count": 1
      },
      "TallyFactory": {
        "address": "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x6aA5baD99aC44bB008930c68CE2249549Cf10944",
        "count": 1
      },
      "MACI": {
        "address": "0xe98D62574B1b780b8C13B1917700001dc5FEc68a",
        "count": 1
      },
      "Poll": {
        "poll-0": {
          "address": "0xcc82063FAA821060AF76DDb7f4205AE370624d6b",
          "count": 1
        }
      },
      "MessageProcessor": {
        "poll-0": {
          "address": "0xaA2eAf2389B41Fd5B292C872352CbaC18BaD3bfD",
          "count": 1
        }
      },
      "Tally": {
        "poll-0": {
          "address": "0x989194c53be04Bd90BcbF2142e7050d011dCF048",
          "count": 1
        }
      },
      "AccQueueQuinaryMaci": {
        "poll-0": {
          "address": "0x688b36aa55B94Ff843C819ddd2fEE0e21c2Dc4e7",
          "count": 1
        }
      }
    }
  },
  "arbitrum": {
    "instance": {
      "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x72ef6fcc655bcd8bbc1d545b2a51ab44ce5291bb4fa548259c42de1325145952",
        "verify": {
          "args": "[\"200\"]"
        }
      },
      "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x9c0775b0288898a94f27865d46e5bd8872492b5df65cd177b150806aab7560a7",
        "verify": {
          "args": "[]"
        }
      },
      "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27": {
        "id": "Verifier",
        "deploymentTxHash": "0x4a1a77469dff336b80ed4ef8e7482b3a77b9e1c76e92e9bb0c3f3f3229b2ee4c",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x1479f77d3c9ccb71d3050097f9caa7c24632814282e1a530d8eefe7e34ab2949",
        "verify": {
          "args": "[]"
        }
      },
      "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0x3d203b3236acec539b1da934f43184924aef0cba84f375febe0919921fbea803",
        "verify": {
          "args": "[]"
        }
      },
      "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x7a4c8f1809958494685511cf25a70d4e2906bd074843b56ccf5ce5fd96e6f2f9",
        "verify": {
          "args": "[]"
        }
      },
      "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0x75853fcc0e430fdd3c4a7971d4e555161affdf93a7f5a4eaaa93c83c4c1ce94f",
        "verify": {
          "args": "[]"
        }
      },
      "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607": {
        "id": "PollFactory",
        "deploymentTxHash": "0x8315c48647621fa0cee54314ea49bcc851223eabd1f7dc9f3efcf307924ebd69",
        "verify": {
          "args": "[]"
        }
      },
      "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x1a30587862f43b3f2cb764cc18e4fbd09a55880bc059471998793ff4e92b6469",
        "verify": {
          "args": "[]"
        }
      },
      "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C": {
        "id": "TallyFactory",
        "deploymentTxHash": "0x960ed63cbea915e39b7dec78d22e83f3d2c710b902262217f2444202356d0880",
        "verify": {
          "args": "[]"
        }
      },
      "0x6aA5baD99aC44bB008930c68CE2249549Cf10944": {
        "id": "VkRegistry",
        "deploymentTxHash": "0xfeaaff43b313214986c4d1f3d3b610f5715be2c17bc10849e3cae776a505bd09",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f",
        "count": 1
      },
      "Verifier": {
        "address": "0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0x8778dA47eF619f56341fE95514e95fa0FF3B77C6",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E",
        "count": 1
      },
      "PollFactory": {
        "address": "0x2F1A5B4F8F3B7348C66A1522622b1DB712261607",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xE4c9d4248F1371C5C61d406A9859f9FE667567a5",
        "count": 1
      },
      "TallyFactory": {
        "address": "0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x6aA5baD99aC44bB008930c68CE2249549Cf10944",
        "count": 1
      }
    }
  },
  "optimism": {
    "instance": {
      "0x83dD551541C580e338206f1f677835D427C92dE2": {
        "id": "ConstantInitialVoiceCreditProxy",
        "deploymentTxHash": "0x44b638a8e359b5014ed77492755ade1d59cf6f5f72f39110c325e7fa463dad6a",
        "verify": {
          "args": "[\"200\"]"
        }
      },
      "0xD5C41106db85EDd0298279AcFCE5A722060cc5f9": {
        "id": "FreeForAllGatekeeper",
        "deploymentTxHash": "0x69c745b040908eb98e63065b1f5635d7d5176d0e331d37321c564ed1b6658a5c",
        "verify": {
          "args": "[]"
        }
      },
      "0x88C2c6A7535463962A34757FE63cc4F296381aba": {
        "id": "Verifier",
        "deploymentTxHash": "0x7f25d693564a17029b9bdfc0850a4c8ea30797e2096961558c5e05df4aa8175d",
        "verify": {
          "args": "[]"
        }
      },
      "0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66": {
        "id": "PoseidonT3",
        "deploymentTxHash": "0x25e4abb71a79528f8c76bcb83a1163597c80177091667ccb2fd2eb57af84b254",
        "verify": {
          "args": "[]"
        }
      },
      "0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274": {
        "id": "PoseidonT4",
        "deploymentTxHash": "0xff394431d7f8985936fc81009a461aa176b4e97a540b031771387e2b3a058ef5",
        "verify": {
          "args": "[]"
        }
      },
      "0xD2F6c828606Ad8e985008Cd825012f269B50CD58": {
        "id": "PoseidonT5",
        "deploymentTxHash": "0x64b18ed067fcd5aa9061255cace422992b0c02207d09a4f78e7182143bb05d88",
        "verify": {
          "args": "[]"
        }
      },
      "0x982530673Ce9e5Efa02438c694d48327Aa4fB592": {
        "id": "PoseidonT6",
        "deploymentTxHash": "0xbb20d4bdc02536ae1435cfcd4b07914161f028063d8cbf66cb8f79b2e2097929",
        "verify": {
          "args": "[]"
        }
      },
      "0x50045B05cb1C76410783D8A3e5625a99d5729339": {
        "id": "PollFactory",
        "deploymentTxHash": "0x65d63100f9eeea80513d6f8513af97e51dca6caf138488eb849f5ae600d2b5b1",
        "verify": {
          "args": "[]"
        }
      },
      "0xbB28555E989799478442483CD1f2D370a14e2C42": {
        "id": "MessageProcessorFactory",
        "deploymentTxHash": "0x74384358e8fba869c0d4be06e562a93d5020a0685ab428dbbab94068af5a6d4d",
        "verify": {
          "args": "[]"
        }
      },
      "0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0": {
        "id": "TallyFactory",
        "deploymentTxHash": "0x918e20d6b1c39d921efec9bf8ebcf46ff20449750633350b8a0b9281bb621cd2",
        "verify": {
          "args": "[]"
        }
      },
      "0x7E16271EaE58F52a0431F87Ee7E40c978178C63F": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x197b6b3cc28fda77c36a2b14d44c24f5b8aeff4d009939d200166476656ac521",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x83dD551541C580e338206f1f677835D427C92dE2",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0xD5C41106db85EDd0298279AcFCE5A722060cc5f9",
        "count": 1
      },
      "Verifier": {
        "address": "0x88C2c6A7535463962A34757FE63cc4F296381aba",
        "count": 1
      },
      "PoseidonT3": {
        "address": "0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66",
        "count": 1
      },
      "PoseidonT4": {
        "address": "0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274",
        "count": 1
      },
      "PoseidonT5": {
        "address": "0xD2F6c828606Ad8e985008Cd825012f269B50CD58",
        "count": 1
      },
      "PoseidonT6": {
        "address": "0x982530673Ce9e5Efa02438c694d48327Aa4fB592",
        "count": 1
      },
      "PollFactory": {
        "address": "0x50045B05cb1C76410783D8A3e5625a99d5729339",
        "count": 1
      },
      "MessageProcessorFactory": {
        "address": "0xbB28555E989799478442483CD1f2D370a14e2C42",
        "count": 1
      },
      "TallyFactory": {
        "address": "0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x7E16271EaE58F52a0431F87Ee7E40c978178C63F",
        "count": 1
      }
    },
    "verified": {
      "0x83dD551541C580e338206f1f677835D427C92dE2": true
    }
  }
}
```
