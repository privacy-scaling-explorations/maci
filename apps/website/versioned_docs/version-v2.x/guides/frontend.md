---
title: Frontend Deployment
description: How to troubleshoot MACI's failures
sidebar_label: Frontend Deployment
sidebar_position: 2
---

# Deploy a Frontend

[MACI Platform](https://github.com/privacy-scaling-explorations/maci-platform) is a complete frontend solution for running voting or funding rounds using MACI. This guide explains how to deploy MACI Platform.

## Setup

Start by cloning the MACI Platform repo:

```bash
git clone https://github.com/privacy-scaling-explorations/maci-platform
```

Head to the folder and install the dependencies:

```bash
cd maci-platform && \
pnpm install
```

## Configuration

Copy the example variables and update them accord to your needs:

```bash
cp packages/interface/.env.example packages/interface/.env
```

At the very minimum make sure to configure:

- **BLOB_READ_WRITE_TOKEN.** Storage for applications metadata.
- **NEXT_PUBLIC_ALCHEMY_ID.** Optional but highly recommended for RPC calls.
- **NEXT_PUBLIC_REGISTRATION_END_DATE.** Determine when users can register application.
- **NEXT_PUBLIC_ADMIN_ADDRESS.** Address that will approve applications and voters
- **NEXT_PUBLIC_APPROVAL_SCHEMA.** Schema for applications and voters.
- **NEXT_PUBLIC_METADATA_SCHEMA.** Schema for storing metadata refs.
- **NEXT_PUBLIC_MACI_ADDRESS.** The MACI contract address deployed on the [Getting Started Guide](/docs/getting-started).
- **NEXT_PUBLIC_MACI_START_BLOCK.** Block when was deployed the MACI contract.
- **NEXT_PUBLIC_MACI_SUBGRAPH_URL.** URL of the Subgraph deployed on the [Subgraph Deployment Guide](/docs/guides/subgraph).

:::important
Make sure that the EAS schemas exist in the network that you are using.
:::

Build the repo with the following command.

```bash
pnpm build
```

In order to run the interface locally can run:

```bash
pnpm dev:interface
```

## Deploy Poll

Once you have configured the repo with the subgraph and MACI contract you only need to [deploy a poll](/docs/getting-started#deploy-poll) on MACI.

```bash
pnpm deploy-poll:NETWORK
```

## Deploy Frontend

The easiest way to deploy MACI Platform is using [vercel](https://vercel.com/new).

1. Import the repo you created/forked
2. Open the Environment Variables panel
3. Select the first field and paste your variables from your text editor.
4. Deploy!

## Results

Once the voting time has ended, as a coordinator, you need to [merge the signups and generate the proofs](/docs/getting-started#poll-finalization). This is done on the MACI repo.

This is going to generate a `tally.json` file, then you need to rename it as `tally-{pollId}.json` or `tally-{roundId}.json`, upload it and add it as an environment variable `NEXT_PUBLIC_TALLY_URL`. The frontend will read this variable and will display the results.

:::important
We recommend you use vercel storage to upload the `tally-{pollid}.json` file.
:::

## Credits

The interface originally started as a fork of [easy-rpgf](https://github.com/gitcoinco/easy-retro-pgf), but has since taken a completely different direction. As a result, we decided to detach the fork to clarify the project's new focus, which now extends beyond RPGF to include other types of voting and funding.

We are very thankful to the developers and all contributors of the [easy-rpgf](https://github.com/gitcoinco/easy-retro-pgf) project, and we hope to continue collaborating and wish to see their project succeed and help more communities/projects get funded.
