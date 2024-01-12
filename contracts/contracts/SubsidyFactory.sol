// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Subsidy } from "./Subsidy.sol";
import { ITallySubsidyFactory } from "./interfaces/ITallySubsidyFactory.sol";

/// @title SubsidyFactory
/// @notice A factory contract which deploys Subsidy contracts.
contract SubsidyFactory is ITallySubsidyFactory {
  /// @inheritdoc ITallySubsidyFactory
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner
  ) public returns (address subsidyAddr) {
    /// @notice deploy Subsidy for this Poll
    Subsidy subsidy = new Subsidy(_verifier, _vkRegistry, _poll, _messageProcessor);
    subsidy.transferOwnership(_owner);
    subsidyAddr = address(subsidy);
  }
}
