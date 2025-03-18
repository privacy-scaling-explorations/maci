// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { FreeForAllChecker } from "./FreeForAllChecker.sol";

/// @title FreeForAllCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of FreeForAllChecker.
/// @dev Simplifies deployment of FreeForAllChecker clones with appended configuration data.
contract FreeForAllCheckerFactory is Factory {
  /// @notice Initializes the factory with the FreeForAllChecker implementation.
  constructor() Factory(address(new FreeForAllChecker())) {}

  /// @notice Deploys a new FreeForAllChecker clone.
  function deploy() public {
    bytes memory data = abi.encode();
    address clone = super._deploy(data);

    FreeForAllChecker(clone).initialize();
  }
}
