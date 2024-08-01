---
title: Cli Module
sidebar_label: module
sidebar_position: 1
---

## Table of contents

### Interfaces

- [AirdropArgs](interfaces/AirdropArgs.md)
- [DeployArgs](interfaces/DeployArgs.md)
- [DeployPollArgs](interfaces/DeployPollArgs.md)
- [DeployedContracts](interfaces/DeployedContracts.md)
- [GenLocalStateArgs](interfaces/GenLocalStateArgs.md)
- [GenProofsArgs](interfaces/GenProofsArgs.md)
- [IGenKeypairArgs](interfaces/IGenKeypairArgs.md)
- [IRegisteredUserArgs](interfaces/IRegisteredUserArgs.md)
- [MergeMessagesArgs](interfaces/MergeMessagesArgs.md)
- [MergeSignupsArgs](interfaces/MergeSignupsArgs.md)
- [PollContracts](interfaces/PollContracts.md)
- [ProveOnChainArgs](interfaces/ProveOnChainArgs.md)
- [PublishArgs](interfaces/PublishArgs.md)
- [SignupArgs](interfaces/SignupArgs.md)
- [SubsidyData](interfaces/SubsidyData.md)
- [TallyData](interfaces/TallyData.md)
- [TopupArgs](interfaces/TopupArgs.md)
- [VerifyArgs](interfaces/VerifyArgs.md)

### Functions

