// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { InitialVoiceCreditProxy } from "./InitialVoiceCreditProxy.sol";

/// @title ConstantInitialVoiceCreditProxy
/// @notice This contract allows to set a constant initial voice credit balance
/// for MACI's voters.
contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {
  /// @notice the balance to be returned by getVoiceCredits
  uint256 internal balance;

  /// @notice creates a new ConstantInitialVoiceCreditProxy
  constructor(uint256 _balance) {
    balance = _balance;
  }

  /// @notice Returns the constant balance for any new MACI's voter
  /// @param _address the address of the voter
  /// @param _data additional data
  /// @return the balance
  function getVoiceCredits(address _address, bytes memory _data) public view override returns (uint256) {
    return balance;
  }
}
