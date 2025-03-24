// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";

/// @title EASGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they've received an attestation of a specific schema from a trusted attester
contract EASGatekeeper is SignUpGatekeeper {
  // a mapping of attestations that have already registered
  mapping(bytes32 => bool) public registeredAttestations;

  /// @notice Deploy an instance of EASGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Register an user based on their attestation
  /// @dev Throw if the attestation is not valid or just complete silently
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The ABI-encoded schemaId as a uint256.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // decode the argument
    bytes32 attestationId = abi.decode(_evidence, (bytes32));

    // ensure that the attestation has not been registered yet
    if (registeredAttestations[attestationId]) {
      revert AlreadyRegistered();
    }

    // register the attestation so it cannot be called again with the same one
    registeredAttestations[attestationId] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "EAS";
  }
}
