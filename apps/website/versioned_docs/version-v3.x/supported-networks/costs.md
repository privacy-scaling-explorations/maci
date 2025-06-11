---
title: MACI Deployment and Operation Costs
description: MACI Deployment and Operation Costs
sidebar_label: MACI Deployment and Operation Costs
sidebar_position: 3
---

## Notes

- Prices are estimates and will vary based on actual gas prices and ETH/USD exchange rates.
- These values assume a consistent gas price across operations, which may vary on-chain.

## Costs on Polygon zkEVM

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.012 gwei
- **ETH price**: $2595

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.00402   |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.00122   |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.0016    |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00413   |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.00379   |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.00497   |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.00413   |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.00402   |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.00413   |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.00494   |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.00564   |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.00413   |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.00286   |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.00413   |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.00402   |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.00413   |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.0054    |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.00413   |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581626 | 0.05052   |
| MACI                                     | signUp                     | 197667  | 730480  | 315320  | 0.01007   |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0038    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00413   |
| MessageProcessor                         | processMessages            | 252019  | 252918  | 252319  | 0.00806   |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334837  | 0.0107    |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.00815   |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.00262   |
| Poll                                     | publishMessage             | -       | -       | 358725  | 0.01146   |
| Poll                                     | publishMessageBatch        | -       | -       | 671490  | 0.02145   |
| Poll                                     | relayMessagesBatch         | -       | -       | 155235  | 0.00496   |
| PollFactory                              | deploy                     | -       | -       | 1099100 | 0.03511   |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.00339   |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.00413   |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.24207   |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161585  | 0.00516   |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.0031    |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.00413   |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.01447   |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.01447   |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.02829   |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.05711   |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.00659   |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.00413   |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9%       | 0.01813   |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5%       | 0.02426   |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3%       | 0.01213   |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1%       | 0.01991   |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3%       | 0.02206   |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5%       | 0.01426   |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3%       | 0.02188   |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5%       | 0.01483   |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6%       | 0.01540   |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3%       | 0.02191   |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1%       | 0.01054   |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2%       | 0.02088   |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5%       | 0.01482   |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3%       | 0.02195   |
| Hasher                                   | -       | -       | 426472  | 1.4%       | 0.01362   |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9%       | 0.01829   |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3%       | 0.02187   |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0%       | 0.05761   |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6%       | 0.01572   |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3%       | 0.02192   |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1%       | 0.05809   |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4%      | 0.11885   |
| PoseidonT3                               | -       | -       | 2157126 | 7.2%       | 0.06891   |
| PoseidonT4                               | -       | -       | 2745274 | 9.2%       | 0.0877    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9%      | 0.11404   |
| PoseidonT6                               | -       | -       | 4261625 | 14.2%      | 0.13613   |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9%       | 0.01781   |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5%       | 0.02394   |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3%       | 0.06953   |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5%       | 0.01392   |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3%       | 0.02207   |
| Utilities                                | -       | -       | 664356  | 2.2%       | 0.02122   |
| Verifier                                 | -       | -       | 775226  | 2.6%       | 0.02476   |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9%       | 0.05609   |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1%       | 0.02046   |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7%       | 0.03542   |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6%       | 0.0251    |

</details>

