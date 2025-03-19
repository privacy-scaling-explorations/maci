// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { ZupassGatekeeper } from "./ZupassGatekeeper.sol";

/// @title ZupassGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of ZupassGatekeeper.
/// @dev Simplifies deployment of ZupassGatekeeper clones with appended configuration data.
contract ZupassGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the ZupassGatekeeper implementation.
  constructor() Factory(address(new ZupassGatekeeper())) {}

  /// @notice Deploys a new ZupassGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param _checkerAddress Address of the checker to use for validation.
  function deploy(address _checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, _checkerAddress);

    address clone = super._deploy(data);

    ZupassGatekeeper(clone).initialize();
  }
}
