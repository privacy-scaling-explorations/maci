---
title: Subgraph Deployment
description: How to deploy a MACI Subgraph
sidebar_label: Subgraph Deployment
sidebar_position: 1
---

# Subgraph Deployment

In some instances like a frontend you might need to deploy a subgraph, in the MACI repository you can find the configuration to deploy a subgraph on The Graph Network or Alchemy Subgraphs.

:::important
While the free plan of The Graph and Alchemy can work well, it's recommended to use a paid plan for production.
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

## The Graph Deployment

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

## Alchemy Deployment

Deploying to the Alchemy subgraph service requires some changes to the `subgraph.template.yaml` file located in the `templates` folder. You need to remove the following keys:

```yaml
indexerHints:
  prune: auto
```

Now you can run the deploy command with some minor changes:

```bash
graph deploy SUBGRAPH_NAME \
  --version-label VERSION \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key API_KEY
```

:::note
In order to get a subgraph deploy key for alchemy, head to the subgraph dashboard section and select `add subgraph` and pick `Deploy a New Subgraph` here you will see the deploy key.
:::
