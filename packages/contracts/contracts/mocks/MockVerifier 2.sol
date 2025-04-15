// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SnarkConstants } from "../crypto/SnarkConstants.sol";
import { SnarkCommon } from "../crypto/SnarkCommon.sol";
import { IVerifier } from "../interfaces/IVerifier.sol";

/// @title MockVerifier
/// @notice a MockVerifier to be used for testing
contract MockVerifier is IVerifier, SnarkConstants, SnarkCommon {
  /// @notice Verify a zk-SNARK proof (test only return always true)
  /// @return result Whether the proof is valid given the verifying key and public
  function verify(uint256[8] memory, VerifyingKey memory, uint256[] memory) public pure override returns (bool result) {
    result = true;
  }
}
