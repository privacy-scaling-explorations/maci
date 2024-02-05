// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Params } from "./utilities/Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { EmptyBallotRoots } from "./trees/EmptyBallotRoots.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { Utilities } from "./utilities/Utilities.sol";

/// @title Poll
/// @notice A Poll contract allows voters to submit encrypted messages
/// which can be either votes, key change messages or topup messages.
/// @dev Do not deploy this directly. Use PollFactory.deploy() which performs some
/// checks on the Poll constructor arguments.
contract Poll is Params, Utilities, SnarkCommon, Ownable, EmptyBallotRoots, IPoll {
  using SafeERC20 for ERC20;

  /// @notice Whether the Poll has been initialized
  bool internal isInit;

  /// @notice The coordinator's public key
  PubKey public coordinatorPubKey;

  /// @notice Hash of the coordinator's public key
  uint256 public immutable coordinatorPubKeyHash;

  /// @notice the state root of the state merkle tree
  uint256 public mergedStateRoot;

  // The timestamp of the block at which the Poll was deployed
  uint256 internal immutable deployTime;

  // The duration of the polling period, in seconds
  uint256 internal immutable duration;

  /// @notice Whether the MACI contract's stateAq has been merged by this contract
  bool public stateAqMerged;

  /// @notice Get the commitment to the state leaves and the ballots. This is
  /// hash3(stateRoot, ballotRoot, salt).
  /// Its initial value should be
  /// hash(maciStateRootSnapshot, emptyBallotRoot, 0)
  /// Each successful invocation of processMessages() should use a different
  /// salt to update this value, so that an external observer cannot tell in
  /// the case that none of the messages are valid.
  uint256 public currentSbCommitment;

  /// @notice The number of messages that have been published
  uint256 public numMessages;

  /// @notice The number of signups that have been processed
  /// before the Poll ended (stateAq merged)
  uint256 public numSignups;

  /// @notice Max values for the poll
  MaxValues public maxValues;

  /// @notice Depths of the merkle trees
  TreeDepths public treeDepths;

  /// @notice The contracts used by the Poll
  ExtContracts public extContracts;

  error VotingPeriodOver();
  error VotingPeriodNotOver();
  error PollAlreadyInit();
  error TooManyMessages();
  error MaciPubKeyLargerThanSnarkFieldSize();
  error StateAqAlreadyMerged();
  error StateAqSubtreesNeedMerge();

  event PublishMessage(Message _message, PubKey _encPubKey);
  event TopupMessage(Message _message);
  event MergeMaciStateAqSubRoots(uint256 _numSrQueueOps);
  event MergeMaciStateAq(uint256 _stateRoot, uint256 _numSignups);
  event MergeMessageAqSubRoots(uint256 _numSrQueueOps);
  event MergeMessageAq(uint256 _messageRoot);

  /// @notice Each MACI instance can have multiple Polls.
  /// When a Poll is deployed, its voting period starts immediately.
  /// @param _duration The duration of the voting period, in seconds
  /// @param _maxValues The maximum number of messages and vote options
  /// @param _treeDepths The depths of the merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contracts
  constructor(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey,
    ExtContracts memory _extContracts
  ) payable {
    extContracts = _extContracts;
    coordinatorPubKey = _coordinatorPubKey;
    // we hash it ourselves to ensure we record the correct value
    coordinatorPubKeyHash = hashLeftRight(_coordinatorPubKey.x, _coordinatorPubKey.y);
    duration = _duration;
    maxValues = _maxValues;
    treeDepths = _treeDepths;
    // Record the current timestamp
    deployTime = block.timestamp;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// not over.
  modifier isAfterVotingDeadline() {
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed <= duration) revert VotingPeriodNotOver();
    _;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// over
  modifier isWithinVotingDeadline() {
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed >= duration) revert VotingPeriodOver();
    _;
  }

  /// @notice The initialization function.
  /// @dev Should be called immediately after Poll creation
  /// and messageAq ownership transferred
  function init() public {
    if (isInit) revert PollAlreadyInit();
    // set to true so it cannot be called again
    isInit = true;

    unchecked {
      numMessages++;
    }

    // init messageAq here by inserting placeholderLeaf
    uint256[2] memory dat = [NOTHING_UP_MY_SLEEVE, 0];

    (Message memory _message, PubKey memory _padKey, uint256 placeholderLeaf) = padAndHashMessage(dat, 1);
    extContracts.messageAq.enqueue(placeholderLeaf);

    emit PublishMessage(_message, _padKey);
  }

  /// @inheritdoc IPoll
  function topup(uint256 stateIndex, uint256 amount) public isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages == maxValues.maxMessages) revert TooManyMessages();

    // cannot realistically overflow
    unchecked {
      numMessages++;
    }

    /// @notice topupCredit is a trusted token contract which reverts if the transfer fails
    extContracts.topupCredit.transferFrom(msg.sender, address(this), amount);

    uint256[2] memory dat = [stateIndex, amount];
    (Message memory _message, , uint256 messageLeaf) = padAndHashMessage(dat, 2);

    extContracts.messageAq.enqueue(messageLeaf);

    emit TopupMessage(_message);
  }

  /// @inheritdoc IPoll
  function publishMessage(Message calldata _message, PubKey calldata _encPubKey) public isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages == maxValues.maxMessages) revert TooManyMessages();

    // validate that the public key is valid
    if (_encPubKey.x >= SNARK_SCALAR_FIELD || _encPubKey.y >= SNARK_SCALAR_FIELD) {
      revert MaciPubKeyLargerThanSnarkFieldSize();
    }

    // cannot realistically overflow
    unchecked {
      numMessages++;
    }

    uint256 messageLeaf = hashMessageAndEncPubKey(_message, _encPubKey);
    extContracts.messageAq.enqueue(messageLeaf);

    emit PublishMessage(_message, _encPubKey);
  }

  /// @inheritdoc IPoll
  function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public onlyOwner isAfterVotingDeadline {
    // This function cannot be called after the stateAq was merged
    if (stateAqMerged) revert StateAqAlreadyMerged();

    // merge subroots
    extContracts.maci.mergeStateAqSubRoots(_numSrQueueOps, _pollId);

    emit MergeMaciStateAqSubRoots(_numSrQueueOps);
  }

  /// @inheritdoc IPoll
  function mergeMaciStateAq(uint256 _pollId) public onlyOwner isAfterVotingDeadline {
    // This function can only be called once per Poll after the voting
    // deadline
    if (stateAqMerged) revert StateAqAlreadyMerged();

    stateAqMerged = true;

    // the subtrees must have been merged first
    if (!extContracts.maci.stateAq().subTreesMerged()) revert StateAqSubtreesNeedMerge();

    mergedStateRoot = extContracts.maci.mergeStateAq(_pollId);

    // Set currentSbCommitment
    uint256[3] memory sb;
    sb[0] = mergedStateRoot;
    sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
    sb[2] = uint256(0);

    currentSbCommitment = hash3(sb);

    numSignups = extContracts.maci.numSignUps();
    emit MergeMaciStateAq(mergedStateRoot, numSignups);
  }

  /// @inheritdoc IPoll
  function mergeMessageAqSubRoots(uint256 _numSrQueueOps) public onlyOwner isAfterVotingDeadline {
    extContracts.messageAq.mergeSubRoots(_numSrQueueOps);
    emit MergeMessageAqSubRoots(_numSrQueueOps);
  }

  /// @inheritdoc IPoll
  function mergeMessageAq() public onlyOwner isAfterVotingDeadline {
    uint256 root = extContracts.messageAq.merge(treeDepths.messageTreeDepth);
    emit MergeMessageAq(root);
  }

  /// @inheritdoc IPoll
  function getDeployTimeAndDuration() public view returns (uint256 pollDeployTime, uint256 pollDuration) {
    pollDeployTime = deployTime;
    pollDuration = duration;
  }

  /// @inheritdoc IPoll
  function numSignUpsAndMessages() public view returns (uint256 numSUps, uint256 numMsgs) {
    numSUps = numSignups;
    numMsgs = numMessages;
  }
}
