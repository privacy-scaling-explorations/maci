---
title: IncrementalQuinTree
sidebar_label: IncrementalQuinTree
---

An implementation of an incremental Merkle tree

**`Dev`**

adapted from https://github.com/weijiekoh/optimisedmt

## Table of contents

### Constructors

- [constructor](IncrementalQuinTree.md#constructor)

### Properties

- [arity](IncrementalQuinTree.md#arity)
- [capacity](IncrementalQuinTree.md#capacity)
- [depth](IncrementalQuinTree.md#depth)
- [hashFunc](IncrementalQuinTree.md#hashfunc)
- [nextIndex](IncrementalQuinTree.md#nextindex)
- [nodes](IncrementalQuinTree.md#nodes)
- [numNodes](IncrementalQuinTree.md#numnodes)
- [root](IncrementalQuinTree.md#root)
- [zeroValue](IncrementalQuinTree.md#zerovalue)
- [zeros](IncrementalQuinTree.md#zeros)

### Methods

- [calcChildIndices](IncrementalQuinTree.md#calcchildindices)
- [calcInitialVals](IncrementalQuinTree.md#calcinitialvals)
- [calcLeafIndices](IncrementalQuinTree.md#calcleafindices)
- [calcParentIndices](IncrementalQuinTree.md#calcparentindices)
- [copy](IncrementalQuinTree.md#copy)
- [genProof](IncrementalQuinTree.md#genproof)
- [genSubrootProof](IncrementalQuinTree.md#gensubrootproof)
- [getNode](IncrementalQuinTree.md#getnode)
- [insert](IncrementalQuinTree.md#insert)
- [setNode](IncrementalQuinTree.md#setnode)
- [update](IncrementalQuinTree.md#update)
- [verifyProof](IncrementalQuinTree.md#verifyproof)

## Constructors

### constructor

• **new IncrementalQuinTree**(`depth`, `zeroValue`, `arity`, `hashFunc`): [`IncrementalQuinTree`](IncrementalQuinTree.md)

Create a new instance of the MaciQuinTree

#### Parameters

| Name        | Type                               | Description                   |
| :---------- | :--------------------------------- | :---------------------------- |
| `depth`     | `number`                           | The depth of the tree         |
| `zeroValue` | `bigint`                           | The zero value of the tree    |
| `arity`     | `number`                           | The arity of the tree         |
| `hashFunc`  | (`leaves`: `bigint`[]) => `bigint` | The hash function of the tree |

#### Returns

[`IncrementalQuinTree`](IncrementalQuinTree.md)

#### Defined in

[crypto/ts/quinTree.ts:42](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L42)

## Properties

### arity

• **arity**: `number`

#### Defined in

[crypto/ts/quinTree.ts:15](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L15)

---

### capacity

• **capacity**: `number`

#### Defined in

[crypto/ts/quinTree.ts:33](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L33)

---

### depth

• **depth**: `number`

#### Defined in

[crypto/ts/quinTree.ts:9](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L9)

---

### hashFunc

• **hashFunc**: (`leaves`: `bigint`[]) => `bigint`

#### Type declaration

▸ (`leaves`): `bigint`

##### Parameters

| Name     | Type       |
| :------- | :--------- |
| `leaves` | `bigint`[] |

##### Returns

`bigint`

#### Defined in

[crypto/ts/quinTree.ts:18](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L18)

---

### nextIndex

• **nextIndex**: `number` = `0`

#### Defined in

[crypto/ts/quinTree.ts:21](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L21)

---

### nodes

• **nodes**: `Node`

#### Defined in

[crypto/ts/quinTree.ts:29](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L29)

---

### numNodes

• **numNodes**: `number`

#### Defined in

[crypto/ts/quinTree.ts:31](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L31)

---

### root

• **root**: `bigint`

#### Defined in

[crypto/ts/quinTree.ts:27](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L27)

---

### zeroValue

• **zeroValue**: `bigint`

#### Defined in

[crypto/ts/quinTree.ts:12](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L12)

---

### zeros

• **zeros**: `bigint`[] = `[]`

#### Defined in

[crypto/ts/quinTree.ts:25](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L25)

## Methods

### calcChildIndices

▸ **calcChildIndices**(`index`): `number`[]

Calculate the indices of the children of a node

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `index` | `number` | The index of the node |

#### Returns

`number`[]

The indices of the children

#### Defined in

[crypto/ts/quinTree.ts:272](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L272)

---

### calcInitialVals

▸ **calcInitialVals**(`arity`, `depth`, `zeroValue`, `hashFunc`): `Object`

Calculate the zeroes and the root of a tree

#### Parameters

| Name        | Type                               | Description                   |
| :---------- | :--------------------------------- | :---------------------------- |
| `arity`     | `number`                           | The arity of the tree         |
| `depth`     | `number`                           | The depth of the tree         |
| `zeroValue` | `bigint`                           | The zero value of the tree    |
| `hashFunc`  | (`leaves`: `bigint`[]) => `bigint` | The hash function of the tree |

#### Returns

`Object`

The zeros and the root

| Name    | Type       |
| :------ | :--------- |
| `root`  | `bigint`   |
| `zeros` | `bigint`[] |

#### Defined in

[crypto/ts/quinTree.ts:358](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L358)

---

### calcLeafIndices

▸ **calcLeafIndices**(`index`): `number`[]

Calculate the indices of the leaves in the path to the root

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `index` | `number` | The index of the leaf |

#### Returns

`number`[]

The indices of the leaves in the path to the root

#### Defined in

[crypto/ts/quinTree.ts:105](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L105)

---

### calcParentIndices

▸ **calcParentIndices**(`index`): `number`[]

Calculate the indices of the parent

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `index` | `number` | The index of the leaf |

#### Returns

`number`[]

The indices of the parent

#### Defined in

[crypto/ts/quinTree.ts:248](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L248)

---

### copy

▸ **copy**(): [`IncrementalQuinTree`](IncrementalQuinTree.md)

Copy the tree to a new instance

#### Returns

[`IncrementalQuinTree`](IncrementalQuinTree.md)

The new instance

#### Defined in

[crypto/ts/quinTree.ts:338](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L338)

---

### genProof

▸ **genProof**(`index`): `IMerkleProof`

Generate a proof for a given leaf index

#### Parameters

| Name    | Type     | Description                                   |
| :------ | :------- | :-------------------------------------------- |
| `index` | `number` | The index of the leaf to generate a proof for |

#### Returns

`IMerkleProof`

The proof

#### Defined in

[crypto/ts/quinTree.ts:122](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L122)

---

### genSubrootProof

▸ **genSubrootProof**(`startIndex`, `endIndex`): `IMerkleProof`

Generates a Merkle proof from a subroot to the root.

#### Parameters

| Name         | Type     | Description                 |
| :----------- | :------- | :-------------------------- |
| `startIndex` | `number` | The index of the first leaf |
| `endIndex`   | `number` | The index of the last leaf  |

#### Returns

`IMerkleProof`

The Merkle proof

#### Defined in

[crypto/ts/quinTree.ts:168](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L168)

---

### getNode

▸ **getNode**(`index`): `bigint`

Get a node at a given index

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `index` | `number` | The index of the node |

#### Returns

`bigint`

The node

#### Defined in

[crypto/ts/quinTree.ts:299](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L299)

---

### insert

▸ **insert**(`value`): `void`

Insert a leaf at the next available index

#### Parameters

| Name    | Type     | Description         |
| :------ | :------- | :------------------ |
| `value` | `bigint` | The value to insert |

#### Returns

`void`

#### Defined in

[crypto/ts/quinTree.ts:68](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L68)

---

### setNode

▸ **setNode**(`index`, `value`): `void`

Set a node (not the root)

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `index` | `number` | the index of the node |
| `value` | `bigint` | the value of the node |

#### Returns

`void`

#### Defined in

[crypto/ts/quinTree.ts:327](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L327)

---

### update

▸ **update**(`index`, `value`): `void`

Update a leaf at a given index

#### Parameters

| Name    | Type     | Description                       |
| :------ | :------- | :-------------------------------- |
| `index` | `number` | The index of the leaf to update   |
| `value` | `bigint` | The value to update the leaf with |

#### Returns

`void`

#### Defined in

[crypto/ts/quinTree.ts:79](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L79)

---

### verifyProof

▸ **verifyProof**(`proof`): `boolean`

Verify a proof

#### Parameters

| Name    | Type           | Description         |
| :------ | :------------- | :------------------ |
| `proof` | `IMerkleProof` | The proof to verify |

#### Returns

`boolean`

Whether the proof is valid

#### Defined in

[crypto/ts/quinTree.ts:221](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/quinTree.ts#L221)
