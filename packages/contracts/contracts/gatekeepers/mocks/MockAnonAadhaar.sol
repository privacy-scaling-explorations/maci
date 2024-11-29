// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IAnonAadhaar } from "../interfaces/IAnonAadhaar.sol";

/// @title MockAnonAadhaar
/// @notice A mock contract to test the AnonAadhaarGatekeeper
contract MockAnonAadhaar is IAnonAadhaar {
  bool public valid = true;

  /// @notice Mock function to flip the valid state
  function flipValid() external {
    valid = !valid;
  }

  /// @notice Mock implementation of verifyAnonAadhaarProof
  function verifyAnonAadhaarProof(
    uint256 nullifierSeed,
    uint256 nullifier,
    uint256 timestamp,
    uint256 signal,
    uint256[4] memory revealArray,
    uint256[8] memory groth16Proof
  ) external view override returns (bool) {
    return valid;
  }
}
