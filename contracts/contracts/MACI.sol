// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Poll, PollFactory } from "./Poll.sol";
import { InitialVoiceCreditProxy } from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { AccQueue, AccQueueQuinaryBlankSl } from "./trees/AccQueue.sol";
import { IMACI } from "./IMACI.sol";
import { Params } from "./Params.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { TopupCredit } from "./TopupCredit.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
contract MACI is IMACI, DomainObjs, Params, SnarkCommon, Ownable {
  /// @notice The state tree depth is fixed. As such it should be as large as feasible
  /// so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
  /// this should also match the parameter of the circom circuits.
  uint8 public immutable stateTreeDepth;

  /// @notice IMPORTANT: remember to change the ballot tree depth
  /// in contracts/ts/genEmptyBallotRootsContract.ts file
  /// if we change the state tree depth!
  uint8 internal constant STATE_TREE_SUBDEPTH = 2;
  uint8 internal constant STATE_TREE_ARITY = 5;
  uint8 internal constant MESSAGE_TREE_ARITY = 5;

  /// @notice The hash of a blank state leaf
  uint256 internal constant BLANK_STATE_LEAF_HASH =
    uint256(6769006970205099520508948723718471724660867171122235270773600567925038008762);

  /// @notice Each poll has an incrementing ID
  uint256 public nextPollId;

  /// @notice A mapping of poll IDs to Poll contracts.
  mapping(uint256 => Poll) public polls;

  /// @notice The number of signups
  uint256 public override numSignUps;

  /// @notice A mapping of block timestamps to the number of state leaves
  mapping(uint256 => uint256) public numStateLeaves;

  // The block timestamp at which the state queue subroots were last merged
  //uint256 public mergeSubRootsTimestamp;

  /// @notice The verifying key registry. There may be multiple verifying keys stored
  /// on chain, and Poll contracts must select the correct VK based on the
  /// circuit's compile-time parameters, such as tree depths and batch sizes.
  VkRegistry public override vkRegistry;

  // ERC20 contract that hold topup credits
  TopupCredit public topupCredit;

  PollFactory public pollFactory;

  /// @notice The state AccQueue. Represents a mapping between each user's public key
  /// @notice and their voice credit balance.
  AccQueue public override stateAq;

  /// @notice Whether the init() function has been successfully executed yet.
  bool public isInitialised;

  /// @notice Address of the SignUpGatekeeper, a contract which determines whether a
  /// user may sign up to vote
  SignUpGatekeeper public signUpGatekeeper;

  /// @notice  The contract which provides the values of the initial voice credit
  /// balance per user
  InitialVoiceCreditProxy public initialVoiceCreditProxy;

  /// @notice  When the contract was deployed. We assume that the signup period starts
  /// immediately upon deployment.
  uint256 public signUpTimestamp;

  // Events
  event Init(VkRegistry _vkRegistry, TopupCredit _topupCredit);
  event SignUp(uint256 _stateIndex, PubKey _userPubKey, uint256 _voiceCreditBalance, uint256 _timestamp);

  event DeployPoll(uint256 _pollId, address _pollAddr, PubKey _pubKey);

  // TODO: consider removing MergeStateAqSubRoots and MergeStateAq as the
  // functions in Poll which call them already have their own events
  event MergeStateAqSubRoots(uint256 _pollId, uint256 _numSrQueueOps);
  event MergeStateAq(uint256 _pollId);

  /// @notice Ensure certain functions only run after the contract has been initialized
  modifier afterInit() {
    if (!isInitialised) revert MaciNotInit();
    _;
  }

  /// @notice Only allow a Poll contract to call the modified function.
  modifier onlyPoll(uint256 _pollId) {
    if (msg.sender != address(polls[_pollId])) revert CallerMustBePoll(msg.sender);
    _;
  }

  error MaciNotInit();
  error CallerMustBePoll(address _caller);
  error AlreadyInitialized();
  error PoseidonHashLibrariesNotLinked();
  error WrongPollOwner();
  error WrongVkRegistryOwner();
  error TooManySignups();
  error MaciPubKeyLargerThanSnarkFieldSize();
  error PreviousPollNotCompleted(uint256 pollId);
  error PollDoesNotExist(uint256 pollId);

  constructor(
    PollFactory _pollFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    uint8 _stateTreeDepth
  ) {
    // Deploy the state AccQueue
    stateAq = new AccQueueQuinaryBlankSl(STATE_TREE_SUBDEPTH);
    stateAq.enqueue(BLANK_STATE_LEAF_HASH);

    pollFactory = _pollFactory;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;

    signUpTimestamp = block.timestamp;

    // Verify linked poseidon libraries
    if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
  }

  /// @notice Initialise the various factory/helper contracts. This should only be run
  /// once and it must be run before deploying the first Poll.
  /// @param _vkRegistry The VkRegistry contract
  /// @param _topupCredit The topupCredit contract
  function init(VkRegistry _vkRegistry, TopupCredit _topupCredit) public onlyOwner {
    if (isInitialised) revert AlreadyInitialized();

    isInitialised = true;

    vkRegistry = _vkRegistry;
    topupCredit = _topupCredit;

    // Check that the factory contracts have correct access controls before
    // allowing any functions in MACI to run (via the afterInit modifier)
    if (pollFactory.owner() != address(this)) revert WrongPollOwner();
    if (vkRegistry.owner() != owner()) revert WrongVkRegistryOwner();

    emit Init(_vkRegistry, _topupCredit);
  }

  /// @notice Allows any eligible user sign up. The sign-up gatekeeper should prevent
  /// double sign-ups or ineligible users from doing so.  This function will
  /// only succeed if the sign-up deadline has not passed. It also enqueues a
  /// fresh state leaf into the state AccQueue.
  /// @param _pubKey The user's desired public key.
  /// @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
  ///     register() function. For instance, the POAPGatekeeper or
  ///     SignUpTokenGatekeeper requires this value to be the ABI-encoded
  ///     token ID.
  /// @param _initialVoiceCreditProxyData Data to pass to the
  ///     InitialVoiceCreditProxy, which allows it to determine how many voice
  ///     credits this user should have.
  function signUp(
    PubKey memory _pubKey,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
  ) public afterInit {
    // ensure we do not have more signups than what the circuits support
    if (numSignUps == uint256(STATE_TREE_ARITY) ** uint256(stateTreeDepth)) revert TooManySignups();

    if (_pubKey.x >= SNARK_SCALAR_FIELD || _pubKey.y >= SNARK_SCALAR_FIELD) {
      revert MaciPubKeyLargerThanSnarkFieldSize();
    }

    // Increment the number of signups
    // cannot overflow as numSignUps < 5 ** 10 -1
    unchecked {
      numSignUps++;
    }

    // Register the user via the sign-up gatekeeper. This function should
    // throw if the user has already registered or if ineligible to do so.
    signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(msg.sender, _initialVoiceCreditProxyData);

    uint256 timestamp = block.timestamp;
    // Create a state leaf and enqueue it.
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, timestamp));
    uint256 stateIndex = stateAq.enqueue(stateLeaf);

    emit SignUp(stateIndex, _pubKey, voiceCreditBalance, timestamp);
  }

  /// @notice Deploy a new Poll contract.
  /// @param _duration How long should the Poll last for
  /// @param _treeDepths The depth of the Merkle trees
  /// @return a new Poll contract address
  function deployPoll(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey
  ) public afterInit onlyOwner returns (address) {
    uint256 pollId = nextPollId;

    // Increment the poll ID for the next poll
    // 2 ** 256 polls available
    unchecked {
      nextPollId++;
    }

    if (pollId > 0) {
      if (!stateAq.treeMerged()) revert PreviousPollNotCompleted(pollId);
    }

    // The message batch size and the tally batch size
    BatchSizes memory batchSizes = BatchSizes(
      uint24(MESSAGE_TREE_ARITY) ** _treeDepths.messageTreeSubDepth,
      uint24(STATE_TREE_ARITY) ** _treeDepths.intStateTreeDepth,
      uint24(STATE_TREE_ARITY) ** _treeDepths.intStateTreeDepth
    );

    Poll p = pollFactory.deploy(
      _duration,
      _maxValues,
      _treeDepths,
      batchSizes,
      _coordinatorPubKey,
      vkRegistry,
      this,
      topupCredit,
      owner()
    );

    polls[pollId] = p;

    emit DeployPoll(pollId, address(p), _coordinatorPubKey);

    return address(p);
  }

  /// @notice Allow Poll contracts to merge the state subroots
  /// @param _numSrQueueOps Number of operations
  /// @param _pollId The active Poll ID
  function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public override onlyPoll(_pollId) afterInit {
    stateAq.mergeSubRoots(_numSrQueueOps);

    emit MergeStateAqSubRoots(_pollId, _numSrQueueOps);
  }

  /// @notice Allow Poll contracts to merge the state root
  /// @param _pollId The active Poll ID
  /// @return uint256 The calculated Merkle root
  function mergeStateAq(uint256 _pollId) public override onlyPoll(_pollId) afterInit returns (uint256) {
    uint256 root = stateAq.merge(stateTreeDepth);

    emit MergeStateAq(_pollId);

    return root;
  }

  /// @notice Return the main root of the StateAq contract
  /// @return uint256 The Merkle root
  function getStateAqRoot() public view override returns (uint256) {
    return stateAq.getMainRoot(stateTreeDepth);
  }

  /// @notice Get the Poll details
  /// @param _pollId The identifier of the Poll to retrieve
  /// @return Poll The Poll data
  function getPoll(uint256 _pollId) public view returns (Poll) {
    if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
    return polls[_pollId];
  }
}
