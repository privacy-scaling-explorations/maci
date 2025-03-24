// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { HatsChecker } from "./HatsChecker.sol";

/// @title HatsCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of HatsChecker.
/// @dev Simplifies deployment of HatsChecker clones with appended configuration data.
contract HatsCheckerFactory is Factory {
  /// @notice Initializes the factory with the HatsChecker implementation.
  constructor() Factory(address(new HatsChecker())) {}

  /// @notice Deploys a new HatsChecker clone.
  /// @param hats The Hats Protocol contract
  /// @param criterionHats Array of accepted criterion hats
  function deploy(address hats, uint256[] calldata criterionHats) public {
    bytes memory data = abi.encode(hats, criterionHats);
    address clone = super._deploy(data);

    HatsChecker(clone).initialize();
  }
}
