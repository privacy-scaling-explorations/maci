---
title: MACI SDK
description: How to use the MACI SDK
sidebar_label: MACI SDK
sidebar_position: 6
---

In this guide we will be looking at how to use the MACI SDK to interact with the MACI protocol.

## Installation

```bash
npm install @maci-protocol/sdk
```

## Browser compatibility

As the SDK imports functions from the `@maci-protocol/contracts` package which uses hardhat, certain functionality is not browser compatible.
However, all it takes to use browser compatible functions is to import from `@maci-protocol/sdk/browser`.

As an example, we can import the `signUp` function from the `@maci-protocol/sdk/browser` package.

```typescript
import { signUp } from "@maci-protocol/sdk/browser";
```

Let's take a look at an example of how to use the `joinPoll` function to register a user to a poll.

### JoinPoll

This step is required to register a user to a specific poll for which they want to vote. In short, it requires the user to generate a zk-SNARK proof that they know the private key to a public key registered to the MACI contract (proving they passed the initial gatekeeping requirements). This forces them to join with the same MACI key to each poll, greatly increasing the value of the key. Should they have been allowed to join with a throwaway key, they could simply sell their key for polls they do not care about.

**How does the flow look like?**

1. Reconstruct the MACI state tree by pulling all public keys from the MACI contract (events from RPC or from Subgraph)
2. Generate a merkle tree inclusion proof for the user's public key
3. Generate a zk-SNARK proof that the user knows the private key to the public key in the merkle tree inclusion proof
4. Call the `joinPoll` function on the Poll smart contract

**How to use the SDK for this?**

> This example is browser specific, as it uses the `@maci-protocol/sdk/browser` package and WASM for witness generation

Option 1: Use the `joinPoll` function from the `@maci-protocol/sdk/browser` package.

1. Download the `pollJoining` zk artifacts using [downloadPollJoiningArtifactsBrowser](https://github.com/privacy-scaling-explorations/maci/blob/main/packages/sdk/ts/proof/download.ts#L46)

```typescript
import { downloadPollJoiningArtifactsBrowser } from "@maci-protocol/sdk/browser";

const artifacts = await downloadPollJoiningArtifactsBrowser({
  testing: true,
  stateTreeDepth: 10,
});
```

2. Use the `joinPoll` function to join the poll

```typescript
import { joinPoll } from "@maci-protocol/sdk/browser";

const joinedPollData = await joinPoll({
  maciAddress: PUBLIC_MACI_ADDRESS,
  privateKey: maciKeypair.privateKey.serialize(),
  signer,
  pollId,
  inclusionProof,
  pollJoiningZkey: artifacts.zKey as unknown as string,
  pollJoiningWasm: artifacts.wasm as unknown as string,
  sgDataArg: DEFAULT_SG_DATA,
  ivcpDataArg: DEFAULT_IVCP_DATA,
  blocksPerBatch: 1000,
});
```

This is not really efficient, as we are using the user RPC to fetch events, which can be quite slow and prone to errors. A better approach is to use a Subgraph to fetch the events.

Option 2: Fetch the MACI keys using a subgraph and reconstruct the state tree locally.

1. Deploy the subgraph - instructions [here](/guides/subgraph)
2. Fetch the MACI keys

```typescript
import { MaciSubgraph } from "@maci-protocol/sdk/browser";

const subgraph = new MaciSubgraph("https://api.studio.thegraph.com/query/x/maci/version/latest");

const keys = await subgraph.getKeys();
```

3. Generate the merkle tree

```typescript
import { generateSignUpTreeFromKeys } from "@maci-protocol/sdk/browser";

const signUpTree = generateSignUpTreeFromKeys(keys);
```

4. Generate the inclusion proof - you will need to know the index of the user's public key in the merkle tree

```typescript
const inclusionProof = signUpTree.generateProof(publicKeyIndex);
```

5. Generate the zk-SNARK proof and join the poll

```typescript
import { joinPoll } from "@maci-protocol/sdk/browser";

const joinedPollData = await joinPoll({
  maciAddress: PUBLIC_MACI_ADDRESS,
  privateKey: maciKeypair.privateKey.serialize(),
  signer,
  pollId,
  inclusionProof,
  pollJoiningZkey: artifacts.zKey as unknown as string,
  pollJoiningWasm: artifacts.wasm as unknown as string,
  sgDataArg: DEFAULT_SG_DATA,
  ivcpDataArg: DEFAULT_IVCP_DATA,
});
```
