// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title MerkleProofChecker
/// @notice Merkle validator.
/// @dev Extends BaseChecker to implement Merkle validation logic.
contract MerkleProofChecker is BaseChecker {
  // the merkle tree root
  bytes32 public root;

  /// @notice custom errors
  error InvalidProof();
  error InvalidRoot();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    bytes32 _root = abi.decode(data, (bytes32));

    if (_root == bytes32(0)) {
      revert InvalidRoot();
    }

    root = _root;
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate ownership for.
  /// @param evidence Encoded token ID used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    bytes32[] memory proof = abi.decode(evidence, (bytes32[]));

    // get the leaf
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(subject))));

    // check the proof
    if (!MerkleProof.verify(proof, root, leaf)) {
      revert InvalidProof();
    }

    return true;
  }
}
