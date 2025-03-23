// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

import { ZupassGroth16Verifier } from "./ZupassGroth16Verifier.sol";

/// @title ZupassChecker
/// @notice Zupass validator.
/// @dev Extends BaseChecker to implement Zupass validation logic.
contract ZupassChecker is BaseChecker {
  /// @notice the Zupass event UUID converted to bigint
  uint256 public validEventId;

  /// @notice the Zupass event first signer converted to bigint
  uint256 public validSigner1;

  /// @notice the Zupass event second signer converted to bigint
  uint256 public validSigner2;

  /// @notice the ZupassGroth16Verifier contract address
  ZupassGroth16Verifier public verifier;

  /// @notice custom errors
  error InvalidProof();
  error InvalidEventId();
  error InvalidSigners();
  error InvalidWatermark();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (uint256 eventId, uint256 signer1, uint256 signer2, address verifierAddress) = abi.decode(
      data,
      (uint256, uint256, uint256, address)
    );

    validEventId = eventId;
    validSigner1 = signer1;
    validSigner2 = signer2;
    verifier = ZupassGroth16Verifier(verifierAddress);
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate.
  /// @param evidence Encoded data used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // Decode the given _data bytes
    (uint256[2] memory pA, uint256[2][2] memory pB, uint256[2] memory pC, uint256[38] memory pubSignals) = abi.decode(
      evidence,
      (uint256[2], uint256[2][2], uint256[2], uint256[38])
    );

    // Verify proof
    if (!verifier.verifyProof(pA, pB, pC, pubSignals)) {
      revert InvalidProof();
    }

    // Event id is stored at index 1
    if (pubSignals[1] != validEventId) {
      revert InvalidEventId();
    }

    // Signers are stored at index 13 and 14
    if (pubSignals[13] != validSigner1 || pubSignals[14] != validSigner2) {
      revert InvalidSigners();
    }

    // Watermark is stored at index 37
    // user address converted to bigint is used as the watermark
    if (pubSignals[37] != uint256(uint160(subject))) {
      revert InvalidWatermark();
    }

    return true;
  }
}
