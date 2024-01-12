// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Tally } from "./Tally.sol";
import { ITallySubsidyFactory } from "./interfaces/ITallySubsidyFactory.sol";

/// @title TallyFactory
/// @notice A factory contract which deploys Tally contracts.
contract TallyFactory is ITallySubsidyFactory {
  /// @inheritdoc ITallySubsidyFactory
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner
  ) public returns (address tallyAddr) {
    // deploy Tally for this Poll
    Tally tally = new Tally(_verifier, _vkRegistry, _poll, _messageProcessor);
    tally.transferOwnership(_owner);
    tallyAddr = address(tally);
  }
}
