---
title: Deployed MACI Smart Contracts
description: Deployed MACI Smart Contracts
sidebar_label: Deployed MACI Smart Contracts
sidebar_position: 10
---

There are a number of MACI's smart contracts which can be re-used by different deployments. These are the following:

- [VkRegistry](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/VkRegistry.sol)
- [PoseidonHashers](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/crypto/Hasher.sol)

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

| Contract   | Address                                                                                                              | Chain            |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ---------------- |
| VkRegistry | [0x74569d524a193daC0D3Df17B9E207C916174745b](https://arbiscan.io/address/0x74569d524a193dac0d3df17b9e207c916174745b) | Arbitrum Mainnet |
| PoseidonT3 | [0xc8640cD00E00192949386E5be0c0b46C29CE8991](https://arbiscan.io/address/0xc8640cd00e00192949386e5be0c0b46c29ce891)  | Arbitrum Mainnet |
| PoseidonT4 | [0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2](https://arbiscan.io/address/0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2) | Arbitrum Mainnet |
| PoseidonT5 | [0x89d4597b619598E3fe1Bf3E9b94e22ab8f931AdA](https://arbiscan.io/address/0x89d4597b619598E3fe1Bf3E9b94e22ab8f931AdA) | Arbitrum Mainnet |
| PoseidonT6 | [0xabf4B6395146719e8daCce6dd5f604993C7649E0](https://arbiscan.io/address/0xabf4B6395146719e8daCce6dd5f604993C7649E0) | Arbitrum Mainnet |
