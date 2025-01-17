// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IInitialVoiceCreditProxy
/// @notice InitialVoiceCreditProxy interface
interface IInitialVoiceCreditProxy {
  /// @notice Get the voice credits of a user
  /// @param _user User address
  /// @param _data Data to get voice credits
  function getVoiceCredits(address _user, bytes memory _data) external view returns (uint256);
}
