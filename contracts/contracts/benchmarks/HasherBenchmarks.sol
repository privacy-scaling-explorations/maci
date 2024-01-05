// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Hasher } from "../crypto/Hasher.sol";

/// @title HasherBenchmarks
/// @notice A contract used to benchmark the poseidon hash function
contract HasherBenchmarks is Hasher {
  /// @notice Benchmark the poseidon hash function with 5 inputs
  /// @param array The array of inputs to hash
  /// @return result The hash of the inputs
  function hash5Benchmark(uint256[5] memory array) public pure returns (uint256 result) {
    result = hash5(array);
  }

  /// @notice Benchmark the poseidon hash function with 2 inputs
  /// @param _left The left input to hash
  /// @param _right The right input to hash
  /// @return result The hash of the two inputs
  function hashLeftRightBenchmark(uint256 _left, uint256 _right) public pure returns (uint256 result) {
    result = hashLeftRight(_left, _right);
  }
}
