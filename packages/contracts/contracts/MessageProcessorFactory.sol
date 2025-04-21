// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/contracts/proxy/Factory.sol";

import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { MessageProcessor } from "./MessageProcessor.sol";
import { IMessageProcessorFactory } from "./interfaces/IMessageProcessorFactory.sol";

/// @title MessageProcessorFactory
/// @notice Factory contract for deploying minimal proxy instances of MessageProcessor.
/// @dev Simplifies deployment of MessageProcessor clones with appended configuration data.
contract MessageProcessorFactory is Factory, Params, DomainObjs, IMessageProcessorFactory {
  /// @notice Initializes the factory with the MessageProcessor implementation.
  constructor() Factory(address(new MessageProcessor())) {}

  /// @inheritdoc IMessageProcessorFactory
  function deploy(
    address _verifier,
    address _verifyingKeysRegistry,
    address _poll,
    Mode _mode
  ) public returns (address messageProcessorAddress) {
    bytes memory data = abi.encode(_verifier, _verifyingKeysRegistry, _poll, _mode);
    address clone = super._deploy(data);

    MessageProcessor(clone).initialize();

    messageProcessorAddress = clone;
  }
}
