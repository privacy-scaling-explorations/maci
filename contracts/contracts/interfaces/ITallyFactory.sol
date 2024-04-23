// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title ITallyFactory
/// @notice TallyFactory interface
interface ITallyFactory {
  /// @notice Deploy a new Tally contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _vkRegistry VkRegistry contract
  /// @param _poll Poll contract
  /// @param _messageProcessor MessageProcessor contract
  /// @param _owner Owner of the contract
  /// @param _mode Voting mode
  /// @return The deployed contract
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner,
    DomainObjs.Mode _mode
  ) external returns (address);
}
