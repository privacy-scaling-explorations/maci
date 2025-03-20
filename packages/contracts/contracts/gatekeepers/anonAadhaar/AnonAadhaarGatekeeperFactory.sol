// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { AnonAadhaarGatekeeper } from "./AnonAadhaarGatekeeper.sol";

/// @title AnonAadhaarGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of AnonAadhaarGatekeeper.
/// @dev Simplifies deployment of AnonAadhaarGatekeeper clones with appended configuration data.
contract AnonAadhaarGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the AnonAadhaarGatekeeper implementation.
  constructor() Factory(address(new AnonAadhaarGatekeeper())) {}

  /// @notice Deploys a new AnonAadhaarGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    AnonAadhaarGatekeeper(clone).initialize();
  }
}
