// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IPollFactory
/// @notice PollFactory interface
interface IPollFactory {
  /// @notice A struct holding the arguments for poll deployment
  struct DeployPollArgs {
    /// @param startDate The start date of the poll
    uint256 startDate;
    /// @param endDate The end date of the poll
    uint256 endDate;
    /// @param treeDepths The depths of the merkle trees
    Params.TreeDepths treeDepths;
    /// @param messageBatchSize The size of message batch
    uint8 messageBatchSize;
    /// @param coordinatorPublicKey The coordinator's public key
    DomainObjs.PublicKey coordinatorPublicKey;
    /// @param extContracts The external contracts interface references
    Params.ExtContracts extContracts;
    /// @param emptyBallotRoot The root of the empty ballot tree
    uint256 emptyBallotRoot;
    /// @param pollId The poll id
    uint256 pollId;
    /// @param relayers The message relayers (optional)
    address[] relayers;
    /// @param voteOptions The number of vote options for the poll
    uint256 voteOptions;
  }

  /// @notice Deploy a new Poll contract
  /// @param _args The arguments for the poll deployment
  /// @return The deployed Poll contract
  function deploy(DeployPollArgs calldata _args) external returns (address);
}
