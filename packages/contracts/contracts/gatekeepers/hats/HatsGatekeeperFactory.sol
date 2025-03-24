// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { HatsGatekeeper } from "./HatsGatekeeper.sol";

/// @title HatsGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of HatsGatekeeper.
/// @dev Simplifies deployment of HatsGatekeeper clones with appended configuration data.
contract HatsGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the HatsGatekeeper implementation.
  constructor() Factory(address(new HatsGatekeeper())) {}

  /// @notice Deploys a new HatsGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    HatsGatekeeper(clone).initialize();
  }
}