## Costs on Scroll

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.016 gwei
- **ETH price**: $2493

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.00496   |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.0016    |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.00208   |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00512   |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.0048    |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.00624   |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.00512   |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.00496   |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.00512   |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.00624   |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.00704   |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.00512   |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.00352   |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.00512   |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.00496   |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.00512   |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.00672   |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.00512   |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581630 | 0.06304   |
| MACI                                     | signUp                     | 197667  | 730492  | 315320  | 0.01264   |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0048    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00512   |
| MessageProcessor                         | processMessages            | 252007  | 252918  | 252317  | 0.01008   |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334835  | 0.01328   |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.01024   |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.0032    |
| Poll                                     | publishMessage             | -       | -       | 358725  | 0.01424   |
| Poll                                     | publishMessageBatch        | -       | -       | 671502  | 0.02672   |
| Poll                                     | relayMessagesBatch         | -       | -       | 155235  | 0.00624   |
| PollFactory                              | deploy                     | -       | -       | 1099088 | 0.04384   |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.00416   |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.00512   |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.30224   |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161585  | 0.0064    |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.00384   |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.00512   |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.01808   |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.01808   |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.03536   |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.07136   |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.00816   |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.00512   |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Block Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9 %            | 0.02272   |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5 %            | 0.03024   |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3 %            | 0.0152    |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1 %            | 0.0248    |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3 %            | 0.02752   |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5 %            | 0.01776   |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3 %            | 0.02736   |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5 %            | 0.01856   |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6 %            | 0.0192    |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3 %            | 0.02736   |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1 %            | 0.01312   |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2 %            | 0.02608   |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5 %            | 0.01856   |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3 %            | 0.02736   |
| Hasher                                   | -       | -       | 426472  | 1.4 %            | 0.01696   |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9 %            | 0.02288   |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3 %            | 0.02736   |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0 %            | 0.072     |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6 %            | 0.01968   |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3 %            | 0.02736   |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1 %            | 0.07248   |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4 %           | 0.14848   |
| PoseidonT3                               | -       | -       | 2157126 | 7.2 %            | 0.08608   |
| PoseidonT4                               | -       | -       | 2745274 | 9.2 %            | 0.1096    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9 %           | 0.1424    |
| PoseidonT6                               | -       | -       | 4261625 | 14.2 %           | 0.17008   |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9 %            | 0.02224   |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5 %            | 0.02992   |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3 %            | 0.08688   |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5 %            | 0.01744   |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3 %            | 0.02752   |
| Utilities                                | -       | -       | 664356  | 2.2 %            | 0.02656   |
| Verifier                                 | -       | -       | 775226  | 2.6 %            | 0.03088   |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9 %            | 0.07008   |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1 %            | 0.0256    |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7 %            | 0.04416   |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6 %            | 0.03136   |

</details>

## Costs on Linea

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.04 gwei
- **ETH price**: $2508

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.0126    |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.0038    |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.005     |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.013     |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.0119    |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.0156    |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.013     |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.0126    |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.013     |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.0155    |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.0177    |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.013     |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.009     |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.013     |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.0126    |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.013     |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.017     |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.013     |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581626 | 0.1587    |
| MACI                                     | signUp                     | 197667  | 730504  | 315320  | 0.0316    |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0119    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.013     |
| MessageProcessor                         | processMessages            | 252019  | 252918  | 252319  | 0.0253    |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334838  | 0.0336    |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.0256    |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.0082    |
| Poll                                     | publishMessage             | -       | -       | 358737  | 0.0360    |
| Poll                                     | publishMessageBatch        | -       | -       | 671538  | 0.0674    |
| Poll                                     | relayMessagesBatch         | -       | -       | 155223  | 0.0156    |
| PollFactory                              | deploy                     | -       | -       | 1099100 | 0.1103    |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.0106    |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.013     |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.7604    |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161584  | 0.0162    |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.0098    |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.013     |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.0455    |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.0455    |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.0889    |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.1794    |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.0207    |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.013     |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Block Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9 %            | 0.057     |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5 %            | 0.0762    |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3 %            | 0.0381    |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1 %            | 0.0625    |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3 %            | 0.0693    |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5 %            | 0.0448    |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3 %            | 0.0687    |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5 %            | 0.0466    |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6 %            | 0.0484    |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3 %            | 0.0688    |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1 %            | 0.0331    |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2 %            | 0.0656    |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5 %            | 0.0466    |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3 %            | 0.0689    |
| Hasher                                   | -       | -       | 426472  | 1.4 %            | 0.0428    |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9 %            | 0.0575    |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3 %            | 0.0687    |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0 %            | 0.181     |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6 %            | 0.0494    |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3 %            | 0.0689    |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1 %            | 0.1825    |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4 %           | 0.3734    |
| PoseidonT3                               | -       | -       | 2157126 | 7.2 %            | 0.2165    |
| PoseidonT4                               | -       | -       | 2745274 | 9.2 %            | 0.2755    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9 %           | 0.3582    |
| PoseidonT6                               | -       | -       | 4261625 | 14.2 %           | 0.4277    |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9 %            | 0.0560    |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5 %            | 0.0752    |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3 %            | 0.2184    |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5 %            | 0.0437    |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3 %            | 0.0693    |
| Utilities                                | -       | -       | 664356  | 2.2 %            | 0.0667    |
| Verifier                                 | -       | -       | 775226  | 2.6 %            | 0.0778    |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9 %            | 0.1762    |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1 %            | 0.0643    |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7 %            | 0.1113    |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6 %            | 0.0788    |

</details>

