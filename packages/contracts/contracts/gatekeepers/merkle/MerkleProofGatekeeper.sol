// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";

/// @title MerkleProofGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are part of the tree
contract MerkleProofGatekeeper is SignUpGatekeeper {
  // a mapping of addresses that have already registered
  mapping(address => bool) public registeredAddresses;

  /// @notice Deploy an instance of MerkleProofGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Register an user based on being part of the tree
  /// @dev Throw if the proof is not valid or the user has already been registered
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The proof that the user is part of the tree.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // ensure that the user has not been registered yet
    if (registeredAddresses[_subject]) {
      revert AlreadyRegistered();
    }

    // register the user so it cannot be called again with the same one
    registeredAddresses[_subject] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "MerkleProof";
  }
}
