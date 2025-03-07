// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Params } from "./utilities/Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { LazyIMTData, InternalLazyIMT } from "./trees/LazyIMT.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { ISignUpGatekeeper } from "./interfaces/ISignUpGatekeeper.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { CurveBabyJubJub } from "./crypto/BabyJubJub.sol";

/// @title Poll
/// @notice A Poll contract allows voters to submit encrypted messages
/// which can be either votes or key change messages.
/// @dev Do not deploy this directly. Use PollFactory.deploy() which performs some
/// checks on the Poll constructor arguments.
contract Poll is Params, Utilities, SnarkCommon, IPoll {
  /// @notice The coordinator's public key
  PubKey public coordinatorPubKey;

  /// @notice Hash of the coordinator's public key
  uint256 public immutable coordinatorPubKeyHash;

  /// @notice the state root of the state merkle tree
  uint256 public mergedStateRoot;

  /// @notice The start date of the poll
  uint256 public immutable startDate;
  /// @notice The end date of the poll
  uint256 public immutable endDate;

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

  /// @notice The number of valid vote options for the poll
  uint256 public immutable voteOptions;

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

  /// @notice Poll state tree for anonymous joining
  LazyIMTData public pollStateTree;

  /// @notice IPFS hashes of messages batches
  bytes32[] public ipfsHashes;

  /// @notice Relayer address
  mapping(address => bool) public relayers;

  /// @notice The hash of a blank state leaf
  uint256 internal constant BLANK_STATE_LEAF_HASH =
    uint256(6769006970205099520508948723718471724660867171122235270773600567925038008762);

  uint8 internal constant VOTE_TREE_ARITY = 5;

  /// @notice Poll joining nullifiers
  mapping(uint256 => bool) public pollNullifiers;

  /// @notice The Id of this poll
  uint256 public immutable pollId;

  /// @notice The array of the poll state tree roots for each poll join
  /// For the N'th poll join, the poll state tree root will be stored at the index N
  uint256[] public pollStateRootsOnJoin;

  error VotingPeriodOver();
  error VotingPeriodNotOver();
  error VotingPeriodNotStarted();
  error PollAlreadyInit();
  error TooManyMessages();
  error InvalidPubKey();
  error StateAlreadyMerged();
  error InvalidBatchLength();
  error BatchHashesAlreadyPadded();
  error UserAlreadyJoined();
  error InvalidPollProof();
  error NotRelayer();
  error StateLeafNotFound();
  error TooManyVoteOptions();

  event PublishMessage(Message _message, PubKey _encPubKey);
  event MergeState(uint256 indexed _stateRoot, uint256 indexed _numSignups);
  event PollJoined(
    uint256 indexed _pollPubKeyX,
    uint256 indexed _pollPubKeyY,
    uint256 _voiceCreditBalance,
    uint256 _timestamp,
    uint256 _nullifier,
    uint256 _pollStateIndex
  );
  event ChainHashUpdated(uint256 indexed _chainHash);
  event IpfsHashAdded(bytes32 indexed _ipfsHash);

  /// @notice Each MACI instance can have multiple Polls.
  /// When a Poll is deployed, its voting period starts immediately.
  /// @param _startDate The start date of the poll
  /// @param _endDate The end date of the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _messageBatchSize The message batch size
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _extContracts The external contracts
  /// @param _emptyBallotRoot The root of the empty ballot tree
  /// @param _pollId The poll id
  /// @param _voteOptions The number of valid vote options for the poll
  constructor(
    uint256 _startDate,
    uint256 _endDate,
    TreeDepths memory _treeDepths,
    uint8 _messageBatchSize,
    PubKey memory _coordinatorPubKey,
    ExtContracts memory _extContracts,
    uint256 _emptyBallotRoot,
    uint256 _pollId,
    address[] memory _relayers,
    uint256 _voteOptions
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
    startDate = _startDate;
    endDate = _endDate;

    // store max vote options
    if (_voteOptions > uint256(VOTE_TREE_ARITY) ** _treeDepths.voteOptionTreeDepth) {
      revert TooManyVoteOptions();
    }

    voteOptions = _voteOptions;

    // store message batch size
    messageBatchSize = _messageBatchSize;

    // store tree depth
    treeDepths = _treeDepths;

    // store the empty ballot root
    emptyBallotRoot = _emptyBallotRoot;

    // store the poll id
    pollId = _pollId;

    // set relayers
    for (uint256 index = 0; index < _relayers.length; ) {
      relayers[_relayers[index]] = true;

      unchecked {
        index++;
      }
    }

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

    InternalLazyIMT._init(pollStateTree, extContracts.maci.stateTreeDepth());
    InternalLazyIMT._insert(pollStateTree, BLANK_STATE_LEAF_HASH);
    pollStateRootsOnJoin.push(BLANK_STATE_LEAF_HASH);

    emit PublishMessage(_message, _padKey);
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// not over.
  modifier isAfterVotingDeadline() virtual {
    if (block.timestamp < endDate) revert VotingPeriodNotOver();
    _;
  }

  /// @notice A modifier that causes the function to revert if the batch hashes is padded
  modifier isNotPadded() {
    if (isBatchHashesPadded) revert BatchHashesAlreadyPadded();
    _;
  }

  /// @notice A modifier that causes the function to revert if the caller is not a relayer
  modifier onlyRelayer() {
    if (!relayers[msg.sender]) revert NotRelayer();
    _;
  }

  /// @notice A modifier that causes the function to revert if the voting period is
  /// over
  /// @dev This is used to prevent users from publishing messages after the voting period has ended or
  /// before the voting period has started
  modifier isOpenForVoting() virtual {
    if (block.timestamp > endDate) revert VotingPeriodOver();
    if (block.timestamp < startDate) revert VotingPeriodNotStarted();
    _;
  }

  /// @notice A modifier that causes the function to revert if the voting period is over
  /// @dev This is used to prevent users from joining the poll after the voting period has ended
  /// @dev This allows to join before the poll is open for voting
  modifier isWithinVotingDeadline() virtual {
    if (block.timestamp > endDate) revert VotingPeriodOver();
    _;
  }

  // get all batch hash array elements
  function getBatchHashes() external view returns (uint256[] memory) {
    return batchHashes;
  }

  /// @inheritdoc IPoll
  function publishMessage(Message calldata _message, PubKey calldata _encPubKey) public virtual isOpenForVoting {
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

  /// @inheritdoc IPoll
  function relayMessagesBatch(
    uint256[] calldata _messageHashes,
    bytes32 _ipfsHash
  ) public virtual isOpenForVoting onlyRelayer {
    uint256 length = _messageHashes.length;

    unchecked {
      numMessages += length;
    }

    for (uint256 index = 0; index < length; ) {
      updateChainHash(_messageHashes[index]);

      unchecked {
        index++;
      }
    }

    ipfsHashes.push(_ipfsHash);

    emit IpfsHashAdded(_ipfsHash);
  }

  /// @notice compute and update current message chain hash
  /// @param messageHash hash of the current message
  function updateChainHash(uint256 messageHash) internal {
    uint256 newChainHash = hash2([chainHash, messageHash]);

    if (numMessages % messageBatchSize == 0) {
      batchHashes.push(newChainHash);
    }

    chainHash = newChainHash;

    emit ChainHashUpdated(newChainHash);
  }

  /// @notice pad last unclosed batch
  function padLastBatch() external isAfterVotingDeadline isNotPadded {
    if (numMessages % messageBatchSize != 0) {
      batchHashes.push(chainHash);
    }
    isBatchHashesPadded = true;
  }

  /// @inheritdoc IPoll
  function publishMessageBatch(Message[] calldata _messages, PubKey[] calldata _encPubKeys) public virtual {
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
  function joinPoll(
    uint256 _nullifier,
    PubKey calldata _pubKey,
    uint256 _stateRootIndex,
    uint256[8] calldata _proof,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
  ) external virtual isWithinVotingDeadline {
    // Whether the user has already joined
    if (pollNullifiers[_nullifier]) {
      revert UserAlreadyJoined();
    }

    // Set nullifier for user's private key
    pollNullifiers[_nullifier] = true;

    // Verify user's proof
    if (!verifyJoiningPollProof(_nullifier, _stateRootIndex, _pubKey, _proof)) {
      revert InvalidPollProof();
    }

    // Check if the user is eligible to join the poll
    extContracts.gatekeeper.enforce(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = extContracts.initialVoiceCreditProxy.getVoiceCredits(
      msg.sender,
      _initialVoiceCreditProxyData
    );

    // Store user in the pollStateTree
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, block.timestamp));

    uint256 stateRoot = InternalLazyIMT._insert(pollStateTree, stateLeaf);

    // Store the current state tree root in the array
    pollStateRootsOnJoin.push(stateRoot);

    uint256 pollStateIndex = pollStateTree.numberOfLeaves - 1;
    emit PollJoined(_pubKey.x, _pubKey.y, voiceCreditBalance, block.timestamp, _nullifier, pollStateIndex);
  }

  /// @notice Verify the proof for Poll joining
  /// @param _nullifier Hashed user's private key to check whether user has already voted
  /// @param _index Index of the MACI's stateRootOnSignUp when the user signed up
  /// @param _pubKey Poll user's public key
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyJoiningPollProof(
    uint256 _nullifier,
    uint256 _index,
    PubKey calldata _pubKey,
    uint256[8] memory _proof
  ) public view returns (bool isValid) {
    // Get the verifying key from the VkRegistry
    VerifyingKey memory vk = extContracts.vkRegistry.getPollJoiningVk(extContracts.maci.stateTreeDepth());

    // Generate the circuit public input
    uint256[] memory circuitPublicInputs = getPublicJoiningCircuitInputs(_nullifier, _index, _pubKey);

    isValid = extContracts.verifier.verify(_proof, vk, circuitPublicInputs);
  }

  /// @notice Verify the proof for joined Poll
  /// @param _index Index of the MACI's stateRootOnSignUp when the user signed up
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyJoinedPollProof(uint256 _index, uint256[8] memory _proof) public view returns (bool isValid) {
    // Get the verifying key from the VkRegistry
    VerifyingKey memory vk = extContracts.vkRegistry.getPollJoinedVk(extContracts.maci.stateTreeDepth());

    // Generate the circuit public input
    uint256[] memory circuitPublicInputs = getPublicJoinedCircuitInputs(_index);

    isValid = extContracts.verifier.verify(_proof, vk, circuitPublicInputs);
  }

  /// @notice Get public circuit inputs for poll joining circuit
  /// @param _nullifier Hashed user's private key to check whether user has already voted
  /// @param _index Index of the MACI's stateRootOnSignUp when the user signed up
  /// @param _pubKey Poll user's public key
  /// @return publicInputs Public circuit inputs
  function getPublicJoiningCircuitInputs(
    uint256 _nullifier,
    uint256 _index,
    PubKey calldata _pubKey
  ) public view returns (uint256[] memory publicInputs) {
    publicInputs = new uint256[](5);

    publicInputs[0] = _pubKey.x;
    publicInputs[1] = _pubKey.y;
    publicInputs[2] = _nullifier;
    publicInputs[3] = extContracts.maci.getStateRootOnIndexedSignUp(_index);
    publicInputs[4] = pollId;
  }

  /// @notice Get public circuit inputs for poll joined circuit
  /// @param _index Index of the MACI's stateRootOnSignUp when the user signed up
  /// @return publicInputs Public circuit inputs
  function getPublicJoinedCircuitInputs(uint256 _index) public view returns (uint256[] memory publicInputs) {
    publicInputs = new uint256[](1);

    publicInputs[0] = pollStateRootsOnJoin[_index];
  }

  /// @inheritdoc IPoll
  function mergeState() public isAfterVotingDeadline {
    // This function can only be called once per Poll after the voting
    // deadline
    if (stateMerged) revert StateAlreadyMerged();

    // set merged to true so it cannot be called again
    stateMerged = true;

    uint256 _mergedStateRoot = InternalLazyIMT._root(pollStateTree);
    mergedStateRoot = _mergedStateRoot;

    // Set currentSbCommitment
    uint256[3] memory sb;
    sb[0] = _mergedStateRoot;
    sb[1] = emptyBallotRoot;
    sb[2] = uint256(0);

    currentSbCommitment = hash3(sb);

    // get number of joined users and cache in a var for later use
    uint256 _numSignups = pollStateTree.numberOfLeaves;
    numSignups = _numSignups;

    // dynamically determine the actual depth of the state tree
    uint8 depth = 1;
    while (uint40(1 << depth) < _numSignups) {
      depth++;
    }

    actualStateTreeDepth = depth;

    emit MergeState(mergedStateRoot, numSignups);
  }

  /// @inheritdoc IPoll
  function getStartAndEndDate() public view virtual returns (uint256 pollStartDate, uint256 pollEndDate) {
    pollStartDate = startDate;
    pollEndDate = endDate;
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

  /// @inheritdoc IPoll
  function getStateIndex(uint256 element) public view returns (uint40) {
    for (uint40 i = 0; i <= pollStateTree.maxIndex; i++) {
      if (pollStateTree.elements[i] == element) {
        return i;
      }
    }

    revert StateLeafNotFound();
  }
}