## Costs on ZkSync Era

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.04 gwei
- **ETH price**: $2508

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.0126    |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.0038    |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.005     |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.013     |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.0119    |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.0156    |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.013     |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.0126    |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.013     |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.0155    |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.0177    |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.013     |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.009     |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.013     |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.0126    |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.013     |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.017     |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.013     |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581626 | 0.1587    |
| MACI                                     | signUp                     | 197667  | 730504  | 315320  | 0.0316    |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0119    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.013     |
| MessageProcessor                         | processMessages            | 252019  | 252918  | 252319  | 0.0253    |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334838  | 0.0336    |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.0256    |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.0082    |
| Poll                                     | publishMessage             | -       | -       | 358737  | 0.0360    |
| Poll                                     | publishMessageBatch        | -       | -       | 671538  | 0.0674    |
| Poll                                     | relayMessagesBatch         | -       | -       | 155223  | 0.0156    |
| PollFactory                              | deploy                     | -       | -       | 1099100 | 0.1103    |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.0106    |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.013     |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.7604    |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161584  | 0.0162    |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.0098    |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.013     |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.0455    |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.0455    |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.0889    |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.1794    |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.0207    |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.013     |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Block Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9 %            | 0.057     |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5 %            | 0.0762    |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3 %            | 0.0381    |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1 %            | 0.0625    |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3 %            | 0.0693    |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5 %            | 0.0448    |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3 %            | 0.0687    |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5 %            | 0.0466    |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6 %            | 0.0484    |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3 %            | 0.0688    |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1 %            | 0.0331    |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2 %            | 0.0656    |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5 %            | 0.0466    |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3 %            | 0.0689    |
| Hasher                                   | -       | -       | 426472  | 1.4 %            | 0.0428    |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9 %            | 0.0575    |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3 %            | 0.0687    |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0 %            | 0.181     |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6 %            | 0.0494    |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3 %            | 0.0689    |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1 %            | 0.1825    |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4 %           | 0.3734    |
| PoseidonT3                               | -       | -       | 2157126 | 7.2 %            | 0.2165    |
| PoseidonT4                               | -       | -       | 2745274 | 9.2 %            | 0.2755    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9 %           | 0.3582    |
| PoseidonT6                               | -       | -       | 4261625 | 14.2 %           | 0.4277    |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9 %            | 0.0560    |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5 %            | 0.0752    |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3 %            | 0.2184    |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5 %            | 0.0437    |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3 %            | 0.0693    |
| Utilities                                | -       | -       | 664356  | 2.2 %            | 0.0667    |
| Verifier                                 | -       | -       | 775226  | 2.6 %            | 0.0778    |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9 %            | 0.1762    |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1 %            | 0.0643    |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7 %            | 0.1113    |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6 %            | 0.0788    |

</details>

## Costs on Ethereum Mainnet

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 7 gwei
- **ETH price**: $2526

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 2.23      |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.67      |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.89      |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 2.29      |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 2.10      |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 2.75      |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 2.29      |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 2.23      |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 2.29      |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 2.74      |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 3.12      |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 2.29      |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 1.58      |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 2.29      |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 2.23      |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 2.29      |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 2.99      |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 2.29      |
| MACI                                     | deployPoll                 | 1580777 | 1583817 | 1581631 | 27.98     |
| MACI                                     | signUp                     | 197667  | 730504  | 315320  | 5.58      |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 2.11      |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 2.29      |
| MessageProcessor                         | processMessages            | 252065  | 252976  | 252375  | 4.46      |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334836  | 5.92      |
| Poll                                     | mergeState                 | 176483  | 331802  | 232886  | 4.12      |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 1.45      |
| Poll                                     | publishMessage             | -       | -       | 358677  | 6.34      |
| Poll                                     | publishMessageBatch        | -       | -       | 671442  | 11.88     |
| Poll                                     | relayMessagesBatch         | -       | -       | 155223  | 2.75      |
| PollFactory                              | deploy                     | -       | -       | 1099100 | 19.44     |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 1.88      |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 2.29      |
| Tally                                    | addTallyResults            | 7312489 | 7844939 | 7578714 | 134.05    |
| Tally                                    | tallyVotes                 | 147320  | 204580  | 161641  | 2.86      |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 1.72      |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 2.29      |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 8.01      |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 8.01      |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 15.66     |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 31.62     |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 3.65      |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 2.29      |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Block Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9 %            | 10.04     |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5 %            | 13.43     |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3 %            | 6.72      |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1 %            | 11.02     |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3 %            | 12.21     |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5 %            | 7.90      |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3 %            | 12.11     |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5 %            | 8.21      |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6 %            | 8.53      |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3 %            | 12.13     |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1 %            | 5.84      |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2 %            | 11.56     |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5 %            | 8.21      |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3 %            | 12.15     |
| Hasher                                   | -       | -       | 426472  | 1.4 %            | 7.54      |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9 %            | 10.13     |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3 %            | 12.11     |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6 %              | 31.90     |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6 %            | 8.70      |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3 %            | 12.14     |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1 %            | 32.16     |
| PollFactory                              | 3725815 | 3725863 | 3725858 | 12.4 %           | 65.90     |
| PoseidonT3                               | -       | -       | 2157126 | 7.2 %            | 38.15     |
| PoseidonT4                               | -       | -       | 2745274 | 9.2 %            | 48.56     |
| PoseidonT5                               | -       | -       | 3569887 | 11.9 %           | 63.14     |
| PoseidonT6                               | -       | -       | 4261625 | 14.2 %           | 75.38     |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9 %            | 9.86      |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5 %            | 13.26     |
| TallyFactory                             | 2207358 | 2207382 | 2207379 | 7.4 %            | 39.04     |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5 %            | 7.71      |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3 %            | 12.22     |
| Utilities                                | -       | -       | 664356  | 2.2 %            | 11.75     |
| Verifier                                 | -       | -       | 775226  | 2.6 %            | 13.71     |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9 %            | 31.06     |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1 %            | 11.33     |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7 %            | 19.61     |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6 %            | 13.90     |

