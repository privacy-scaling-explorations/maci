// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { InitialVoiceCreditProxy } from "./InitialVoiceCreditProxy.sol";

/// @title ETHBasedInitialVoiceCreditProxy
/// @notice This contract allows to set balances depending on the amount of ETH sent
/// for MACI's voters.
contract ETHBasedInitialVoiceCreditProxy is InitialVoiceCreditProxy {
  /// @notice the address where the ETH will be sent
  address payable public immutable receiver;
  /// @notice the conversion rate between ETH and voice credits
  uint256 internal immutable conversionRate;
  mapping(address => uint256) public balances;

  /// @notice creates a new ETHBasedInitialVoiceCreditProxy
  /// @param _receiver the address where the ETH will be sent
  /// @param _conversionRate the conversion rate between ETH and voice credits
  constructor(address payable _receiver, uint256 _conversionRate) payable {
    receiver = _receiver;
    conversionRate = _conversionRate;
  }

  /// @notice Returns the voice credits based on the amount of ETH sent for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address _user, bytes memory) public view override returns (uint256) {
    // Calculate the voice credits based on the amount of ETH sent
    uint256 voiceCredits = (balances[_user] * conversionRate) / 1 ether;
    return voiceCredits;
  }

  /// @notice Saves the amount of voice credits for any new MACI's voter
  /// @dev The real amount is saved (no conversion here) to allow full withdrawals
  /// @param _user the address of the voter
  function registerVoiceCredits(address _user) public payable {
    // set user's balanace
    balances[_user] += msg.value;
    // send ETH to the receiver address
    receiver.transfer(msg.value);
  }
}
