// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Poll } from "./Poll.sol";
import { PollFactory } from "./PollFactory.sol";
import { InitialVoiceCreditProxy } from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { AccQueue } from "./trees/AccQueue.sol";
import { AccQueueQuinaryBlankSl } from "./trees/AccQueueQuinaryBlankSl.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { TopupCredit } from "./TopupCredit.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
/// @notice A contract which allows users to sign up, and deploy new polls
contract MACI is IMACI, Params, Utilities, Ownable {
  /// @notice The state tree depth is fixed. As such it should be as large as feasible
  /// so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
  /// this should also match the parameter of the circom circuits.
  uint8 public immutable STATE_TREE_DEPTH;

  /// @notice IMPORTANT: remember to change the ballot tree depth
  /// in contracts/ts/genEmptyBallotRootsContract.ts file
  /// if we change the state tree depth!
  uint8 internal constant STATE_TREE_SUBDEPTH = 2;
  uint8 internal constant TREE_ARITY = 5;

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

  // ERC20 contract that hold topup credits
  TopupCredit public topupCredit;

  PollFactory public pollFactory;

  /// @notice The state AccQueue. Represents a mapping between each user's public key
  /// and their voice credit balance.
  AccQueue public override stateAq;

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
  event SignUp(uint256 _stateIndex, PubKey _userPubKey, uint256 _voiceCreditBalance, uint256 _timestamp);
  event DeployPoll(uint256 _pollId, address _pollAddr, PubKey _pubKey);

  /// @notice Only allow a Poll contract to call the modified function.
  modifier onlyPoll(uint256 _pollId) {
    if (msg.sender != address(polls[_pollId])) revert CallerMustBePoll(msg.sender);
    _;
  }

  /// @notice custom errors
  error CallerMustBePoll(address _caller);
  error PoseidonHashLibrariesNotLinked();
  error TooManySignups();
  error MaciPubKeyLargerThanSnarkFieldSize();
  error PreviousPollNotCompleted(uint256 pollId);
  error PollDoesNotExist(uint256 pollId);

  /// @notice Create a new instance of the MACI contract.
  /// @param _pollFactory The PollFactory contract
  /// @param _signUpGatekeeper The SignUpGatekeeper contract
  /// @param _initialVoiceCreditProxy The InitialVoiceCreditProxy contract
  /// @param _stateTreeDepth The depth of the state tree
  constructor(
    PollFactory _pollFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    TopupCredit _topupCredit,
    uint8 _stateTreeDepth
  ) payable {
    // Deploy the state AccQueue
    stateAq = new AccQueueQuinaryBlankSl(STATE_TREE_SUBDEPTH);
    stateAq.enqueue(BLANK_STATE_LEAF_HASH);

    // because we add a blank leaf we need to count one signup
    // so we don't allow max + 1
    unchecked {
      numSignUps++;
    }

    pollFactory = _pollFactory;
    topupCredit = _topupCredit;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    STATE_TREE_DEPTH = _stateTreeDepth;

    signUpTimestamp = block.timestamp;

    // Verify linked poseidon libraries
    if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
  }

  /// @notice Get the depth of the state tree
  /// @return The depth of the state tree
  function stateTreeDepth() external view returns (uint8) {
    return STATE_TREE_DEPTH;
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
  ) public {
    // ensure we do not have more signups than what the circuits support
    if (numSignUps == uint256(TREE_ARITY) ** uint256(STATE_TREE_DEPTH)) revert TooManySignups();

    if (_pubKey.x >= SNARK_SCALAR_FIELD || _pubKey.y >= SNARK_SCALAR_FIELD) {
      revert MaciPubKeyLargerThanSnarkFieldSize();
    }

    // Increment the number of signups
    // cannot overflow with realistic STATE_TREE_DEPTH
    // values as numSignUps < 5 ** STATE_TREE_DEPTH -1
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
  /// @param _maxValues The maximum number of vote options, and messages
  /// @param _treeDepths The depth of the Merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @return pollAddr a new Poll contract address
  function deployPoll(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey
  ) public onlyOwner returns (address pollAddr) {
    // cache the poll to a local variable so we can increment it
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
      uint24(TREE_ARITY) ** _treeDepths.messageTreeSubDepth,
      uint24(TREE_ARITY) ** _treeDepths.intStateTreeDepth,
      uint24(TREE_ARITY) ** _treeDepths.intStateTreeDepth
    );

    Poll p = pollFactory.deploy(
      _duration,
      _maxValues,
      _treeDepths,
      batchSizes,
      _coordinatorPubKey,
      this,
      topupCredit,
      owner()
    );

    polls[pollId] = p;

    pollAddr = address(p);

    emit DeployPoll(pollId, pollAddr, _coordinatorPubKey);
  }

  /// @notice Allow Poll contracts to merge the state subroots
  /// @param _numSrQueueOps Number of operations
  /// @param _pollId The active Poll ID
  function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public override onlyPoll(_pollId) {
    stateAq.mergeSubRoots(_numSrQueueOps);
  }

  /// @notice Allow Poll contracts to merge the state root
  /// @param _pollId The active Poll ID
  /// @return root The calculated Merkle root
  function mergeStateAq(uint256 _pollId) public override onlyPoll(_pollId) returns (uint256 root) {
    root = stateAq.merge(STATE_TREE_DEPTH);
  }

  /// @notice Return the main root of the StateAq contract
  /// @return root The Merkle root
  function getStateAqRoot() public view override returns (uint256 root) {
    root = stateAq.getMainRoot(STATE_TREE_DEPTH);
  }

  /// @notice Get the Poll details
  /// @param _pollId The identifier of the Poll to retrieve
  /// @return poll The Poll contract object
  function getPoll(uint256 _pollId) public view returns (Poll poll) {
    if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
    poll = polls[_pollId];
  }
}
