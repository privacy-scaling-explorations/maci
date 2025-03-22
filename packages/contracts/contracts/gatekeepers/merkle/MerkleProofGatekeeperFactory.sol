// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { MerkleProofGatekeeper } from "./MerkleProofGatekeeper.sol";

/// @title MerkleProofGatekeeperFactory
/// @notice Factory contract for deploying minimal proxy instances of MerkleProofGatekeeper.
/// @dev Simplifies deployment of MerkleProofGatekeeper clones with appended configuration data.
contract MerkleProofGatekeeperFactory is Factory {
  /// @notice Initializes the factory with the MerkleProofGatekeeper implementation.
  constructor() Factory(address(new MerkleProofGatekeeper())) {}

  /// @notice Deploys a new MerkleProofGatekeeper clone with the specified checker address.
  /// @dev Encodes the checker address and caller as configuration data for the clone.
  /// @param checkerAddress Address of the checker to use for validation.
  function deploy(address checkerAddress) public {
    bytes memory data = abi.encode(msg.sender, checkerAddress);

    address clone = super._deploy(data);

    MerkleProofGatekeeper(clone).initialize();
  }
}
