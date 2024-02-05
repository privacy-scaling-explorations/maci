// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { DomainObjs } from "../utilities/DomainObjs.sol";
import { IMACI } from "./IMACI.sol";
import { AccQueue } from "../trees/AccQueue.sol";
import { TopupCredit } from "../TopupCredit.sol";

/// @title IPoll
/// @notice Poll interface
interface IPoll {
  /// @notice The number of messages which have been processed and the number of signups
  /// @return numSignups The number of signups
  /// @return numMsgs The number of messages sent by voters
  function numSignUpsAndMessages() external view returns (uint256 numSignups, uint256 numMsgs);

  /// @notice Allows to publish a Topup message
  /// @param stateIndex The index of user in the state queue
  /// @param amount The amount of credits to topup
  function topup(uint256 stateIndex, uint256 amount) external;

  /// @notice Allows anyone to publish a message (an encrypted command and signature).
  /// This function also enqueues the message.
  /// @param _message The message to publish
  /// @param _encPubKey An epheremal public key which can be combined with the
  /// coordinator's private key to generate an ECDH shared key with which
  /// to encrypt the message.
  function publishMessage(DomainObjs.Message calldata _message, DomainObjs.PubKey calldata _encPubKey) external;

  /// @notice The first step of merging the MACI state AccQueue. This allows the
  /// ProcessMessages circuit to access the latest state tree and ballots via
  /// currentSbCommitment.
  /// @param _numSrQueueOps Number of operations
  /// @param _pollId The ID of the active Poll
  function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external;

  /// @notice The second step of merging the MACI state AccQueue. This allows the
  /// ProcessMessages circuit to access the latest state tree and ballots via
  /// currentSbCommitment.
  /// @param _pollId The ID of the active Poll
  function mergeMaciStateAq(uint256 _pollId) external;

  /// @notice The first step in merging the message AccQueue so that the
  /// ProcessMessages circuit can access the message root.
  /// @param _numSrQueueOps The number of subroot queue operations to perform
  function mergeMessageAqSubRoots(uint256 _numSrQueueOps) external;

  /// @notice The second step in merging the message AccQueue so that the
  /// ProcessMessages circuit can access the message root.
  function mergeMessageAq() external;

  /// @notice Returns the Poll's deploy time and duration
  /// @return _deployTime The deployment timestamp
  /// @return _duration The duration of the poll
  function getDeployTimeAndDuration() external view returns (uint256 _deployTime, uint256 _duration);

  /// @notice Get the result of whether the MACI contract's stateAq has been merged by this contract
  /// @return Whether the MACI contract's stateAq has been merged by this contract
  function stateAqMerged() external view returns (bool);

  /// @notice Get the depths of the merkle trees
  /// @return intStateTreeDepth The depth of the state tree
  /// @return messageTreeSubDepth The subdepth of the message tree
  /// @return messageTreeDepth The depth of the message tree
  /// @return voteOptionTreeDepth The subdepth of the vote option tree
  function treeDepths()
    external
    view
    returns (uint8 intStateTreeDepth, uint8 messageTreeSubDepth, uint8 messageTreeDepth, uint8 voteOptionTreeDepth);

  /// @notice Get the max values for the poll
  /// @return maxMessages The maximum number of messages
  /// @return maxVoteOptions The maximum number of vote options
  function maxValues() external view returns (uint256 maxMessages, uint256 maxVoteOptions);

  /// @notice Get the external contracts
  /// @return maci The IMACI contract
  /// @return messageAq The AccQueue contract
  /// @return topupCredit The TopupCredit contract
  function extContracts() external view returns (IMACI maci, AccQueue messageAq, TopupCredit topupCredit);

  /// @notice Get the hash of coordinator's public key
  /// @return _coordinatorPubKeyHash the hash of coordinator's public key
  function coordinatorPubKeyHash() external view returns (uint256 _coordinatorPubKeyHash);

  /// @notice Get the commitment to the state leaves and the ballots. This is
  /// hash3(stateRoot, ballotRoot, salt).
  /// Its initial value should be
  /// hash(maciStateRootSnapshot, emptyBallotRoot, 0)
  /// Each successful invocation of processMessages() should use a different
  /// salt to update this value, so that an external observer cannot tell in
  /// the case that none of the messages are valid.
  /// @return The commitment to the state leaves and the ballots
  function currentSbCommitment() external view returns (uint256);
}
