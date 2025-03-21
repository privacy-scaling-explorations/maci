// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { SemaphoreGatekeeper } from "./SemaphoreGatekeeper.sol";

/// @title SemaphoreGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of SemaphoreGatekeeper.
/// @dev Simplifies deployment of SemaphoreGatekeeper clones with appended configuration data.
contract SemaphoreGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the SemaphoreGatekeeper implementation.
  constructor() Factory(address(new SemaphoreGatekeeper())) {}

  /// @notice Deploys a new SemaphoreGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    SemaphoreGatekeeper(clone).initialize();
  }
}