- [airdrop](modules.md#airdrop)
- [checkVerifyingKeys](modules.md#checkverifyingkeys)
- [deploy](modules.md#deploy)
- [deployPoll](modules.md#deploypoll)
- [deployVkRegistryContract](modules.md#deployvkregistrycontract)
- [fundWallet](modules.md#fundwallet)
- [genKeyPair](modules.md#genkeypair)
- [genLocalState](modules.md#genlocalstate)
- [genMaciPubKey](modules.md#genmacipubkey)
- [genProofs](modules.md#genproofs)
- [getPoll](modules.md#getpoll)
- [isRegisteredUser](modules.md#isregistereduser)
- [mergeMessages](modules.md#mergemessages)
- [mergeSignups](modules.md#mergesignups)
- [proveOnChain](modules.md#proveonchain)
- [publish](modules.md#publish)
- [setVerifyingKeys](modules.md#setverifyingkeys)
- [signup](modules.md#signup)
- [timeTravel](modules.md#timetravel)
- [topup](modules.md#topup)
- [verify](modules.md#verify)

## Functions

### airdrop

▸ **airdrop**(`AirdropArgs`): `Promise`\<`void`\>

Utility that can be used to get
topup credits airdropped
to the coordinator

#### Parameters

| Name          | Type                                       | Description                           |
| :------------ | :----------------------------------------- | :------------------------------------ |
| `AirdropArgs` | [`AirdropArgs`](interfaces/AirdropArgs.md) | The arguments for the airdrop command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/airdrop.ts:11](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/airdrop.ts#L11)

---

### checkVerifyingKeys

▸ **checkVerifyingKeys**(`CheckVerifyingKeysArgs`): `Promise`\<`boolean`\>

Command to confirm that the verifying keys in the contract match the
local ones

#### Parameters

| Name                     | Type                     | Description                                      |
| :----------------------- | :----------------------- | :----------------------------------------------- |
| `CheckVerifyingKeysArgs` | `CheckVerifyingKeysArgs` | The arguments for the checkVerifyingKeys command |

#### Returns

`Promise`\<`boolean`\>

Whether the verifying keys match or not

**`Note`**

see different options for zkey files to use specific circuits https://maci.pse.dev/docs/security/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing

#### Defined in

[commands/checkVerifyingKeys.ts:28](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/checkVerifyingKeys.ts#L28)

---

### deploy

▸ **deploy**(`DeployArgs`): `Promise`\<[`DeployedContracts`](interfaces/DeployedContracts.md)\>

Deploy MACI and related contracts

#### Parameters

| Name         | Type                                     | Description                          |
| :----------- | :--------------------------------------- | :----------------------------------- |
| `DeployArgs` | [`DeployArgs`](interfaces/DeployArgs.md) | The arguments for the deploy command |

#### Returns

`Promise`\<[`DeployedContracts`](interfaces/DeployedContracts.md)\>

The addresses of the deployed contracts

#### Defined in

[commands/deploy.ts:26](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/deploy.ts#L26)

---

### deployPoll

▸ **deployPoll**(`DeployPollArgs`): `Promise`\<[`PollContracts`](interfaces/PollContracts.md)\>

Deploy a new Poll for the set of MACI's contracts already deployed

#### Parameters

| Name             | Type                                             | Description                              |
| :--------------- | :----------------------------------------------- | :--------------------------------------- |
| `DeployPollArgs` | [`DeployPollArgs`](interfaces/DeployPollArgs.md) | The arguments for the deployPoll command |

#### Returns

`Promise`\<[`PollContracts`](interfaces/PollContracts.md)\>

The addresses of the deployed contracts

#### Defined in

[commands/deployPoll.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/deployPoll.ts#L21)

---

### deployVkRegistryContract

▸ **deployVkRegistryContract**(`quiet`): `Promise`\<`string`\>

Deploy the vkRegistry contract

#### Parameters

| Name    | Type                   | Description                           |
| :------ | :--------------------- | :------------------------------------ |
| `quiet` | `DeployVkRegistryArgs` | whether to print the contract address |

#### Returns

`Promise`\<`string`\>

#### Defined in

[commands/deployVkRegistry.ts:20](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/deployVkRegistry.ts#L20)

---

### fundWallet

▸ **fundWallet**(`«destructured»`): `Promise`\<`void`\>

Fund a new wallet with Ether

#### Parameters

| Name             | Type             |
| :--------------- | :--------------- |
| `«destructured»` | `FundWalletArgs` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/fundWallet.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/fundWallet.ts#L9)

---

### genKeyPair

▸ **genKeyPair**(`args`): `Object`

Generate a new Maci Key Pair
and print it to the screen

#### Parameters

| Name   | Type                                               | Description               |
| :----- | :------------------------------------------------- | :------------------------ |
| `args` | [`IGenKeypairArgs`](interfaces/IGenKeypairArgs.md) | keypair generation params |

#### Returns

`Object`

- keypair

| Name         | Type     |
| :----------- | :------- |
| `privateKey` | `string` |
| `publicKey`  | `string` |

#### Defined in

[commands/genKeyPair.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/genKeyPair.ts#L15)

---

### genLocalState

▸ **genLocalState**(`GenLocalStateArgs`): `Promise`\<`void`\>

Generate a local MACI state from the smart contracts events

#### Parameters

| Name                | Type                                                   | Description                                 |
| :------------------ | :----------------------------------------------------- | :------------------------------------------ |
| `GenLocalStateArgs` | [`GenLocalStateArgs`](interfaces/GenLocalStateArgs.md) | The arguments for the genLocalState command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/genLocalState.ts:24](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/genLocalState.ts#L24)

---

### genMaciPubKey

▸ **genMaciPubKey**(`privkey`, `quiet?`): `string`

Generate a new Maci Public key from a private key

#### Parameters

| Name      | Type      | Default value | Description               |
| :-------- | :-------- | :------------ | :------------------------ |
| `privkey` | `string`  | `undefined`   | -                         |
| `quiet`   | `boolean` | `true`        | whether to log the output |

#### Returns

`string`

the public key serialized

#### Defined in

[commands/genPubKey.ts:13](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/genPubKey.ts#L13)

---

### genProofs

▸ **genProofs**(`GenProofsArgs`): `Promise`\<[`TallyData`](interfaces/TallyData.md)\>

Generate proofs for the message processing, tally and subsidy calculations

#### Parameters

| Name            | Type                                           | Description                             |
| :-------------- | :--------------------------------------------- | :-------------------------------------- |
| `GenProofsArgs` | [`GenProofsArgs`](interfaces/GenProofsArgs.md) | The arguments for the genProofs command |

#### Returns

`Promise`\<[`TallyData`](interfaces/TallyData.md)\>

The tally data

**`Note`**

see different options for zkey files to use specific circuits https://maci.pse.dev/docs/security/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing

#### Defined in

[commands/genProofs.ts:42](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/genProofs.ts#L42)

---

### getPoll

▸ **getPoll**(`args`): `Promise`\<`IGetPollData`\>

Get deployed poll from MACI contract

#### Parameters

| Name   | Type           | Description                            |
| :----- | :------------- | :------------------------------------- |
| `args` | `IGetPollArgs` | The arguments for the get poll command |

#### Returns

`Promise`\<`IGetPollData`\>

poll data

#### Defined in

[commands/poll.ts:14](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/poll.ts#L14)

---

### isRegisteredUser

▸ **isRegisteredUser**(`IRegisteredArgs`): `Promise`\<\{ `isRegistered`: `boolean` ; `stateIndex?`: `string` }\>

Checks if user is registered with public key

#### Parameters

| Name              | Type                                                       | Description                                  |
| :---------------- | :--------------------------------------------------------- | :------------------------------------------- |
| `IRegisteredArgs` | [`IRegisteredUserArgs`](interfaces/IRegisteredUserArgs.md) | The arguments for the register check command |

#### Returns

`Promise`\<\{ `isRegistered`: `boolean` ; `stateIndex?`: `string` }\>

user registered or not and state index

#### Defined in

[commands/signup.ts:94](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/signup.ts#L94)

---

### mergeMessages

▸ **mergeMessages**(`MergeMessagesArgs`): `Promise`\<`void`\>

Merge the message queue on chain

#### Parameters

| Name                | Type                                                   | Description                                 |
| :------------------ | :----------------------------------------------------- | :------------------------------------------ |
| `MergeMessagesArgs` | [`MergeMessagesArgs`](interfaces/MergeMessagesArgs.md) | The arguments for the mergeMessages command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/mergeMessages.ts:25](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/mergeMessages.ts#L25)

---

### mergeSignups

▸ **mergeSignups**(`MergeSignupsArgs`): `Promise`\<`void`\>

Command to merge the signups of a MACI contract

#### Parameters

| Name               | Type                                                 | Description                                |
| :----------------- | :--------------------------------------------------- | :----------------------------------------- |
| `MergeSignupsArgs` | [`MergeSignupsArgs`](interfaces/MergeSignupsArgs.md) | The arguments for the mergeSignups command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/mergeSignups.ts:25](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/mergeSignups.ts#L25)

---

### proveOnChain

▸ **proveOnChain**(`ProveOnChainArgs`): `Promise`\<`void`\>

Command to prove the result of a poll on-chain

#### Parameters

| Name               | Type                                                 | Description                                |
| :----------------- | :--------------------------------------------------- | :----------------------------------------- |
| `ProveOnChainArgs` | [`ProveOnChainArgs`](interfaces/ProveOnChainArgs.md) | The arguments for the proveOnChain command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/proveOnChain.ts:43](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/proveOnChain.ts#L43)

---

### publish

▸ **publish**(`PublishArgs`): `Promise`\<`string`\>

Publish a new message to a MACI Poll contract

#### Parameters

| Name          | Type                                       | Description                           |
| :------------ | :----------------------------------------- | :------------------------------------ |
| `PublishArgs` | [`PublishArgs`](interfaces/PublishArgs.md) | The arguments for the publish command |

#### Returns

`Promise`\<`string`\>

The ephemeral private key used to encrypt the message

#### Defined in

[commands/publish.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/publish.ts#L17)

---

### setVerifyingKeys

▸ **setVerifyingKeys**(`SetVerifyingKeysArgs`): `Promise`\<`void`\>

Function that sets the verifying keys in the VkRegistry contract

#### Parameters

| Name                   | Type                   | Description                                    |
| :--------------------- | :--------------------- | :--------------------------------------------- |
| `SetVerifyingKeysArgs` | `SetVerifyingKeysArgs` | The arguments for the setVerifyingKeys command |

#### Returns

`Promise`\<`void`\>

**`Note`**

see different options for zkey files to use specific circuits https://maci.pse.dev/docs/security/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing

#### Defined in

[commands/setVerifyingKeys.ts:26](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/setVerifyingKeys.ts#L26)

---

### signup

▸ **signup**(`args`): `Promise`\<`ISignupData`\>

Signup a user to the MACI contract

#### Parameters

| Name   | Type                                     | Description                          |
| :----- | :--------------------------------------- | :----------------------------------- |
| `args` | [`SignupArgs`](interfaces/SignupArgs.md) | The arguments for the signup command |

#### Returns

`Promise`\<`ISignupData`\>

The state index of the user and transaction hash

#### Defined in

[commands/signup.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/signup.ts#L17)

---

### timeTravel

▸ **timeTravel**(`«destructured»`): `Promise`\<`void`\>

Utility to travel in time when using a local blockchain

#### Parameters

| Name             | Type             |
| :--------------- | :--------------- |
| `«destructured»` | `TimeTravelArgs` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/timeTravel.ts:10](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/timeTravel.ts#L10)

---

### topup

▸ **topup**(`TopupArgs`): `Promise`\<`void`\>

Publish a topup message

#### Parameters

| Name        | Type                                   | Description                         |
| :---------- | :------------------------------------- | :---------------------------------- |
| `TopupArgs` | [`TopupArgs`](interfaces/TopupArgs.md) | The arguments for the topup command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/topup.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/topup.ts#L9)

---

### verify

▸ **verify**(`VerifyArgs`): `Promise`\<`void`\>

Verify the results of a poll and optionally the subsidy results on-chain

#### Parameters

| Name         | Type                                     | Description                          |
| :----------- | :--------------------------------------- | :----------------------------------- |
| `VerifyArgs` | [`VerifyArgs`](interfaces/VerifyArgs.md) | The arguments for the verify command |

#### Returns

`Promise`\<`void`\>

#### Defined in

[commands/verify.ts:23](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/commands/verify.ts#L23)
