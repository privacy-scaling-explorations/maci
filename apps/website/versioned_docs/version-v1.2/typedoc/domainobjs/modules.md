---
title: Domainobjs Module
sidebar_label: module
sidebar_position: 1
---

## Table of contents

### Classes

- [Ballot](classes/Ballot.md)
- [Keypair](classes/Keypair.md)
- [Message](classes/Message.md)
- [PCommand](classes/PCommand.md)
- [PrivKey](classes/PrivKey.md)
- [PubKey](classes/PubKey.md)
- [StateLeaf](classes/StateLeaf.md)
- [TCommand](classes/TCommand.md)
- [VerifyingKey](classes/VerifyingKey.md)

### Interfaces

- [ICommand](interfaces/ICommand.md)
- [IG1ContractParams](interfaces/IG1ContractParams.md)
- [IG2ContractParams](interfaces/IG2ContractParams.md)
- [IJsonBallot](interfaces/IJsonBallot.md)
- [IJsonCommand](interfaces/IJsonCommand.md)
- [IJsonKeyPair](interfaces/IJsonKeyPair.md)
- [IJsonPCommand](interfaces/IJsonPCommand.md)
- [IJsonStateLeaf](interfaces/IJsonStateLeaf.md)
- [IJsonTCommand](interfaces/IJsonTCommand.md)
- [IMessageContractParams](interfaces/IMessageContractParams.md)
- [IStateLeaf](interfaces/IStateLeaf.md)
- [IStateLeafContractParams](interfaces/IStateLeafContractParams.md)
- [IVkContractParams](interfaces/IVkContractParams.md)
- [IVkObjectParams](interfaces/IVkObjectParams.md)
- [Proof](interfaces/Proof.md)
- [VoteOptionTreeLeaf](interfaces/VoteOptionTreeLeaf.md)

### Type Aliases

- [IJsonPrivateKey](modules.md#ijsonprivatekey)
- [IJsonPublicKey](modules.md#ijsonpublickey)

### Variables

- [SERIALIZED_PRIV_KEY_PREFIX](modules.md#serialized_priv_key_prefix)
- [SERIALIZED_PUB_KEY_PREFIX](modules.md#serialized_pub_key_prefix)
- [blankStateLeaf](modules.md#blankstateleaf)
- [blankStateLeafHash](modules.md#blankstateleafhash)

## Type Aliases

### IJsonPrivateKey

Ƭ **IJsonPrivateKey**: `Pick`\<[`IJsonKeyPair`](interfaces/IJsonKeyPair.md), `"privKey"`\>

#### Defined in

[types.ts:33](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/types.ts#L33)

---

### IJsonPublicKey

Ƭ **IJsonPublicKey**: `Pick`\<[`IJsonKeyPair`](interfaces/IJsonKeyPair.md), `"pubKey"`\>

#### Defined in

[types.ts:35](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/types.ts#L35)

## Variables

### SERIALIZED_PRIV_KEY_PREFIX

• `Const` **SERIALIZED_PRIV_KEY_PREFIX**: `"macisk."`

#### Defined in

[privateKey.ts:5](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/privateKey.ts#L5)

---

### SERIALIZED_PUB_KEY_PREFIX

• `Const` **SERIALIZED_PUB_KEY_PREFIX**: `"macipk."`

#### Defined in

[publicKey.ts:7](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/publicKey.ts#L7)

---

### blankStateLeaf

• `Const` **blankStateLeaf**: [`StateLeaf`](classes/StateLeaf.md)

#### Defined in

[constants.ts:3](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/constants.ts#L3)

---

### blankStateLeafHash

• `Const` **blankStateLeafHash**: `bigint`

#### Defined in

[constants.ts:4](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/domainobjs/ts/constants.ts#L4)
