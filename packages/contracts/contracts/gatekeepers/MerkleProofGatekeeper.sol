// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title MerkleProofGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are part of the tree
contract MerkleProofGatekeeper is SignUpGatekeeper {
  // the merkle tree root
  bytes32 public immutable root;

  // a mapping of addresses that have already registered
  mapping(address => bool) public registeredAddresses;

  /// @notice custom errors
  error InvalidProof();
  error InvalidRoot();

  /// @notice Deploy an instance of MerkleProofGatekeeper
  /// @param _root The tree root
  constructor(bytes32 _root) payable {
    if (_root == bytes32(0)) revert InvalidRoot();
    root = _root;
  }

  /// @notice Register an user based on being part of the tree
  /// @dev Throw if the proof is not valid or the user has already been registered
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The proof that the user is part of the tree.
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    bytes32[] memory proof = abi.decode(_evidence, (bytes32[]));

    // ensure that the user has not been registered yet
    if (registeredAddresses[_subject]) revert AlreadyRegistered();

    // register the user so it cannot be called again with the same one
    registeredAddresses[_subject] = true;

    // get the leaf
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_subject))));

    // check the proof
    if (!MerkleProof.verify(proof, root, leaf)) revert InvalidProof();
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "MerkleProof";
  }
}
