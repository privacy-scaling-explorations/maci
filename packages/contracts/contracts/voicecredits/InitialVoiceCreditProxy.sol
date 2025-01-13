// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InitialVoiceCreditProxy
/// @notice This contract is the base contract for
/// InitialVoiceCreditProxy contracts. It allows to set a custom initial voice
/// credit balance for MACI's voters.
abstract contract InitialVoiceCreditProxy {
  /// @notice Returns the initial voice credit balance for a new MACI's voter
  /// @param _user the address of the voter
  /// @param _data additional data
  /// @return the balance
  // solhint-disable-next-line no-empty-blocks
  function getVoiceCredits(address _user, bytes memory _data) public view virtual returns (uint256) {}
}
