// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { SignUpTokenChecker } from "./SignUpTokenChecker.sol";

/// @title SignUpTokenCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of SignUpTokenChecker.
/// @dev Utilizes the Factory pattern to streamline deployment of SignUpTokenChecker clones with configuration data.
contract SignUpTokenCheckerFactory is Factory {
  /// @notice Initializes the factory with the SignUpTokenChecker implementation.
  /// @dev The constructor sets the SignUpTokenChecker contract as the implementation for cloning.
  constructor() Factory(address(new SignUpTokenChecker())) {}

  /// @notice Deploys a new SignUpTokenChecker clone with the specified ERC721 token contract.
  /// @dev Encodes the ERC721 token contract address as initialization data for the clone.
  /// @param token Address of the ERC721 token contract.
  function deploy(address token) public {
    bytes memory data = abi.encode(token);
    address clone = super._deploy(data);

    SignUpTokenChecker(clone).initialize();
  }
}
