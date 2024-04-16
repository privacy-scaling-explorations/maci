---
title: DeployPollArgs
sidebar_label: DeployPollArgs
---

Interface for the arguments to the deployPoll command

## Table of contents

### Properties

- [coordinatorPubkey](DeployPollArgs.md#coordinatorpubkey)
- [intStateTreeDepth](DeployPollArgs.md#intstatetreedepth)
- [maciAddress](DeployPollArgs.md#maciaddress)
- [messageTreeDepth](DeployPollArgs.md#messagetreedepth)
- [messageTreeSubDepth](DeployPollArgs.md#messagetreesubdepth)
- [pollDuration](DeployPollArgs.md#pollduration)
- [quiet](DeployPollArgs.md#quiet)
- [signer](DeployPollArgs.md#signer)
- [subsidyEnabled](DeployPollArgs.md#subsidyenabled)
- [vkRegistryAddress](DeployPollArgs.md#vkregistryaddress)
- [voteOptionTreeDepth](DeployPollArgs.md#voteoptiontreedepth)

## Properties

### coordinatorPubkey

• **coordinatorPubkey**: `string`

The coordinator's public key

#### Defined in

[utils/interfaces.ts:354](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L354)

---

### intStateTreeDepth

• **intStateTreeDepth**: `number`

The depth of the intermediate state tree

#### Defined in

[utils/interfaces.ts:334](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L334)

---

### maciAddress

• `Optional` **maciAddress**: `string`

The MACI contract address

#### Defined in

[utils/interfaces.ts:369](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L369)

---

### messageTreeDepth

• **messageTreeDepth**: `number`

The depth of the message tree

#### Defined in

[utils/interfaces.ts:344](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L344)

---

### messageTreeSubDepth

• **messageTreeSubDepth**: `number`

The depth of the message tree sublevels

#### Defined in

[utils/interfaces.ts:339](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L339)

---

### pollDuration

• **pollDuration**: `number`

The duration of the poll in seconds

#### Defined in

[utils/interfaces.ts:329](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L329)

---

### quiet

• `Optional` **quiet**: `boolean`

Whether to log the output to the console

#### Defined in

[utils/interfaces.ts:379](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L379)

---

### signer

• **signer**: `Signer`

A signer object

#### Defined in

[utils/interfaces.ts:364](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L364)

---

### subsidyEnabled

• **subsidyEnabled**: `boolean`

Whether to deploy subsidy contract

#### Defined in

[utils/interfaces.ts:359](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L359)

---

### vkRegistryAddress

• `Optional` **vkRegistryAddress**: `string`

The vkRegistry contract address

#### Defined in

[utils/interfaces.ts:374](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L374)

---

### voteOptionTreeDepth

• **voteOptionTreeDepth**: `number`

The depth of the vote option tree

#### Defined in

[utils/interfaces.ts:349](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/cli/ts/utils/interfaces.ts#L349)
