// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

import { IAnonAadhaar } from "./IAnonAadhaar.sol";

/// @title AnonAadhaarChecker
/// @notice AnonAadhaar validator.
/// @dev Extends BaseChecker to implement Zupass validation logic.
contract AnonAadhaarChecker is BaseChecker {
  /// @notice The AnonAadhaar contract
  IAnonAadhaar public anonAadhaarContract;

  /// @notice The nullifier seed
  uint256 public nullifierSeed;

  /// @notice Errors
  error InvalidProof();
  error InvalidSignal();
  error InvalidNullifierSeed();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (address _anonAadhaarVerifier, uint256 _nullifierSeed) = abi.decode(data, (address, uint256));

    anonAadhaarContract = IAnonAadhaar(_anonAadhaarVerifier);
    nullifierSeed = _nullifierSeed;
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate ownership for.
  /// @param evidence Encoded token ID used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // decode the argument
    (
      uint256 providedNullifierSeed,
      uint256 nullifier,
      uint256 timestamp,
      uint256 signal,
      uint256[4] memory revealArray,
      uint256[8] memory groth16Proof
    ) = abi.decode(evidence, (uint256, uint256, uint256, uint256, uint256[4], uint256[8]));

    // ensure that the provided nullifier seed matches the stored nullifier seed
    if (providedNullifierSeed != nullifierSeed) {
      revert InvalidNullifierSeed();
    }

    // ensure that the signal is correct
    if (signal != uint256(uint160(subject))) {
      revert InvalidSignal();
    }

    // check if the proof validates
    if (
      !anonAadhaarContract.verifyAnonAadhaarProof(
        providedNullifierSeed,
        nullifier,
        timestamp,
        signal,
        revealArray,
        groth16Proof
      )
    ) {
      revert InvalidProof();
    }

    return true;
  }
}
