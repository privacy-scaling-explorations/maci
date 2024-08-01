# HasherBenchmarks

A contract used to benchmark the poseidon hash function

### hash5Benchmark

```solidity
function hash5Benchmark(uint256[5] array) public pure returns (uint256 result)
```

Benchmark the poseidon hash function with 5 inputs

#### Parameters

| Name  | Type       | Description                 |
| ----- | ---------- | --------------------------- |
| array | uint256[5] | The array of inputs to hash |

#### Return Values

| Name   | Type    | Description            |
| ------ | ------- | ---------------------- |
| result | uint256 | The hash of the inputs |

### hashLeftRightBenchmark

```solidity
function hashLeftRightBenchmark(uint256 _left, uint256 _right) public pure returns (uint256 result)
```

Benchmark the poseidon hash function with 2 inputs

#### Parameters

| Name    | Type    | Description             |
| ------- | ------- | ----------------------- |
| \_left  | uint256 | The left input to hash  |
| \_right | uint256 | The right input to hash |

#### Return Values

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| result | uint256 | The hash of the two inputs |
