// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IMessageProcessorFactory
/// @notice MessageProcessorFactory interface
interface IMessageProcessorFactory {
  /// @notice Deploy a new MessageProcessor contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _verifyingKeysRegistry VerifyingKeysRegistry contract
  /// @param _poll Poll contract
  /// @param _mode Voting mode
  /// @return The deployed MessageProcessor contract
  function deploy(
    address _verifier,
    address _verifyingKeysRegistry,
    address _poll,
    DomainObjs.Mode _mode
  ) external returns (address);
}
