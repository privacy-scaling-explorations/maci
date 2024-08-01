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
| PoseidonT5                                   | [0x43B519FF023757508311518AC41B5fA1CfD57181](https://sepolia.arbiscan.io/address/0x43B519FF023757508311518AC41B5fA1CfD57181) |
| PoseidonT6                                   | [0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1](https://sepolia.arbiscan.io/address/0xb123798B1b21082100D289BeA24bFF0F8dfcbEe1) |

### Arbitrum Mainnet

| Contract   | Address                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| VkRegistry | [0x74569d524a193daC0D3Df17B9E207C916174745b](https://arbiscan.io/address/0x74569d524a193dac0d3df17b9e207c916174745b) |
| PoseidonT3 | [0xc8640cD00E00192949386E5be0c0b46C29CE8991](https://arbiscan.io/address/0xc8640cd00e00192949386e5be0c0b46c29ce891)  |
| PoseidonT4 | [0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2](https://arbiscan.io/address/0x4f02c99df5731C8C69f6baa62Aa4C9f99C529CE2) |
| PoseidonT5 | [0x89d4597b619598E3fe1Bf3E9b94e22ab8f931AdA](https://arbiscan.io/address/0x89d4597b619598E3fe1Bf3E9b94e22ab8f931AdA) |
| PoseidonT6 | [0xabf4B6395146719e8daCce6dd5f604993C7649E0](https://arbiscan.io/address/0xabf4B6395146719e8daCce6dd5f604993C7649E0) |

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
      "0x94f29E6d14A01c1330CE8f7421Db489Fe5A14976": {
        "id": "MACI",
        "deploymentTxHash": "0x2d6b3a6227101b91aabe847b9849a778332570ea77f6e33f51218b024af49798",
        "verify": {
          "args": "[\"0xad844a9567ada5996FFC0D2DeC78b3767a1c0501\",\"0xbBb6f1B4232F993e5a026217a3D596B332062CB3\",\"0x1356f05179cdcAD2D8708B539A75de082118de92\",\"0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45\",\"0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF\",10,\"16015576667038038422103932363190100635991292382181099511410843174865570503661,166510078825589460025300915201657086611944528317298994959376081297530246971,10057734083972610459557695472359628128485394923403014377687504571662791937025,4904828619307091008204672239231377290495002626534171783829482835985709082773,18694062287284245784028624966421731916526814537891066525886866373016385890569\"]"
        }
      },
      "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x1b05a22de2735ed74b58532303e7af01659b066206e696f4c8e6df61bc97f442",
        "verify": {
          "args": "[]"
        }
      }
    },
    "named": {
      "ConstantInitialVoiceCreditProxy": {
        "address": "0x4473aC3e68ad78D67757336ABaAa2Dced08cfcdF",
        "count": 1
      },
      "FreeForAllGatekeeper": {
        "address": "0xa4fF6765C207C84AbeFCe0226b24204f9ceBAB45",
        "count": 1
      },
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
      "MACI": {
        "address": "0x94f29E6d14A01c1330CE8f7421Db489Fe5A14976",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x42B1AB3d98B8235204E75112e5d9E974cE7531cC",
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
      "0x1446a1a1af027e58C8Bd29e231C01dB35b2F485E": {
        "id": "MACI",
        "deploymentTxHash": "0xa54de8b23459983b9f8f30064d9a5de5b24873dee6b9839f989d02c100320e64",
        "verify": {
          "args": "[\"0xBa350B0cF67a0dEDa103A5d0d297bd120bF87E39\",\"0x96FD5e4E40671Bf8d5f1d0E3F3402488680B8376\",\"0xEEBc671e15B3f1c7483161F866d76ad84645d7C8\",\"0x9e98cAA76492338627BAD0e5a6AA2762d827E169\",\"0x41a29A58A63A998c9Edde6883Bcec2d89835a8e9\",10,\"16015576667038038422103932363190100635991292382181099511410843174865570503661,166510078825589460025300915201657086611944528317298994959376081297530246971,10057734083972610459557695472359628128485394923403014377687504571662791937025,4904828619307091008204672239231377290495002626534171783829482835985709082773,18694062287284245784028624966421731916526814537891066525886866373016385890569\"]"
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
      "MACI": {
        "address": "0x1446a1a1af027e58C8Bd29e231C01dB35b2F485E",
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
      "0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761": {
        "id": "MACI",
        "deploymentTxHash": "0x8b6459ea14a920c61b17a8252ac37ebd5591f674128cb7abf3ba48e4e12b0419",
        "verify": {
          "args": "[\"0x2F1A5B4F8F3B7348C66A1522622b1DB712261607\",\"0xE4c9d4248F1371C5C61d406A9859f9FE667567a5\",\"0x57034389Dbe3DE1D1C14763f55B77A2279D6d43C\",\"0x8BA83Dd6E0E448417C519A38c90Ee570A4CA3e9f\",\"0x16FC13edD59D4b9F788Fb11A70eA022E1Bb1B856\",10,\"16015576667038038422103932363190100635991292382181099511410843174865570503661,166510078825589460025300915201657086611944528317298994959376081297530246971,10057734083972610459557695472359628128485394923403014377687504571662791937025,4904828619307091008204672239231377290495002626534171783829482835985709082773,18694062287284245784028624966421731916526814537891066525886866373016385890569\"]"
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
      "MACI": {
        "address": "0x78c3bF1b2Bc3A5512e274cA8407D2339Bb859761",
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
      "0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0": {
        "id": "MACI",
        "deploymentTxHash": "0x21ae94c2db74f83216aac20bfc437e3a74a46a997a8979af373dde683dc4feb9",
        "verify": {
          "args": "[\"0x982530673Ce9e5Efa02438c694d48327Aa4fB592\",\"0x50045B05cb1C76410783D8A3e5625a99d5729339\",\"0xbB28555E989799478442483CD1f2D370a14e2C42\",\"0x83dD551541C580e338206f1f677835D427C92dE2\",\"0xB486cce9B4507A67Db147B0802D5673774C8D278\",10,\"16015576667038038422103932363190100635991292382181099511410843174865570503661,166510078825589460025300915201657086611944528317298994959376081297530246971,10057734083972610459557695472359628128485394923403014377687504571662791937025,4904828619307091008204672239231377290495002626534171783829482835985709082773,18694062287284245784028624966421731916526814537891066525886866373016385890569\"]"
        }
      },
      "0x3D4C58074DCD8E6526885F465ab5F311b6B290B5": {
        "id": "VkRegistry",
        "deploymentTxHash": "0x147fe06bd640870ef3e4dca188c89d8c75b35e3ce30bc9b972e0eae573658537",
        "verify": {
          "args": "[]"
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
      "MACI": {
        "address": "0xdA10b22B81eb8EA6BC04aa9b86d3f9d969CD49F0",
        "count": 1
      },
      "VkRegistry": {
        "address": "0x3D4C58074DCD8E6526885F465ab5F311b6B290B5",
        "count": 1
      }
    }
  }
}
```
