// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { GitcoinPassportGatekeeper } from "./GitcoinPassportGatekeeper.sol";

/// @title GitcoinPassportGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of GitcoinPassportGatekeeper.
/// @dev Simplifies deployment of GitcoinPassportGatekeeper clones with appended configuration data.
contract GitcoinPassportGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the GitcoinPassportGatekeeper implementation.
  constructor() Factory(address(new GitcoinPassportGatekeeper())) {}

  /// @notice Deploys a new GitcoinPassportGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    GitcoinPassportGatekeeper(clone).initialize();
  }
}
