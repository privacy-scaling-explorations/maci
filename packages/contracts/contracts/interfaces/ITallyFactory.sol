// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title ITallyFactory
/// @notice TallyFactory interface
interface ITallyFactory {
  /// @notice Deploy a new Tally contract and return the address.
  /// @param _verifier Verifier contract
  /// @param _verifyingKeysRegistry VerifyingKeysRegistry contract
  /// @param _poll Poll contract
  /// @param _messageProcessor MessageProcessor contract
  /// @param _mode Voting mode
  /// @return The deployed contract
  function deploy(
    address _verifier,
    address _verifyingKeysRegistry,
    address _poll,
    address _messageProcessor,
    DomainObjs.Mode _mode
  ) external returns (address);
}
