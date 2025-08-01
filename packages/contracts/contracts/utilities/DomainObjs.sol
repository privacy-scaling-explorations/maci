// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title DomainObjs
/// @notice An utility contract that holds
/// a number of domain objects and functions
contract DomainObjs {
  /// @notice the length of a MACI message
  uint8 public constant MESSAGE_DATA_LENGTH = 10;

  /// @notice voting modes
  enum Mode {
    QV,
    NON_QV,
    FULL
  }

  /// @title Message
  /// @notice this struct represents a MACI message
  /// @dev msgType: 1 for vote message
  struct Message {
    uint256[MESSAGE_DATA_LENGTH] data;
  }

  /// @title PublicKey
  /// @notice A MACI public key
  struct PublicKey {
    uint256 x;
    uint256 y;
  }

  /// @title StateLeaf
  /// @notice A MACI state leaf
  /// @dev used to represent a user's state
  /// in the state Merkle tree
  struct StateLeaf {
    PublicKey publicKey;
    uint256 voiceCreditBalance;
  }
}
