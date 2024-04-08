// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title IMessageProcessorFactory
/// @notice MessageProcessorFactory interface
interface IMessageProcessorFactory {
  /// @notice Deploy a new MessageProcessor contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _vkRegistry VkRegistry contract
  /// @param _poll Poll contract
  /// @param _owner Owner of the MessageProcessor contract
  /// @param _isQv Whether to support QV or not
  /// @return The deployed MessageProcessor contract
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _owner,
    bool _isQv
  ) external returns (address);
}
