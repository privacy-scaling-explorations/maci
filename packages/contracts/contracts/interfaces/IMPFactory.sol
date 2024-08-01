// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IMessageProcessorFactory
/// @notice MessageProcessorFactory interface
interface IMessageProcessorFactory {
  /// @notice Deploy a new MessageProcessor contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _vkRegistry VkRegistry contract
  /// @param _poll Poll contract
  /// @param _owner Owner of the MessageProcessor contract
  /// @param _mode Voting mode
  /// @return The deployed MessageProcessor contract
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _owner,
    DomainObjs.Mode _mode
  ) external returns (address);
}
