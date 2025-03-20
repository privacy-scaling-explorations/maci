// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { EASGatekeeper } from "./EASGatekeeper.sol";

/// @title EASGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of EASGatekeeper.
/// @dev Simplifies deployment of EASGatekeeper clones with appended configuration data.
contract EASGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the EASGatekeeper implementation.
  constructor() Factory(address(new EASGatekeeper())) {}

  /// @notice Deploys a new EASGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    EASGatekeeper(clone).initialize();
  }
}
