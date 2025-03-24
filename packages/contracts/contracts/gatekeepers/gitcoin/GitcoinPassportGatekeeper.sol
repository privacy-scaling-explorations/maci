// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";
import { IGitcoinPassportDecoder } from "./IGitcoinPassportDecoder.sol";

/// @title GitcoinPassportGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they've received an attestation of a specific schema from a trusted attester
contract GitcoinPassportGatekeeper is SignUpGatekeeper {
  // a mapping of attestations that have already registered
  mapping(address => bool) public registeredUsers;

  /// @notice Deploy an instance of GitcoinPassportGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Register an user based on their attestation
  /// @dev Throw if the attestation is not valid or just complete silently
  /// @param _subject The user's Ethereum address.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // ensure that the user has not been registered yet
    if (registeredUsers[_subject]) revert AlreadyRegistered();

    // register the user so it cannot register again
    registeredUsers[_subject] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "GitcoinPassport";
  }
}
