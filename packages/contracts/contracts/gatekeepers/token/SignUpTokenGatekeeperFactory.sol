// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { SignUpTokenGatekeeper } from "./SignUpTokenGatekeeper.sol";

/// @title SignUpTokenGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of SignUpTokenGatekeeper.
/// @dev Simplifies deployment of SignUpTokenGatekeeper clones with appended configuration data.
contract SignUpTokenGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the SignUpTokenGatekeeper implementation.
  constructor() Factory(address(new SignUpTokenGatekeeper())) {}

  /// @notice Deploys a new SignUpTokenGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    SignUpTokenGatekeeper(clone).initialize();
  }
}
