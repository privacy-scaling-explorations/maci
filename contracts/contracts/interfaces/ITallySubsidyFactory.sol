// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title ITallySubsidyFactory
/// @notice TallySubsidyFactory interface
interface ITallySubsidyFactory {
  /// @notice Deploy a new Tally or Subsidy contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _vkRegistry VkRegistry contract
  /// @param _poll Poll contract
  /// @param _messageProcessor MessageProcessor contract
  /// @param _owner Owner of the contract
  /// @return The deployed contract
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner
  ) external returns (address);
}
