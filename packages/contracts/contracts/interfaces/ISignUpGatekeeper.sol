// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title ISignUpGatekeeper
/// @notice SignUpGatekeeper interface
interface ISignUpGatekeeper {
  /// @notice Register a user
  /// @param _user User address
  /// @param _data Data to register
  function register(address _user, bytes memory _data) external;
}
