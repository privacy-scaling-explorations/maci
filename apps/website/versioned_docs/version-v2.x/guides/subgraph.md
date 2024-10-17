---
title: Subgraph Deployment
description: How to deploy a MACI Subgraph
sidebar_label: Subgraph Deployment
sidebar_position: 1
---

# Subgraph Deployment

In some instances like a frontend you might need to deploy a subgraph, in the MACI repository you can find the configuration to deploy a subgraph on The Graph Network.

:::important
MACI subgraphs can be deployed in Alchemy and The Graph network, this guide focuses on deploying on The Graph.
:::

## Configuration

Head to the subgraph folder in the app folder.

```bash
cd apps/subgraph
```

Edit the `network.json` file in the `config` folder. Adding the network it was deployed, the MACI contract and the block where it was deployed.

```json
{
  "network": "optimism-sepolia",
  "maciContractAddress": "0xD18Ca45b6cC1f409380731C40551BD66932046c3",
  "maciContractStartBlock": 11052407
}
```

:::note
See the supported networks of The Graph **[here](https://thegraph.com/docs/en/developing/supported-networks/)**.
:::

Create a subgraph in [the graph studio](https://thegraph.com/studio/) and name it `maci-subgraph`.

## Deployment

The first thing you need to do is to copy the `key` in subgraph studio dashboard and run the following command to authenticate:

```bash
graph auth --studio {key}
```

Then run the following commands to build and deploy the subgraph:

```bash
pnpm run build && \
pnpm run deploy
```

:::important
The `pnpm run deploy` command uses `maci-subgraph` as the subgraph name by default, but if you named your subgraph differently (e.g. maci-graph, my-graph, etc.), please change the command to `graph deploy --node https://api.studio.thegraph.com/deploy/ your_subgraph_name`
:::
