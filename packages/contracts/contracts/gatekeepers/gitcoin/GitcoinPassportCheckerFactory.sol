// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { GitcoinPassportChecker } from "./GitcoinPassportChecker.sol";

/// @title GitcoinPassportCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of GitcoinPassportChecker.
/// @dev Simplifies deployment of GitcoinPassportChecker clones with appended configuration data.
contract GitcoinPassportCheckerFactory is Factory {
  /// @notice Initializes the factory with the GitcoinPassportChecker implementation.
  constructor() Factory(address(new GitcoinPassportChecker())) {}

  /// @notice Deploys a new GitcoinPassportChecker clone.
  /// @param passportDecoder The GitcoinPassportDecoder contract
  /// @param thresholdScore The threshold score to be considered human
  function deploy(address passportDecoder, uint256 thresholdScore) public {
    bytes memory data = abi.encode(passportDecoder, thresholdScore);
    address clone = super._deploy(data);

    GitcoinPassportChecker(clone).initialize();
  }
}
