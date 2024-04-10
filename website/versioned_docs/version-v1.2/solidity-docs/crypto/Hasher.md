# Hasher

A SHA256 hash function for any number of input elements, and Poseidon hash
functions for 2, 3, 4, 5, and 12 input elements.

### sha256Hash

```solidity
function sha256Hash(uint256[] array) public pure returns (uint256 result)
```

Computes the SHA256 hash of an array of uint256 elements.

#### Parameters

| Name  | Type      | Description                    |
| ----- | --------- | ------------------------------ |
| array | uint256[] | The array of uint256 elements. |

#### Return Values

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| result | uint256 | The SHA256 hash of the array. |

### hash2

```solidity
function hash2(uint256[2] array) public pure returns (uint256 result)
```

Computes the Poseidon hash of two uint256 elements.

#### Parameters

| Name  | Type       | Description                       |
| ----- | ---------- | --------------------------------- |
| array | uint256[2] | An array of two uint256 elements. |

#### Return Values

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| result | uint256 | The Poseidon hash of the two elements. |

### hash3

```solidity
function hash3(uint256[3] array) public pure returns (uint256 result)
```

Computes the Poseidon hash of three uint256 elements.

#### Parameters

| Name  | Type       | Description                         |
| ----- | ---------- | ----------------------------------- |
| array | uint256[3] | An array of three uint256 elements. |

#### Return Values

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| result | uint256 | The Poseidon hash of the three elements. |

### hash4

```solidity
function hash4(uint256[4] array) public pure returns (uint256 result)
```

Computes the Poseidon hash of four uint256 elements.

#### Parameters

| Name  | Type       | Description                        |
| ----- | ---------- | ---------------------------------- |
| array | uint256[4] | An array of four uint256 elements. |

#### Return Values

| Name   | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| result | uint256 | The Poseidon hash of the four elements. |

### hash5

```solidity
function hash5(uint256[5] array) public pure returns (uint256 result)
```

Computes the Poseidon hash of five uint256 elements.

#### Parameters

| Name  | Type       | Description                        |
| ----- | ---------- | ---------------------------------- |
| array | uint256[5] | An array of five uint256 elements. |

#### Return Values

| Name   | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| result | uint256 | The Poseidon hash of the five elements. |

### hashLeftRight

```solidity
function hashLeftRight(uint256 left, uint256 right) public pure returns (uint256 result)
```

Computes the Poseidon hash of two uint256 elements.

#### Parameters

| Name  | Type    | Description                 |
| ----- | ------- | --------------------------- |
| left  | uint256 | the first element to hash.  |
| right | uint256 | the second element to hash. |

#### Return Values

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| result | uint256 | The Poseidon hash of the two elements. |
