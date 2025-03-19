---
title: Deployed MACI Smart Contracts
description: Deployed MACI Smart Contracts
sidebar_label: Deployed MACI Smart Contracts
sidebar_position: 2
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
You should change the -vk parameter to the VkRegistry address for the chain you are deploying to. Also you might need to modify the parameters based on the circuit configuration. Please refer to the [circuits page](/docs/technical-references/zk-snark-circuits/setup) for more information. Also you can add `-uq false` if you want to check non quadratic voting keys.
:::

## Contract Addresses

### Arbitrum Sepolia

| Contract                                     | Address                                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9](https://sepolia.arbiscan.io/address/0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9) |
| Verifier                                     | [0xB400794f463d90ce5f462A43d8E6f9155656d02d](https://sepolia.arbiscan.io/address/0xB400794f463d90ce5f462A43d8E6f9155656d02d) |
| PoseidonT3                                   | [0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A](https://sepolia.arbiscan.io/address/0xa0e0aC07c211D329ebA2D6ec552F4dC1B230A89A) |
| PoseidonT4                                   | [0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2](https://sepolia.arbiscan.io/address/0x0CC8B7Aed7d79a8B948636242706265548D0B10a) |
| PoseidonT5                                   | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://sepolia.arbiscan.io/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                   | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://sepolia.arbiscan.io/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |

### Arbitrum Mainnet

| Contract                                      | Address                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://arbiscan.io/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| Verifier                                      | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://arbiscan.io/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PoseidonT3                                    | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://arbiscan.io/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                    | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://arbiscan.io/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                    | [0x43B519FF023757508311518AC41B5fA1CfD57181](https://arbiscan.io/address/0x43B519FF023757508311518AC41B5fA1CfD57181) |
| PoseidonT6                                    | [0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1](https://arbiscan.io/address/0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1) |

### Optimism

| Contract                                      | Address                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x83dD551541C580e338206f1f677835D427C92dE2](https://optimistic.etherscan.io/address/0x83dD551541C580e338206f1f677835D427C92dE2) |
| Verifier                                      | [0x88C2c6A7535463962A34757FE63cc4F296381aba](https://optimistic.etherscan.io/address/0x88C2c6A7535463962A34757FE63cc4F296381aba) |
| PoseidonT3                                    | [0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66](https://optimistic.etherscan.io/address/0xF8E637e5c9EC3A8d8fa8843A6dF833348E1F1E66) |
| PoseidonT4                                    | [0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274](https://optimistic.etherscan.io/address/0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274) |
| PoseidonT5                                    | [0xD2F6c828606Ad8e985008Cd825012f269B50CD58](https://optimistic.etherscan.io/address/0xD2F6c828606Ad8e985008Cd825012f269B50CD58) |
| PoseidonT6                                    | [0x982530673Ce9e5Efa02438c694d48327Aa4fB592](https://optimistic.etherscan.io/address/0x982530673Ce9e5Efa02438c694d48327Aa4fB592) |

### Optimism Sepolia

| Contract                                     | Address                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF](https://sepolia-optimism.etherscan.io/address/0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF) |
| Verifier                                     | [0xB1abb44291ff487f96636758b07Ccd9881f64c9A](https://sepolia-optimism.etherscan.io/address/0xB1abb44291ff487f96636758b07Ccd9881f64c9A) |
| PoseidonT3                                   | [0x07490eba00dc4ACA6721D052Fa4C5002Aa077233](https://sepolia-optimism.etherscan.io/address/0x07490eba00dc4ACA6721D052Fa4C5002Aa077233) |
| PoseidonT4                                   | [0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d](https://sepolia-optimism.etherscan.io/address/0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d) |
| PoseidonT5                                   | [0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679](https://sepolia-optimism.etherscan.io/address/0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679) |
| PoseidonT6                                   | [0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F](https://sepolia-optimism.etherscan.io/address/0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F) |

### Scroll Sepolia

| Contract                                     | Address                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0xB486cce9B4507A67Db147B0802D5673774C8D278](https://sepolia.scrollscan.com/address/0xB486cce9B4507A67Db147B0802D5673774C8D278) |
| Verifier                                     | [0xD5C41106db85EDd0298279AcFCE5A722060cc5f9](https://sepolia.scrollscan.com/address/0xD5C41106db85EDd0298279AcFCE5A722060cc5f9) |
| PoseidonT3                                   | [0x88C2c6A7535463962A34757FE63cc4F296381aba](https://sepolia.scrollscan.com/address/0x88C2c6A7535463962A34757FE63cc4F296381aba) |
| PoseidonT4                                   | [0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274](https://sepolia.scrollscan.com/address/0x0a0D66baFDa8c8838281084d9C3d68Dd9a6Fc274) |
| PoseidonT5                                   | [0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679](https://sepolia.scrollscan.com/address/0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679) |
| PoseidonT6                                   | [0xD2F6c828606Ad8e985008Cd825012f269B50CD58](https://sepolia.scrollscan.com/address/0xD2F6c828606Ad8e985008Cd825012f269B50CD58) |

### Base

| Contract                                      | Address                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (200 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://basescan.org/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| Verifier                                      | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://basescan.org/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PoseidonT3                                    | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://basescan.org/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                    | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://basescan.org/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                    | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://basescan.org/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                    | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://basescan.org/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |

### Base Sepolia

| Contract                                     | Address                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ConstantInitialVoiceCreditProxy (99 Credits) | [0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856](https://sepolia.basescan.org/address/0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856) |
| Verifier                                     | [0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27](https://sepolia.basescan.org/address/0x2427Ab201488Ac81Bec421F179B1Be23c55ebC27) |
| PoseidonT3                                   | [0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4](https://sepolia.basescan.org/address/0x2F1398ab5E322d357dF8CdD2e7ba73122c5FDDA4) |
| PoseidonT4                                   | [0x8778dA47eF619f56341fE95514e95fa0FF3B77C6](https://sepolia.basescan.org/address/0x8778dA47eF619f56341fE95514e95fa0FF3B77C6) |
| PoseidonT5                                   | [0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968](https://sepolia.basescan.org/address/0xB8Bc2c7cF71441fF7E6F111D3457e3d61c564968) |
| PoseidonT6                                   | [0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E](https://sepolia.basescan.org/address/0x37282fEde56aa1d7266Ecb12DC3b342D12044e2E) |
