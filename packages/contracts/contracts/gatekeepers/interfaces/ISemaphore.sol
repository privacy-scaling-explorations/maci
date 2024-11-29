//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title Semaphore contract interface.
interface ISemaphore {
  /// It defines all the Semaphore proof parameters used by Semaphore.sol.
  struct SemaphoreProof {
    uint256 merkleTreeDepth;
    uint256 merkleTreeRoot;
    uint256 nullifier;
    uint256 message;
    uint256 scope;
    uint256[8] points;
  }

  /// @dev Verifies a zero-knowledge proof by returning true or false.
  /// @param groupId: Id of the group.
  /// @param proof: Semaphore zero-knowledge proof.
  function verifyProof(uint256 groupId, SemaphoreProof calldata proof) external view returns (bool);
}
