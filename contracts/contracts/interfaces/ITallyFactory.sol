// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title ITallyFactory
/// @notice TallyFactory interface
interface ITallyFactory {
  /// @notice Deploy a new Tally contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _vkRegistry VkRegistry contract
  /// @param _poll Poll contract
  /// @param _messageProcessor MessageProcessor contract
  /// @param _owner Owner of the contract
  /// @param _isQv Whether to support QV or not
  /// @return The deployed contract
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner,
    bool _isQv
  ) external returns (address);
}
