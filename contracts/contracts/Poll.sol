// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Params } from "./utilities/Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { AccQueue, AccQueueQuinaryMaci } from "./trees/AccQueue.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Verifier } from "./crypto/Verifier.sol";
import { EmptyBallotRoots } from "./trees/EmptyBallotRoots.sol";
import { TopupCredit } from "./TopupCredit.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { MessageProcessor } from "./MessageProcessor.sol";

/// @title Poll
/// @notice A Poll contract allows voters to submit encrypted messages
/// which can be either votes, key change messages or topup messages.
/// @dev Do not deploy this directly. Use PollFactory.deploy() which performs some
/// checks on the Poll constructor arguments.
contract Poll is Params, Utilities, SnarkCommon, Ownable, EmptyBallotRoots {
  using SafeERC20 for ERC20;

  bool internal isInit;
  // The coordinator's public key
  PubKey public coordinatorPubKey;

  uint256 public mergedStateRoot;
  uint256 public coordinatorPubKeyHash;

  // The timestamp of the block at which the Poll was deployed
  uint256 internal deployTime;

  // The duration of the polling period, in seconds
  uint256 internal duration;

  // Whether the MACI contract's stateAq has been merged by this contract
  bool public stateAqMerged;

  // The commitment to the state leaves and the ballots. This is
  // hash3(stateRoot, ballotRoot, salt).
  // Its initial value should be
  // hash(maciStateRootSnapshot, emptyBallotRoot, 0)
  // Each successful invocation of processMessages() should use a different
  // salt to update this value, so that an external observer cannot tell in
  // the case that none of the messages are valid.
  uint256 public currentSbCommitment;

  uint256 public numMessages;

  MaxValues public maxValues;
  TreeDepths public treeDepths;
  BatchSizes public batchSizes;

  /// @notice custom errors
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
  event MergeMaciStateAq(uint256 _stateRoot);
  event MergeMessageAqSubRoots(uint256 _numSrQueueOps);
  event MergeMessageAq(uint256 _messageRoot);

  ExtContracts public extContracts;

  /// @notice Each MACI instance can have multiple Polls.
  /// When a Poll is deployed, its voting period starts immediately.
  /// @param _duration The duration of the voting period, in seconds
  /// @param _maxValues The maximum number of signups and messages
  /// @param _treeDepths The depths of the merkle trees
  /// @param _batchSizes The batch sizes for processing
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contracts
  constructor(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    BatchSizes memory _batchSizes,
    PubKey memory _coordinatorPubKey,
    ExtContracts memory _extContracts
  ) payable {
    extContracts = _extContracts;

    coordinatorPubKey = _coordinatorPubKey;
    coordinatorPubKeyHash = hashLeftRight(_coordinatorPubKey.x, _coordinatorPubKey.y);
    duration = _duration;
    maxValues = _maxValues;
    batchSizes = _batchSizes;
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
    uint256[2] memory dat;
    dat[0] = NOTHING_UP_MY_SLEEVE;
    dat[1] = 0;
    (Message memory _message, PubKey memory _padKey, uint256 placeholderLeaf) = padAndHashMessage(dat, 1);
    extContracts.messageAq.enqueue(placeholderLeaf);

    emit PublishMessage(_message, _padKey);
  }

  /// @notice Allows to publish a Topup message
  /// @param stateIndex The index of user in the state queue
  /// @param amount The amount of credits to topup
  function topup(uint256 stateIndex, uint256 amount) public isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages == maxValues.maxMessages) revert TooManyMessages();

    unchecked {
      numMessages++;
    }

    extContracts.topupCredit.transferFrom(msg.sender, address(this), amount);
    uint256[2] memory dat;
    dat[0] = stateIndex;
    dat[1] = amount;
    (Message memory _message, , uint256 messageLeaf) = padAndHashMessage(dat, 2);
    extContracts.messageAq.enqueue(messageLeaf);

    emit TopupMessage(_message);
  }

  /// @notice Allows anyone to publish a message (an encrypted command and signature).
  /// This function also enqueues the message.
  /// @param _message The message to publish
  /// @param _encPubKey An epheremal public key which can be combined with the
  /// coordinator's private key to generate an ECDH shared key with which
  /// to encrypt the message.
  function publishMessage(Message memory _message, PubKey calldata _encPubKey) public isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages == maxValues.maxMessages) revert TooManyMessages();

    // validate that the public key is valid
    if (_encPubKey.x >= SNARK_SCALAR_FIELD || _encPubKey.y >= SNARK_SCALAR_FIELD) {
      revert MaciPubKeyLargerThanSnarkFieldSize();
    }

    unchecked {
      numMessages++;
    }

    // force the message to have type 1
    _message.msgType = 1;
    uint256 messageLeaf = hashMessageAndEncPubKey(_message, _encPubKey);
    extContracts.messageAq.enqueue(messageLeaf);

    emit PublishMessage(_message, _encPubKey);
  }

  /// @notice The first step of merging the MACI state AccQueue. This allows the
  /// ProcessMessages circuit to access the latest state tree and ballots via
  /// currentSbCommitment.
  function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public onlyOwner isAfterVotingDeadline {
    // This function cannot be called after the stateAq was merged
    if (stateAqMerged) revert StateAqAlreadyMerged();

    if (!extContracts.maci.stateAq().subTreesMerged()) {
      extContracts.maci.mergeStateAqSubRoots(_numSrQueueOps, _pollId);
    }

    emit MergeMaciStateAqSubRoots(_numSrQueueOps);
  }

  /// @notice The second step of merging the MACI state AccQueue. This allows the
  /// ProcessMessages circuit to access the latest state tree and ballots via
  /// currentSbCommitment.
  /// @param _pollId The ID of the Poll
  function mergeMaciStateAq(uint256 _pollId) public onlyOwner isAfterVotingDeadline {
    // This function can only be called once per Poll after the voting
    // deadline
    if (stateAqMerged) revert StateAqAlreadyMerged();

    stateAqMerged = true;

    if (!extContracts.maci.stateAq().subTreesMerged()) revert StateAqSubtreesNeedMerge();

    mergedStateRoot = extContracts.maci.mergeStateAq(_pollId);

    // Set currentSbCommitment
    uint256[3] memory sb;
    sb[0] = mergedStateRoot;
    sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
    sb[2] = uint256(0);

    currentSbCommitment = hash3(sb);
    emit MergeMaciStateAq(mergedStateRoot);
  }

  /// @notice The first step in merging the message AccQueue so that the
  /// ProcessMessages circuit can access the message root.
  /// @param _numSrQueueOps The number of subroot queue operations to perform
  function mergeMessageAqSubRoots(uint256 _numSrQueueOps) public onlyOwner isAfterVotingDeadline {
    extContracts.messageAq.mergeSubRoots(_numSrQueueOps);
    emit MergeMessageAqSubRoots(_numSrQueueOps);
  }

  /// @notice The second step in merging the message AccQueue so that the
  /// ProcessMessages circuit can access the message root.
  function mergeMessageAq() public onlyOwner isAfterVotingDeadline {
    uint256 root = extContracts.messageAq.merge(treeDepths.messageTreeDepth);
    emit MergeMessageAq(root);
  }

  /// @notice Returns the Poll's deploy time and duration
  /// @return _deployTime The deployment timestamp
  /// @return _duration The duration of the poll
  function getDeployTimeAndDuration() public view returns (uint256 _deployTime, uint256 _duration) {
    _deployTime = deployTime;
    _duration = duration;
  }

  /// @notice The number of messages which have been processed and the number of
  /// signups
  /// @return numSignups The number of signups
  /// @return numMsgs The number of messages sent by voters
  function numSignUpsAndMessages() public view returns (uint256 numSignups, uint256 numMsgs) {
    numSignups = extContracts.maci.numSignUps();
    numMsgs = numMessages;
  }
}
