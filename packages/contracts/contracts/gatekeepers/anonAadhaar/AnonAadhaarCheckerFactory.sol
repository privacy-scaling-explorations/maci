// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { AnonAadhaarChecker } from "./AnonAadhaarChecker.sol";

/// @title AnonAadhaarCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of AnonAadhaarChecker.
/// @dev Simplifies deployment of AnonAadhaarChecker clones with appended configuration data.
contract AnonAadhaarCheckerFactory is Factory {
  /// @notice Initializes the factory with the AnonAadhaarChecker implementation.
  constructor() Factory(address(new AnonAadhaarChecker())) {}

  /// @notice Deploys a new AnonAadhaarChecker clone.
  /// @param anonAadhaarVerifier The address of the anonAadhaar contract
  /// @param nullifierSeed The nullifier seed specific to the app
  function deploy(address anonAadhaarVerifier, uint256 nullifierSeed) public {
    bytes memory data = abi.encode(anonAadhaarVerifier, nullifierSeed);
    address clone = super._deploy(data);

    AnonAadhaarChecker(clone).initialize();
  }
}
