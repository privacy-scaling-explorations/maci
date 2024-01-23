// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IMACI } from "./IMACI.sol";
import { TopupCredit } from "../TopupCredit.sol";
import { Params } from "../utilities/Params.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";

/// @title IPollFactory
/// @notice PollFactory interface
interface IPollFactory {
  /// @notice Deploy a new Poll contract and AccQueue contract for messages.
  /// @param _duration The duration of the poll
  /// @param _maxValues The max values for the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _maci The MACI contract interface reference
  /// @param _topupCredit The TopupCredit contract
  /// @param _pollOwner The owner of the poll
  /// @return The deployed Poll contract
  function deploy(
    uint256 _duration,
    Params.MaxValues memory _maxValues,
    Params.TreeDepths memory _treeDepths,
    DomainObjs.PubKey memory _coordinatorPubKey,
    IMACI _maci,
    TopupCredit _topupCredit,
    address _pollOwner
  ) external returns (address);
}