</details>

## Costs on Arbitrum

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.012 gwei
- **ETH price**: $2595

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.00402   |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.00122   |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.0016    |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00413   |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.00379   |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.00497   |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.00413   |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.00402   |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.00413   |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.00494   |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.00564   |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.00413   |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.00286   |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.00413   |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.00402   |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.00413   |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.0054    |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.00413   |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581626 | 0.05052   |
| MACI                                     | signUp                     | 197667  | 730480  | 315320  | 0.01007   |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0038    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00413   |
| MessageProcessor                         | processMessages            | 252019  | 252918  | 252319  | 0.00806   |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334837  | 0.0107    |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.00815   |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.00262   |
| Poll                                     | publishMessage             | -       | -       | 358725  | 0.01146   |
| Poll                                     | publishMessageBatch        | -       | -       | 671490  | 0.02145   |
| Poll                                     | relayMessagesBatch         | -       | -       | 155235  | 0.00496   |
| PollFactory                              | deploy                     | -       | -       | 1099100 | 0.03511   |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.00339   |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.00413   |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.24207   |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161585  | 0.00516   |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.0031    |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.00413   |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.01447   |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.01447   |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.02829   |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.05711   |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.00659   |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.00413   |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9%       | 0.01813   |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5%       | 0.02426   |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3%       | 0.01213   |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1%       | 0.01991   |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3%       | 0.02206   |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5%       | 0.01426   |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3%       | 0.02188   |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5%       | 0.01483   |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6%       | 0.01540   |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3%       | 0.02191   |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1%       | 0.01054   |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2%       | 0.02088   |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5%       | 0.01482   |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3%       | 0.02195   |
| Hasher                                   | -       | -       | 426472  | 1.4%       | 0.01362   |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9%       | 0.01829   |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3%       | 0.02187   |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0%       | 0.05761   |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6%       | 0.01572   |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3%       | 0.02192   |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1%       | 0.05809   |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4%      | 0.11885   |
| PoseidonT3                               | -       | -       | 2157126 | 7.2%       | 0.06891   |
| PoseidonT4                               | -       | -       | 2745274 | 9.2%       | 0.0877    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9%      | 0.11404   |
| PoseidonT6                               | -       | -       | 4261625 | 14.2%      | 0.13613   |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9%       | 0.01781   |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5%       | 0.02394   |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3%       | 0.06953   |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5%       | 0.01392   |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3%       | 0.02207   |
| Utilities                                | -       | -       | 664356  | 2.2%       | 0.02122   |
| Verifier                                 | -       | -       | 775226  | 2.6%       | 0.02476   |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9%       | 0.05609   |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1%       | 0.02046   |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7%       | 0.03542   |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6%       | 0.0251    |

</details>

## Costs on Optimism

Below are the estimated costs for various MACI operations and deployments, assuming:

