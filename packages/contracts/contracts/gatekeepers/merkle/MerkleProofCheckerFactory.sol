// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { MerkleProofChecker } from "./MerkleProofChecker.sol";

/// @title MerkleProofCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of MerkleProofChecker.
/// @dev Simplifies deployment of MerkleProofChecker clones with appended configuration data.
contract MerkleProofCheckerFactory is Factory {
  /// @notice Initializes the factory with the MerkleProofChecker implementation.
  constructor() Factory(address(new MerkleProofChecker())) {}

  /// @notice Deploys a new MerkleProofChecker clone.
  /// @param root The tree root
  function deploy(bytes32 root) public {
    bytes memory data = abi.encode(root);
    address clone = super._deploy(data);

    MerkleProofChecker(clone).initialize();
  }
}
