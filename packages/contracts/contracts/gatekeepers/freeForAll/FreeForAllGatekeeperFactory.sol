// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { FreeForAllGatekeeper } from "./FreeForAllGatekeeper.sol";

/// @title FreeForAllGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of FreeForAllGatekeeper.
/// @dev Simplifies deployment of FreeForAllGatekeeper clones with appended configuration data.
contract FreeForAllGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the FreeForAllGatekeeper implementation.
  constructor() Factory(address(new FreeForAllGatekeeper())) {}

  /// @notice Deploys a new FreeForAllGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param _checkerAddress Address of the checker to use for validation.
  function deploy(address _checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, _checkerAddress);

    address clone = super._deploy(data);

    FreeForAllGatekeeper(clone).initialize();
  }
}
