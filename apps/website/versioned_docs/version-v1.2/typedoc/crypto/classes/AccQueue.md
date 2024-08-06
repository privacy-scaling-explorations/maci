---
title: AccQueue
sidebar_label: AccQueue
---

An Accumulator Queue which conforms to the implementation in AccQueue.sol.
Each enqueue() operation updates a subtree, and a merge() operation combines
all subtrees into a main tree.

**`Notice`**

It supports 2 or 5 elements per leaf.

## Table of contents

### Constructors

- [constructor](AccQueue.md#constructor)

### Properties

- [MAX_DEPTH](AccQueue.md#max_depth)
- [currentSubtreeIndex](AccQueue.md#currentsubtreeindex)
- [hashFunc](AccQueue.md#hashfunc)
- [hashLength](AccQueue.md#hashlength)
- [leafQueue](AccQueue.md#leafqueue)
- [mainRoots](AccQueue.md#mainroots)
- [nextSRindexToQueue](AccQueue.md#nextsrindextoqueue)
- [numLeaves](AccQueue.md#numleaves)
- [smallSRTroot](AccQueue.md#smallsrtroot)
- [subDepth](AccQueue.md#subdepth)
- [subHashFunc](AccQueue.md#subhashfunc)
- [subRootQueue](AccQueue.md#subrootqueue)
- [subRoots](AccQueue.md#subroots)
- [subTreesMerged](AccQueue.md#subtreesmerged)
- [zeroValue](AccQueue.md#zerovalue)
- [zeros](AccQueue.md#zeros)

### Methods

- [arrayToMap](AccQueue.md#arraytomap)
- [calcSRTdepth](AccQueue.md#calcsrtdepth)
- [copy](AccQueue.md#copy)
- [enqueue](AccQueue.md#enqueue)
- [enqueueOp](AccQueue.md#enqueueop)
- [fill](AccQueue.md#fill)
- [fillOp](AccQueue.md#fillop)
- [getHashLength](AccQueue.md#gethashlength)
- [getMainRoots](AccQueue.md#getmainroots)
- [getRoot](AccQueue.md#getroot)
- [getSmallSRTroot](AccQueue.md#getsmallsrtroot)
- [getSubDepth](AccQueue.md#getsubdepth)
- [getSubRoot](AccQueue.md#getsubroot)
- [getSubRoots](AccQueue.md#getsubroots)
- [getZeros](AccQueue.md#getzeros)
- [hasRoot](AccQueue.md#hasroot)
- [hash](AccQueue.md#hash)
- [insertSubTree](AccQueue.md#insertsubtree)
- [mapToArray](AccQueue.md#maptoarray)
- [merge](AccQueue.md#merge)
- [mergeDirect](AccQueue.md#mergedirect)
- [mergeSubRoots](AccQueue.md#mergesubroots)
- [queueSubRoot](AccQueue.md#queuesubroot)

## Constructors

### constructor

• **new AccQueue**(`subDepth`, `hashLength`, `zeroValue`): [`AccQueue`](AccQueue.md)

Create a new instance of AccQueue

#### Parameters

| Name         | Type     | Description                        |
| :----------- | :------- | :--------------------------------- |
| `subDepth`   | `number` | the depth of the subtrees          |
| `hashLength` | `number` | the number of leaves per node      |
| `zeroValue`  | `bigint` | the default value for empty leaves |

#### Returns

[`AccQueue`](AccQueue.md)

#### Defined in

[crypto/ts/AccQueue.ts:76](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L76)

## Properties

### MAX_DEPTH

• `Private` **MAX_DEPTH**: `number` = `32`

#### Defined in

[crypto/ts/AccQueue.ts:17](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L17)

---

### currentSubtreeIndex

• `Private` **currentSubtreeIndex**: `number` = `0`

#### Defined in

[crypto/ts/AccQueue.ts:30](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L30)

---

### hashFunc

• `Readonly` **hashFunc**: (`leaves`: `bigint`[]) => `bigint`

#### Type declaration

▸ (`leaves`): `bigint`

##### Parameters

| Name     | Type       |
| :------- | :--------- |
| `leaves` | `bigint`[] |

##### Returns

`bigint`

#### Defined in

[crypto/ts/AccQueue.ts:68](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L68)

---

### hashLength

• `Private` **hashLength**: `number`

#### Defined in

[crypto/ts/AccQueue.ts:23](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L23)

---

### leafQueue

• `Private` **leafQueue**: [`Queue`](../interfaces/Queue.md)

#### Defined in

[crypto/ts/AccQueue.ts:36](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L36)

---

### mainRoots

• `Private` **mainRoots**: `bigint`[] = `[]`

#### Defined in

[crypto/ts/AccQueue.ts:55](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L55)

---

### nextSRindexToQueue

• `Private` **nextSRindexToQueue**: `number` = `0`

#### Defined in

[crypto/ts/AccQueue.ts:42](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L42)

---

### numLeaves

• `Private` **numLeaves**: `number` = `0`

#### Defined in

[crypto/ts/AccQueue.ts:33](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L33)

---

### smallSRTroot

• `Private` **smallSRTroot**: `bigint`

#### Defined in

[crypto/ts/AccQueue.ts:44](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L44)

---

### subDepth

• `Private` **subDepth**: `number`

#### Defined in

[crypto/ts/AccQueue.ts:20](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L20)

---

### subHashFunc

• `Readonly` **subHashFunc**: (`leaves`: `bigint`[]) => `bigint`

#### Type declaration

▸ (`leaves`): `bigint`

##### Parameters

| Name     | Type       |
| :------- | :--------- |
| `leaves` | `bigint`[] |

##### Returns

`bigint`

#### Defined in

[crypto/ts/AccQueue.ts:65](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L65)

---

### subRootQueue

• `Private` **subRootQueue**: [`Queue`](../interfaces/Queue.md)

#### Defined in

[crypto/ts/AccQueue.ts:46](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L46)

---

### subRoots

• `Private` **subRoots**: `bigint`[] = `[]`

#### Defined in

[crypto/ts/AccQueue.ts:52](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L52)

---

### subTreesMerged

• `Private` **subTreesMerged**: `boolean` = `false`

#### Defined in

[crypto/ts/AccQueue.ts:62](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L62)

---

### zeroValue

• `Private` **zeroValue**: `bigint`

#### Defined in

[crypto/ts/AccQueue.ts:26](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L26)

---

### zeros

• `Private` **zeros**: `bigint`[] = `[]`

#### Defined in

[crypto/ts/AccQueue.ts:59](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L59)

## Methods

### arrayToMap

▸ **arrayToMap**(`array`): `Map`\<`number`, `Map`\<`number`, `bigint`\>\>

Convert 2D array to its map representation

#### Parameters

| Name    | Type         | Description |
| :------ | :----------- | :---------- |
| `array` | `bigint`[][] | 2D array    |

#### Returns

`Map`\<`number`, `Map`\<`number`, `bigint`\>\>

map representation of 2D array

#### Defined in

[crypto/ts/AccQueue.ts:614](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L614)

---

### calcSRTdepth

▸ **calcSRTdepth**(): `number`

Calculate the depth of the smallest possible Merkle tree which fits all

#### Returns

`number`

the depth of the smallest possible Merkle tree which fits all

#### Defined in

[crypto/ts/AccQueue.ts:343](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L343)

---

### copy

▸ **copy**(): [`AccQueue`](AccQueue.md)

#### Returns

[`AccQueue`](AccQueue.md)

a deep copy of this object

**`Notice`**

Deep-copies this object

#### Defined in

[crypto/ts/AccQueue.ts:572](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L572)

---

### enqueue

▸ **enqueue**(`leaf`): `number`

Enqueue a leaf into the current subtree

#### Parameters

| Name   | Type     | Description         |
| :----- | :------- | :------------------ |
| `leaf` | `bigint` | The leaf to insert. |

#### Returns

`number`

The index of the leaf

#### Defined in

[crypto/ts/AccQueue.ts:185](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L185)

---

### enqueueOp

▸ **enqueueOp**(`leaf`, `level`): `void`

Private function that performs the actual enqueue operation

#### Parameters

| Name    | Type     | Description              |
| :------ | :------- | :----------------------- |
| `leaf`  | `bigint` | The leaf to insert       |
| `level` | `number` | The level of the subtree |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:226](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L226)

---

### fill

▸ **fill**(): `void`

Fill any empty leaves of the last subtree with zeros and store the
resulting subroot.

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:267](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L267)

---

### fillOp

▸ **fillOp**(`level`): `void`

Private function that performs the actual fill operation

#### Parameters

| Name    | Type     | Description              |
| :------ | :------- | :----------------------- |
| `level` | `number` | The level of the subtree |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:307](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L307)

---

### getHashLength

▸ **getHashLength**(): `number`

Get the number of inputs per hash function

#### Returns

`number`

the number of inputs

#### Defined in

[crypto/ts/AccQueue.ts:176](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L176)

---

### getMainRoots

▸ **getMainRoots**(): `bigint`[]

Get the root of merged subtrees

#### Returns

`bigint`[]

the root of merged subtrees

#### Defined in

[crypto/ts/AccQueue.ts:149](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L149)

---

### getRoot

▸ **getRoot**(`depth`): `undefined` \| `null` \| `bigint`

Get the root at a certain depth

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `depth` | `number` | The depth of the tree |

#### Returns

`undefined` \| `null` \| `bigint`

the root

#### Defined in

[crypto/ts/AccQueue.ts:554](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L554)

---

### getSmallSRTroot

▸ **getSmallSRTroot**(): `bigint`

Get the small SRT root

#### Returns

`bigint`

small SRT root

#### Defined in

[crypto/ts/AccQueue.ts:125](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L125)

---

### getSubDepth

▸ **getSubDepth**(): `number`

Get the subdepth

#### Returns

`number`

subdepth

#### Defined in

[crypto/ts/AccQueue.ts:141](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L141)

---

### getSubRoot

▸ **getSubRoot**(`index`): `bigint`

Get the subroot at a given index

#### Parameters

| Name    | Type     | Description              |
| :------ | :------- | :----------------------- |
| `index` | `number` | The index of the subroot |

#### Returns

`bigint`

the subroot

#### Defined in

[crypto/ts/AccQueue.ts:167](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L167)

---

### getSubRoots

▸ **getSubRoots**(): `bigint`[]

Get the subroots

#### Returns

`bigint`[]

subroots

#### Defined in

[crypto/ts/AccQueue.ts:133](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L133)

---

### getZeros

▸ **getZeros**(): `bigint`[]

Get the zero values per level. i.e. zeros[0] is zeroValue,
zeros[1] is the hash of leavesPerNode zeros, and so on.

#### Returns

`bigint`[]

zeros

#### Defined in

[crypto/ts/AccQueue.ts:158](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L158)

---

### hasRoot

▸ **hasRoot**(`depth`): `boolean`

Check if the root at a certain depth exists (subtree root)

#### Parameters

| Name    | Type     | Description           |
| :------ | :------- | :-------------------- |
| `depth` | `number` | the depth of the tree |

#### Returns

`boolean`

whether the root exists

#### Defined in

[crypto/ts/AccQueue.ts:563](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L563)

---

### hash

▸ **hash**(`leaves`): `bigint`

Hash an array of leaves

#### Parameters

| Name     | Type       | Description        |
| :------- | :--------- | :----------------- |
| `leaves` | `bigint`[] | The leaves to hash |

#### Returns

`bigint`

the hash value of the leaves

#### Defined in

[crypto/ts/AccQueue.ts:623](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L623)

---

### insertSubTree

▸ **insertSubTree**(`subRoot`): `void`

Insert a subtree into the queue. This is used when the subtree is
already computed.

#### Parameters

| Name      | Type     | Description             |
| :-------- | :------- | :---------------------- |
| `subRoot` | `bigint` | The root of the subtree |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:359](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L359)

---

### mapToArray

▸ **mapToArray**(`map`): `bigint`[][]

Convert map to 2D array

#### Parameters

| Name  | Type                                           | Description                    |
| :---- | :--------------------------------------------- | :----------------------------- |
| `map` | `Map`\<`number`, `Map`\<`number`, `bigint`\>\> | map representation of 2D array |

#### Returns

`bigint`[][]

2D array

#### Defined in

[crypto/ts/AccQueue.ts:604](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L604)

---

### merge

▸ **merge**(`depth`): `void`

Merge all the subroots into a tree of a specified depth.
It requires this.mergeSubRoots() to be run first.

#### Parameters

| Name    | Type     |
| :------ | :------- |
| `depth` | `number` |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:381](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L381)

---

### mergeDirect

▸ **mergeDirect**(`depth`): `void`

Merge all the subroots into a tree of a specified depth.
Uses an IncrementalQuinTree instead of the two-step method that
AccQueue.sol uses.

#### Parameters

| Name    | Type     |
| :------ | :------- |
| `depth` | `number` |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:415](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L415)

---

### mergeSubRoots

▸ **mergeSubRoots**(`numSrQueueOps?`): `void`

Merge all subroots into the smallest possible Merkle tree which fits
them. e.g. if there are 5 subroots and hashLength == 2, the tree depth
is 3 since 2 \*\* 3 = 8 which is the next power of 2.

#### Parameters

| Name            | Type     | Default value | Description                                  |
| :-------------- | :------- | :------------ | :------------------------------------------- |
| `numSrQueueOps` | `number` | `0`           | The number of subroots to queue into the SRT |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:462](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L462)

---

### queueSubRoot

▸ **queueSubRoot**(`leaf`, `level`, `maxDepth`): `void`

Queues the leaf (a subroot) into queuedSRTlevels

#### Parameters

| Name       | Type     | Description                   |
| :--------- | :------- | :---------------------------- |
| `leaf`     | `bigint` | The leaf to insert            |
| `level`    | `number` | The level of the subtree      |
| `maxDepth` | `number` | The maximum depth of the tree |

#### Returns

`void`

#### Defined in

[crypto/ts/AccQueue.ts:523](https://github.com/privacy-scaling-explorations/maci/blob/6a905de08/crypto/ts/AccQueue.ts#L523)
