// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title SignUpGatekeeper
/// @notice A gatekeeper contract which allows users to sign up for a poll.
abstract contract SignUpGatekeeper {
  /// @notice Allows to set the MACI contract
  // solhint-disable-next-line no-empty-blocks
  function setMaciInstance(address _maci) public virtual {}

  /// @notice Registers the user
  /// @param _user The address of the user
  /// @param _data additional data
  // solhint-disable-next-line no-empty-blocks
  function register(address _user, bytes memory _data) public virtual {}
}
