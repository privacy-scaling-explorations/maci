---
title: Supported Networks
description: Supported Networks
sidebar_label: Supported Networks
sidebar_position: 11
---

MACI has been tested on the following EVM networks:

- Optimism
- Optimism Sepolia
- Arbitrum
- Arbitrum Sepolia
- Base
- Base Sepolia
- Gnosis
- Gnosis Chiado
- Polygon
- Polygon Amoy

We recommend using either Optimism, Arbitrum or Base. Please open an issue/PR if you intend to use other EVM networks and would like to contribute to this record of deployed and verified contracts as well as benchmarks, that would be greatly appreciated.

## Limitations

For better UX, MACI clients should be sending votes (messages) in batches. Depending on the number of vote options available, larger batch might be sent. Below you can find the largest batch you can send for each network and how much gas it consumes:

| Network          | Max Batch Size | Gas used | Price (based on Ether price at the time ~$2595) |
| ---------------- | -------------- | -------- | ----------------------------------------------- |
| Optimism         | 89             | 28167603 | 0.000036061732019822 ETH ($0.09)                |
| Optimism Sepolia | 89             | 28163331 | 0.005651520470449442 ETH ($10.46)               |
| Arbitrum         | 98             | 31017545 | 0.00031017545 ETH ($0.80)                       |
| Arbitrum Sepolia | 98             | 31115404 | 0.0031115404 ETH ($8.06)                        |
| Base             | 89             | 28165467 | 0.000591851649982612 ETH ($1.54)                |
| Base Sepolia     | 89             | 28190232 | 0.002072926785842714 ETH ($5.18)                |
| Gnosis           | 50             | 15921153 | 0.0000124615 ETH ($0.03)                        |
| Gnosis Chiado    | 50             | 15921753 | 0.0000188313 ETH ($0.05)                        |
| Polygon          | 85             | 26915773 | 0.0002193417259598 ETH ($0.54)                  |
| Polygon Amoy     | 89             | 28192368 | 0.00017069180975304 ETH ($0.43)                 |

## Test yourself

To test MACI on a network, whether it's one of the ones listed above, or a new one, you can use the `benchmark` hardhat task:

1. Ensure you have copied `.env.example` to `.env` and set the correct values for the network you want to test on.
2. Configure your `deploy-config.json` - ensure `messageTreeDepth` is set to at least 3 (supporting 5 \*\* 3 votes)
3. Ensure you have copied the `default-deployed-contracts.json` to `deployed-contracts.json` to avoid deploying unnecessary contracts again.
4. Run the `benchmark` task: `pnpm benchmark:$NETWORK`
