// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IPollFactory
/// @notice PollFactory interface
interface IPollFactory {
  /// @notice Deploy a new Poll contract and AccQueue contract for messages.
  /// @param _duration The duration of the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _maci The MACI contract interface reference
  /// @param _emptyBallotRoot The root of the empty ballot tree
  /// @return The deployed Poll contract
  function deploy(
    uint256 _duration,
    Params.TreeDepths memory _treeDepths,
    DomainObjs.PubKey memory _coordinatorPubKey,
    address _maci,
    uint256 _emptyBallotRoot
  ) external returns (address);
}
