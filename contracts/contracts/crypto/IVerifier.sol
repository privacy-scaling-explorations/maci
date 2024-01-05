// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SnarkCommon } from "./SnarkCommon.sol";

/// @title IVerifier
/// @notice an interface for a Groth16 verifier contract
abstract contract IVerifier is SnarkCommon {
  /// @notice Verify a zk-SNARK proof
  function verify(uint256[8] memory, VerifyingKey memory, uint256) public view virtual returns (bool);
}
