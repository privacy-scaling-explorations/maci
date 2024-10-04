// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Params } from "./utilities/Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { CurveBabyJubJub } from "./crypto/BabyJubJub.sol";

/// @title Poll
/// @notice A Poll contract allows voters to submit encrypted messages
/// which can be either votes or key change messages.
/// @dev Do not deploy this directly. Use PollFactory.deploy() which performs some
/// checks on the Poll constructor arguments.
contract Poll is Params, Utilities, SnarkCommon, IPoll {
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

  /// @notice The root of the empty ballot tree at a given voteOptionTree depth
  uint256 public immutable emptyBallotRoot;

  /// @notice Whether the MACI contract's stateAq has been merged by this contract
  bool public stateMerged;

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

  /// @notice The actual depth of the state tree
  /// to be used as public input for the circuit
  uint8 public actualStateTreeDepth;

  /// @notice Depths of the merkle trees
  TreeDepths public treeDepths;

  /// @notice The contracts used by the Poll
  ExtContracts public extContracts;

  /// @notice The max number of messages
  uint256 public immutable maxMessages;

  /// @notice The number of children per node in the merkle trees
  uint256 internal constant TREE_ARITY = 5;

  error VotingPeriodOver();
  error VotingPeriodNotOver();
  error PollAlreadyInit();
  error TooManyMessages();
  error InvalidPubKey();
  error StateAlreadyMerged();
  error InvalidBatchLength();

  event PublishMessage(Message _message, PubKey _encPubKey);
  event MergeMaciState(uint256 indexed _stateRoot, uint256 indexed _numSignups);
  event MergeMessageAqSubRoots(uint256 indexed _numSrQueueOps);
  event MergeMessageAq(uint256 indexed _messageRoot);

  /// @notice Each MACI instance can have multiple Polls.
  /// When a Poll is deployed, its voting period starts immediately.
  /// @param _duration The duration of the voting period, in seconds
  /// @param _treeDepths The depths of the merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contracts
  constructor(
    uint256 _duration,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey,
    ExtContracts memory _extContracts,
    uint256 _emptyBallotRoot
  ) payable {
    // check that the coordinator public key is valid
    if (!CurveBabyJubJub.isOnCurve(_coordinatorPubKey.x, _coordinatorPubKey.y)) {
      revert InvalidPubKey();
    }

    // store the pub key as object then calculate the hash
    coordinatorPubKey = _coordinatorPubKey;
    // we hash it ourselves to ensure we store the correct value
    coordinatorPubKeyHash = hashLeftRight(_coordinatorPubKey.x, _coordinatorPubKey.y);
    // store the external contracts to interact with
    extContracts = _extContracts;
    // store duration of the poll
    duration = _duration;
    // store tree depth
    treeDepths = _treeDepths;
    // Record the current timestamp
    deployTime = block.timestamp;
    // store the empty ballot root
    emptyBallotRoot = _emptyBallotRoot;
    // store max messages
    maxMessages = TREE_ARITY ** _treeDepths.messageTreeDepth;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// not over.
  modifier isAfterVotingDeadline() virtual {
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed <= duration) revert VotingPeriodNotOver();
    _;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// over
  modifier isWithinVotingDeadline() virtual {
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed >= duration) revert VotingPeriodOver();
    _;
  }

  /// @notice The initialization function.
  /// @dev Should be called immediately after Poll creation
  /// and messageAq ownership transferred
  function init() public virtual {
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

    (Message memory _message, PubKey memory _padKey, uint256 placeholderLeaf) = padAndHashMessage(dat);
    extContracts.messageAq.enqueue(placeholderLeaf);

    emit PublishMessage(_message, _padKey);
  }

  /// @inheritdoc IPoll
  function publishMessage(Message memory _message, PubKey calldata _encPubKey) public virtual isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages >= maxMessages) revert TooManyMessages();

    // check if the public key is on the curve
    if (!CurveBabyJubJub.isOnCurve(_encPubKey.x, _encPubKey.y)) {
      revert InvalidPubKey();
    }

    // cannot realistically overflow
    unchecked {
      numMessages++;
    }

    uint256 messageLeaf = hashMessageAndEncPubKey(_message, _encPubKey);
    extContracts.messageAq.enqueue(messageLeaf);

    emit PublishMessage(_message, _encPubKey);
  }

  /// @notice submit a message batch
  /// @dev Can only be submitted before the voting deadline
  /// @param _messages the messages
  /// @param _encPubKeys the encrypted public keys
  function publishMessageBatch(
    Message[] calldata _messages,
    PubKey[] calldata _encPubKeys
  ) public virtual isWithinVotingDeadline {
    if (_messages.length != _encPubKeys.length) {
      revert InvalidBatchLength();
    }

    uint256 len = _messages.length;
    for (uint256 i = 0; i < len; ) {
      // an event will be published by this function already
      publishMessage(_messages[i], _encPubKeys[i]);

      unchecked {
        i++;
      }
    }
  }

  /// @inheritdoc IPoll
  function mergeMaciState() public isAfterVotingDeadline {
    // This function can only be called once per Poll after the voting
    // deadline
    if (stateMerged) revert StateAlreadyMerged();

    // set merged to true so it cannot be called again
    stateMerged = true;

    uint256 _mergedStateRoot = extContracts.maci.getStateTreeRoot();
    mergedStateRoot = _mergedStateRoot;

    // Set currentSbCommitment
    uint256[3] memory sb;
    sb[0] = _mergedStateRoot;
    sb[1] = emptyBallotRoot;
    sb[2] = uint256(0);

    currentSbCommitment = hash3(sb);

    // get number of signups and cache in a var for later use
    uint256 _numSignups = extContracts.maci.numSignUps();
    numSignups = _numSignups;

    // dynamically determine the actual depth of the state tree
    uint8 depth = 1;
    while (uint40(1 << depth) < _numSignups) {
      depth++;
    }

    actualStateTreeDepth = depth;

    emit MergeMaciState(_mergedStateRoot, _numSignups);
  }

  /// @inheritdoc IPoll
  function mergeMessageAqSubRoots(uint256 _numSrQueueOps) public isAfterVotingDeadline {
    extContracts.messageAq.mergeSubRoots(_numSrQueueOps);
    emit MergeMessageAqSubRoots(_numSrQueueOps);
  }

  /// @inheritdoc IPoll
  function mergeMessageAq() public isAfterVotingDeadline {
    uint256 root = extContracts.messageAq.merge(treeDepths.messageTreeDepth);
    emit MergeMessageAq(root);
  }

  /// @inheritdoc IPoll
  function getDeployTimeAndDuration() public view virtual returns (uint256 pollDeployTime, uint256 pollDuration) {
    pollDeployTime = deployTime;
    pollDuration = duration;
  }

  /// @inheritdoc IPoll
  function numSignUpsAndMessages() public view returns (uint256 numSUps, uint256 numMsgs) {
    numSUps = numSignups;
    numMsgs = numMessages;
  }
}
