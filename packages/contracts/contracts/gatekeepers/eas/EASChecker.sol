// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

import { IEAS } from "./IEAS.sol";

/// @title EASChecker
/// @notice EAS validator.
/// @dev Extends BaseChecker to implement EAS validation logic.
contract EASChecker is BaseChecker {
  // the reference to the EAS contract
  IEAS public eas;

  // the schema to check against
  bytes32 public schema;

  // the trusted attester
  address public attester;

  /// @notice custom errors
  error AttestationRevoked();
  error AttesterNotTrusted();
  error NotYourAttestation();
  error InvalidSchema();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (address _eas, address _attester, bytes32 _schema) = abi.decode(data, (address, address, bytes32));

    eas = IEAS(_eas);
    attester = _attester;
    schema = _schema;
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate.
  /// @param evidence Encoded data used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // decode the argument
    bytes32 attestationId = abi.decode(evidence, (bytes32));

    // get the attestation from the EAS contract
    IEAS.Attestation memory attestation = eas.getAttestation(attestationId);

    // the schema must match
    if (attestation.schema != schema) {
      revert InvalidSchema();
    }

    // we check that the attestation attester is the trusted one
    if (attestation.attester != attester) {
      revert AttesterNotTrusted();
    }

    // we check that it was not revoked
    if (attestation.revocationTime != 0) {
      revert AttestationRevoked();
    }

    // one cannot register an attestation for another user
    if (attestation.recipient != subject) {
      revert NotYourAttestation();
    }

    return true;
  }
}
