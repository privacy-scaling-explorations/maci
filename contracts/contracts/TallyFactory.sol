// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Tally } from "./Tally.sol";
import { ITallyFactory } from "./interfaces/ITallyFactory.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title TallyFactory
/// @notice A factory contract which deploys Tally contracts.
contract TallyFactory is ITallyFactory, DomainObjs {
  /// @inheritdoc ITallyFactory
  function deploy(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _messageProcessor,
    address _owner,
    Mode _mode
  ) public virtual returns (address tallyAddr) {
    // deploy Tally for this Poll
    Tally tally = new Tally(_verifier, _vkRegistry, _poll, _messageProcessor, _owner, _mode);
    tallyAddr = address(tally);
  }
}
