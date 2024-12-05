// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title IEAS
/// @notice An interface to the EAS contract.
interface IEAS {
  /// @notice A struct representing a single attestation.
  struct Attestation {
    // A unique identifier of the attestation.
    bytes32 uid;
    // The unique identifier of the schema.
    bytes32 schema;
    // The time when the attestation was created (Unix timestamp).
    uint64 time;
    // The time when the attestation expires (Unix timestamp).
    uint64 expirationTime;
    // The time when the attestation was revoked (Unix timestamp).
    uint64 revocationTime;
    // The UID of the related attestation.
    bytes32 refUID;
    // The recipient of the attestation.
    address recipient;
    // The attester/sender of the attestation.
    address attester;
    // Whether the attestation is revocable.
    bool revocable;
    // Custom attestation data.
    bytes data;
  }

  /// Get an attestation by its unique identifier.
  /// @param uid The unique identifier of the attestation.
  /// @return attestation The attestation.
  function getAttestation(bytes32 uid) external view returns (Attestation memory);
}