- **Gas price**: 0.016 gwei
- **ETH price**: $2493

<details>
<summary>Contract calls cost</summary>

| Contract                                 | Method                     | Min     | Max     | Avg     | USD (avg) |
| ---------------------------------------- | -------------------------- | ------- | ------- | ------- | --------- |
| AnonAadhaarCheckerFactory                | deploy                     | -       | -       | 125971  | 0.00496   |
| AnonAadhaarPolicy                        | enforce                    | -       | -       | 38141   | 0.0016    |
| AnonAadhaarPolicy                        | setTarget                  | 50133   | 50167   | 50149   | 0.00208   |
| AnonAadhaarPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00512   |
| ConstantInitialVoiceCreditProxyFactory   | deploy                     | -       | -       | 118665  | 0.0048    |
| EASCheckerFactory                        | deploy                     | -       | -       | 155556  | 0.00624   |
| EASPolicyFactory                         | deploy                     | -       | -       | 129387  | 0.00512   |
| ERC20CheckerFactory                      | deploy                     | -       | -       | 125959  | 0.00496   |
| ERC20PolicyFactory                       | deploy                     | -       | -       | 129365  | 0.00512   |
| ERC20VotesCheckerFactory                 | deploy                     | -       | -       | 154673  | 0.00624   |
| ERC20VotesInitialVoiceCreditProxyFactory | deploy                     | -       | -       | 176590  | 0.00704   |
| ERC20VotesPolicyFactory                  | deploy                     | -       | -       | 129365  | 0.00512   |
| FreeForAllCheckerFactory                 | deploy                     | -       | -       | 89376   | 0.00352   |
| FreeForAllPolicyFactory                  | deploy                     | 129375  | 129387  | 129386  | 0.00512   |
| GitcoinPassportCheckerFactory            | deploy                     | -       | -       | 125937  | 0.00496   |
| GitcoinPassportPolicyFactory             | deploy                     | -       | -       | 129365  | 0.00512   |
| HatsCheckerFactory                       | deploy                     | -       | -       | 169023  | 0.00672   |
| HatsPolicyFactory                        | deploy                     | -       | -       | 129387  | 0.00512   |
| MACI                                     | deployPoll                 | 1580765 | 1583829 | 1581630 | 0.06304   |
| MACI                                     | signUp                     | 197667  | 730492  | 315320  | 0.01264   |
| MerkleProofCheckerFactory                | deploy                     | -       | -       | 119047  | 0.0048    |
| MerkleProofPolicyFactory                 | deploy                     | -       | -       | 129387  | 0.00512   |
| MessageProcessor                         | processMessages            | 252007  | 252918  | 252317  | 0.01008   |
| Poll                                     | joinPoll                   | 282314  | 503970  | 334835  | 0.01328   |
| Poll                                     | mergeState                 | 198686  | 354005  | 255089  | 0.01024   |
| Poll                                     | padLastBatch               | -       | -       | 81884   | 0.0032    |
| Poll                                     | publishMessage             | -       | -       | 358725  | 0.01424   |
| Poll                                     | publishMessageBatch        | -       | -       | 671502  | 0.02672   |
| Poll                                     | relayMessagesBatch         | -       | -       | 155235  | 0.00624   |
| PollFactory                              | deploy                     | -       | -       | 1099088 | 0.04384   |
| SemaphoreCheckerFactory                  | deploy                     | -       | -       | 106047  | 0.00416   |
| SemaphorePolicyFactory                   | deploy                     | -       | -       | 129387  | 0.00512   |
| Tally                                    | addTallyResults            | 7311562 | 7844012 | 7577787 | 0.30224   |
| Tally                                    | tallyVotes                 | 147262  | 204522  | 161585  | 0.0064    |
| TokenCheckerFactory                      | deploy                     | -       | -       | 97197   | 0.00384   |
| TokenPolicyFactory                       | deploy                     | -       | -       | 129387  | 0.00512   |
| VerifyingKeysRegistry                    | setPollJoinedVerifyingKey  | -       | -       | 453033  | 0.01808   |
| VerifyingKeysRegistry                    | setPollJoiningVerifyingKey | -       | -       | 453011  | 0.01808   |
| VerifyingKeysRegistry                    | setVerifyingKeys           | 885514  | 885526  | 885517  | 0.03536   |
| VerifyingKeysRegistry                    | setVerifyingKeysBatch      | -       | -       | 1787720 | 0.07136   |
| ZupassCheckerFactory                     | deploy                     | -       | -       | 206318  | 0.00816   |
| ZupassPolicyFactory                      | deploy                     | -       | -       | 129365  | 0.00512   |

