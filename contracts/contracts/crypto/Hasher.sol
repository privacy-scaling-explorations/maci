// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SnarkConstants } from "./SnarkConstants.sol";
import { PoseidonT3 } from "./PoseidonT3.sol";
import { PoseidonT4 } from "./PoseidonT4.sol";
import { PoseidonT5 } from "./PoseidonT5.sol";
import { PoseidonT6 } from "./PoseidonT6.sol";

/// @notice A SHA256 hash function for any number of input elements, and Poseidon hash
/// functions for 2, 3, 4, 5, and 12 input elements.
contract Hasher is SnarkConstants {
  /// @notice Computes the SHA256 hash of an array of uint256 elements.
  /// @param array The array of uint256 elements.
  /// @return result The SHA256 hash of the array.
  function sha256Hash(uint256[] memory array) public pure returns (uint256 result) {
    result = uint256(sha256(abi.encodePacked(array))) % SNARK_SCALAR_FIELD;
  }

  /// @notice Computes the Poseidon hash of two uint256 elements.
  /// @param array An array of two uint256 elements.
  /// @return result The Poseidon hash of the two elements.
  function hash2(uint256[2] memory array) public pure returns (uint256 result) {
    result = PoseidonT3.poseidon(array);
  }

  /// @notice Computes the Poseidon hash of three uint256 elements.
  /// @param array An array of three uint256 elements.
  /// @return result The Poseidon hash of the three elements.
  function hash3(uint256[3] memory array) public pure returns (uint256 result) {
    result = PoseidonT4.poseidon(array);
  }

  /// @notice Computes the Poseidon hash of four uint256 elements.
  /// @param array An array of four uint256 elements.
  /// @return result The Poseidon hash of the four elements.
  function hash4(uint256[4] memory array) public pure returns (uint256 result) {
    result = PoseidonT5.poseidon(array);
  }

  /// @notice Computes the Poseidon hash of five uint256 elements.
  /// @param array An array of five uint256 elements.
  /// @return result The Poseidon hash of the five elements.
  function hash5(uint256[5] memory array) public pure returns (uint256 result) {
    result = PoseidonT6.poseidon(array);
  }

  /// @notice Computes the Poseidon hash of two uint256 elements.
  /// @param left the first element to hash.
  /// @param right the second element to hash.
  /// @return result The Poseidon hash of the two elements.
  function hashLeftRight(uint256 left, uint256 right) public pure returns (uint256 result) {
    uint256[2] memory input;
    input[0] = left;
    input[1] = right;
    result = hash2(input);
  }
}
