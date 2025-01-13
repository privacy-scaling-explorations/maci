// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { InitialVoiceCreditProxy } from "./InitialVoiceCreditProxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title PerTokenVoiceCreditProxy
/// @notice This contract allows to set balances depending on the amount of ETH sent
/// for MACI's voters.
contract PerTokenVoiceCreditProxy is InitialVoiceCreditProxy {
  /// @notice the address where the ETH will be sent
  address payable public immutable receiver;
  /// @notice the ERC20 token contract
  IERC20 public immutable token;
  /// @notice the conversion rate between ETH and voice credits
  uint256 internal immutable conversionRate;
  mapping(address => uint256) public balances;

  /// @notice creates a new PerTokenVoiceCreditProxy
  /// @param _receiver the address where the ETH will be sent
  /// @param _conversionRate the conversion rate between ETH and voice credits
  constructor(address payable _receiver, IERC20 _token, uint256 _conversionRate) payable {
    receiver = _receiver;
    token = _token;
    conversionRate = _conversionRate;
  }

  /// @notice Returns the voice credits based on the amount of tokens sent for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address _user, bytes memory) public view override returns (uint256) {
    if (address(token) == address(0)) {
      // Calculate the voice credits based on the amount of ETH sent
      return (balances[_user] * conversionRate) / 1 ether;
    } else {
      // Calculate the voice credits based on the amount of ERC-20 tokens sent
      return balances[_user] * conversionRate;
    }
  }

  /// @notice Saves the amount of voice credits for any new MACI's voter
  /// @dev The real amount is saved (no conversion here) to allow full withdrawals
  /// @param _user the address of the voter
  /// @param _amount the amount of ERC-20 tokens (if ETH then the amount is passed as msg.value)
  function registerVoiceCredits(address _user, uint256 _amount) public payable {
    // set user's balanace
    balances[_user] += msg.value;
    // send tokens to the receiver address
    if (address(token) == address(0)) {
      receiver.transfer(msg.value);
    } else {
      require(token.transferFrom(msg.sender, receiver, _amount), "Transfer failed");
    }
  }
}