</details>

<details>
<summary>Deployment cost</summary>

| Deployments                              | Min Gas | Max Gas | Avg Gas | % of Block Limit | USD (avg) |
| ---------------------------------------- | ------- | ------- | ------- | ---------------- | --------- |
| AnonAadhaarCheckerFactory                | -       | -       | 567621  | 1.9 %            | 0.02272   |
| AnonAadhaarPolicyFactory                 | -       | -       | 759390  | 2.5 %            | 0.03024   |
| ConstantInitialVoiceCreditProxyFactory   | -       | -       | 379812  | 1.3 %            | 0.0152    |
| EASCheckerFactory                        | -       | -       | 623304  | 2.1 %            | 0.0248    |
| EASPolicyFactory                         | -       | -       | 690560  | 2.3 %            | 0.02752   |
| ERC20CheckerFactory                      | -       | -       | 446429  | 1.5 %            | 0.01776   |
| ERC20PolicyFactory                       | -       | -       | 684892  | 2.3 %            | 0.02736   |
| ERC20VotesCheckerFactory                 | -       | -       | 464123  | 1.5 %            | 0.01856   |
| ERC20VotesInitialVoiceCreditProxyFactory | -       | -       | 482127  | 1.6 %            | 0.0192    |
| ERC20VotesPolicyFactory                  | -       | -       | 685960  | 2.3 %            | 0.02736   |
| FreeForAllCheckerFactory                 | -       | -       | 329927  | 1.1 %            | 0.01312   |
| FreeForAllPolicyFactory                  | -       | -       | 653501  | 2.2 %            | 0.02608   |
| GitcoinPassportCheckerFactory            | -       | -       | 463912  | 1.5 %            | 0.01856   |
| GitcoinPassportPolicyFactory             | -       | -       | 687052  | 2.3 %            | 0.02736   |
| Hasher                                   | -       | -       | 426472  | 1.4 %            | 0.01696   |
| HatsCheckerFactory                       | -       | -       | 572538  | 1.9 %            | 0.02288   |
| HatsPolicyFactory                        | -       | -       | 684664  | 2.3 %            | 0.02736   |
| MACI                                     | 1803354 | 1803438 | 1803408 | 6.0 %            | 0.072     |
| MerkleProofCheckerFactory                | -       | -       | 491985  | 1.6 %            | 0.01968   |
| MerkleProofPolicyFactory                 | -       | -       | 686188  | 2.3 %            | 0.02736   |
| MessageProcessorFactory                  | 1818377 | 1818401 | 1818398 | 6.1 %            | 0.07248   |
| PollFactory                              | 3720635 | 3720683 | 3720678 | 12.4 %           | 0.14848   |
| PoseidonT3                               | -       | -       | 2157126 | 7.2 %            | 0.08608   |
| PoseidonT4                               | -       | -       | 2745274 | 9.2 %            | 0.1096    |
| PoseidonT5                               | -       | -       | 3569887 | 11.9 %           | 0.1424    |
| PoseidonT6                               | -       | -       | 4261625 | 14.2 %           | 0.17008   |
| SemaphoreCheckerFactory                  | -       | -       | 557606  | 1.9 %            | 0.02224   |
| SemaphorePolicyFactory                   | -       | -       | 749517  | 2.5 %            | 0.02992   |
| TallyFactory                             | 2176647 | 2176671 | 2176668 | 7.3 %            | 0.08688   |
| TokenCheckerFactory                      | -       | -       | 435769  | 1.5 %            | 0.01744   |
| TokenPolicyFactory                       | -       | -       | 690920  | 2.3 %            | 0.02752   |
| Utilities                                | -       | -       | 664356  | 2.2 %            | 0.02656   |
| Verifier                                 | -       | -       | 775226  | 2.6 %            | 0.03088   |
| VerifyingKeysRegistry                    | -       | -       | 1755862 | 5.9 %            | 0.07008   |
| ZupassCheckerFactory                     | -       | -       | 640425  | 2.1 %            | 0.0256    |
| ZupassGroth16Verifier                    | -       | -       | 1108706 | 3.7 %            | 0.04416   |
| ZupassPolicyFactory                      | -       | -       | 785744  | 2.6 %            | 0.03136   |

</details>
