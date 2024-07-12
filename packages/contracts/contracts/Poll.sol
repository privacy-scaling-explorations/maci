// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Params } from "./utilities/Params.sol";
import { EmptyBallotRoots } from "./trees/EmptyBallotRoots.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { CurveBabyJubJub } from "./crypto/BabyJubJub.sol";

/// @title Poll
/// @notice A Poll contract allows voters to submit encrypted messages
/// which can be either votes or key change messages.
/// @dev Do not deploy this directly. Use PollFactory.deploy() which performs some
/// checks on the Poll constructor arguments.
contract Poll is Params, Utilities, SnarkCommon, EmptyBallotRoots, IPoll {
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

  /// @notice Max vote options for the poll
  uint256 public immutable maxVoteOptions;

  /// @notice Depths of the merkle trees
  TreeDepths public treeDepths;

  /// @notice Message batch size for the poll
  uint8 public immutable messageBatchSize;

  /// @notice The contracts used by the Poll
  ExtContracts public extContracts;

  /// @notice The array for chain hash checkpoints
  uint256[] public batchHashes;

  /// @notice Current chain hash
  uint256 public chainHash;

  ///  @notice flag for batch padding
  bool public isBatchHashesPadded;

  error VotingPeriodOver();
  error VotingPeriodNotOver();
  error PollAlreadyInit();
  error TooManyMessages();
  error InvalidPubKey();
  error StateAlreadyMerged();
  error InvalidBatchLength();
  error BatchHashesAlreadyPadded();

  event PublishMessage(Message _message, PubKey _encPubKey);
  event MergeMaciState(uint256 indexed _stateRoot, uint256 indexed _numSignups);

  /// @notice Each MACI instance can have multiple Polls.
  /// When a Poll is deployed, its voting period starts immediately.
  /// @param _duration The duration of the voting period, in seconds
  /// @param _maxVoteOptions The maximum number of vote options
  /// @param _treeDepths The depths of the merkle trees
  /// @param _messageBatchSize The message batch size
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contracts

  constructor(
    uint256 _duration,
    uint256 _maxVoteOptions,
    TreeDepths memory _treeDepths,
    uint8 _messageBatchSize,
    PubKey memory _coordinatorPubKey,
    ExtContracts memory _extContracts
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
    // store max vote options
    maxVoteOptions = _maxVoteOptions;
    // store message batch size
    messageBatchSize = _messageBatchSize;
    // store tree depth
    treeDepths = _treeDepths;
    // Record the current timestamp
    deployTime = block.timestamp;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// not over.
  modifier isAfterVotingDeadline() virtual {
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed <= duration) revert VotingPeriodNotOver();
    _;
  }

  modifier isNotPadded() {
    if (isBatchHashesPadded) revert BatchHashesAlreadyPadded();
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
  function init() public virtual {
    if (isInit) revert PollAlreadyInit();
    // set to true so it cannot be called again
    isInit = true;

    unchecked {
      numMessages++;
    }

    // init chainHash here by inserting placeholderLeaf
    uint256[2] memory dat;
    dat[0] = NOTHING_UP_MY_SLEEVE;
    dat[1] = 0;

    (Message memory _message, PubKey memory _padKey, uint256 placeholderLeaf) = padAndHashMessage(dat);
    chainHash = NOTHING_UP_MY_SLEEVE;
    batchHashes.push(NOTHING_UP_MY_SLEEVE);
    updateChainHash(placeholderLeaf);

    emit PublishMessage(_message, _padKey);
  }

  // get all batch hash array elements
  function getBatchHashes() external view returns (uint256[] memory) {
    return batchHashes;
  }

  /// @inheritdoc IPoll
  function publishMessage(Message memory _message, PubKey calldata _encPubKey) public virtual isWithinVotingDeadline {
    // check if the public key is on the curve
    if (!CurveBabyJubJub.isOnCurve(_encPubKey.x, _encPubKey.y)) {
      revert InvalidPubKey();
    }

    // cannot realistically overflow
    unchecked {
      numMessages++;
    }

    // compute current message hash
    uint256 messageHash = hashMessageAndEncPubKey(_message, _encPubKey);

    // update current message chain hash
    updateChainHash(messageHash);

    emit PublishMessage(_message, _encPubKey);
  }

  /// @notice compute and update current message chain hash
  /// @param messageHash hash of the current message
  function updateChainHash(uint256 messageHash) internal {
    uint256 newChainHash = hash2([chainHash, messageHash]);
    if (numMessages % messageBatchSize == 0) {
      batchHashes.push(newChainHash);
    }
    chainHash = newChainHash;
  }

  /// @notice pad last unclosed batch
  function padLastBatch() external isAfterVotingDeadline isNotPadded {
    if (numMessages % messageBatchSize != 0) {
      batchHashes.push(chainHash);
    }
    isBatchHashesPadded = true;
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
    sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
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
  function getDeployTimeAndDuration() public view virtual returns (uint256 pollDeployTime, uint256 pollDuration) {
    pollDeployTime = deployTime;
    pollDuration = duration;
  }

  /// @inheritdoc IPoll
  function numSignUpsAndMessages() public view returns (uint256 numSUps, uint256 numMsgs) {
    numSUps = numSignups;
    numMsgs = numMessages;
  }

  /// @inheritdoc IPoll
  function getMaciContract() public view returns (IMACI maci) {
    return extContracts.maci;
  }
}
