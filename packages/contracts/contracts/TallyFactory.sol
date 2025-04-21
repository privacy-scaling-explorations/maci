// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/contracts/proxy/Factory.sol";

import { Tally } from "./Tally.sol";
import { ITallyFactory } from "./interfaces/ITallyFactory.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title TallyFactory
/// @notice Factory contract for deploying minimal proxy instances of Tally.
/// @dev Simplifies deployment of Tally clones with appended configuration data.
contract TallyFactory is Factory, ITallyFactory, DomainObjs {
  /// @notice Initializes the factory with the Tally implementation.
  constructor() Factory(address(new Tally())) {}

  /// @inheritdoc ITallyFactory
  function deploy(
    address _verifier,
    address _verifyingKeysRegistry,
    address _poll,
    address _messageProcessor,
    Mode _mode
  ) public virtual returns (address tallyAddress) {
    bytes memory data = abi.encode(_verifier, _verifyingKeysRegistry, _poll, _messageProcessor, _mode);
    address clone = super._deploy(data);

    Tally(clone).initialize();

    tallyAddress = clone;
  }
}
