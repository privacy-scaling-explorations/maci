// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IPollFactory } from "./interfaces/IPollFactory.sol";
import { IMessageProcessorFactory } from "./interfaces/IMPFactory.sol";
import { ITallyFactory } from "./interfaces/ITallyFactory.sol";
import { InitialVoiceCreditProxy } from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Params } from "./utilities/Params.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { CurveBabyJubJub } from "./crypto/BabyJubJub.sol";
import { InternalLazyIMT, LazyIMTData } from "./trees/LazyIMT.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
/// @notice A contract which allows users to sign up, and deploy new polls
contract MACI is IMACI, DomainObjs, Params, Utilities {
  /// @notice The state tree depth is fixed. As such it should be as large as feasible
  /// so that there can be as many users as possible.  i.e. 2 ** 23 = 8388608
  /// this should also match the parameter of the circom circuits.
  /// @notice IMPORTANT: remember to change the ballot tree depth
  /// in contracts/ts/genEmptyBallotRootsContract.ts file
  /// if we change the state tree depth!
  uint8 public immutable stateTreeDepth;

  uint256 public immutable maxSignups;

  uint8 internal constant TREE_ARITY = 2;

  /// @notice The hash of a blank state leaf
  uint256 internal constant BLANK_STATE_LEAF_HASH =
    uint256(6769006970205099520508948723718471724660867171122235270773600567925038008762);

  /// @notice The roots of the empty ballot trees
  uint256[5] public emptyBallotRoots;

  /// @notice Each poll has an incrementing ID
  uint256 public nextPollId;

  /// @notice A mapping of poll IDs to Poll contracts.
  mapping(uint256 => PollContracts) public polls;

  /// @notice Factory contract that deploy a Poll contract
  IPollFactory public immutable pollFactory;

  /// @notice Factory contract that deploy a MessageProcessor contract
  IMessageProcessorFactory public immutable messageProcessorFactory;

  /// @notice Factory contract that deploy a Tally contract
  ITallyFactory public immutable tallyFactory;

  /// @notice The state tree. Represents a mapping between each user's public key
  /// and their voice credit balance.
  LazyIMTData public lazyIMTData;

  /// @notice Address of the SignUpGatekeeper, a contract which determines whether a
  /// user may sign up to vote
  SignUpGatekeeper public immutable signUpGatekeeper;

  /// @notice The contract which provides the values of the initial voice credit
  /// balance per user
  InitialVoiceCreditProxy public immutable initialVoiceCreditProxy;

  /// @notice A struct holding the addresses of poll, mp and tally
  struct PollContracts {
    address poll;
    address messageProcessor;
    address tally;
  }

  // Events
  event SignUp(
    uint256 _stateIndex,
    uint256 indexed _userPubKeyX,
    uint256 indexed _userPubKeyY,
    uint256 _voiceCreditBalance,
    uint256 _timestamp
  );
  event DeployPoll(
    uint256 _pollId,
    uint256 indexed _coordinatorPubKeyX,
    uint256 indexed _coordinatorPubKeyY,
    Mode _mode
  );

  /// @notice custom errors
  error PoseidonHashLibrariesNotLinked();
  error TooManySignups();
  error InvalidPubKey();
  error PollDoesNotExist(uint256 pollId);

  /// @notice Create a new instance of the MACI contract.
  /// @param _pollFactory The PollFactory contract
  /// @param _messageProcessorFactory The MessageProcessorFactory contract
  /// @param _tallyFactory The TallyFactory contract
  /// @param _signUpGatekeeper The SignUpGatekeeper contract
  /// @param _initialVoiceCreditProxy The InitialVoiceCreditProxy contract
  /// @param _stateTreeDepth The depth of the state tree
  /// @param _emptyBallotRoots The roots of the empty ballot trees
  constructor(
    IPollFactory _pollFactory,
    IMessageProcessorFactory _messageProcessorFactory,
    ITallyFactory _tallyFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    uint8 _stateTreeDepth,
    uint256[5] memory _emptyBallotRoots
  ) payable {
    // initialize and insert the blank leaf
    InternalLazyIMT._init(lazyIMTData, _stateTreeDepth);
    InternalLazyIMT._insert(lazyIMTData, BLANK_STATE_LEAF_HASH);

    pollFactory = _pollFactory;
    messageProcessorFactory = _messageProcessorFactory;
    tallyFactory = _tallyFactory;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;
    maxSignups = uint256(TREE_ARITY) ** uint256(_stateTreeDepth);
    emptyBallotRoots = _emptyBallotRoots;

    // Verify linked poseidon libraries
    if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
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
  ) public virtual {
    // ensure we do not have more signups than what the circuits support
    if (lazyIMTData.numberOfLeaves >= maxSignups) revert TooManySignups();

    // ensure that the public key is on the baby jubjub curve
    if (!CurveBabyJubJub.isOnCurve(_pubKey.x, _pubKey.y)) {
      revert InvalidPubKey();
    }

    // Register the user via the sign-up gatekeeper. This function should
    // throw if the user has already registered or if ineligible to do so.
    signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(msg.sender, _initialVoiceCreditProxyData);

    uint256 timestamp = block.timestamp;

    // Create a state leaf and insert it into the tree.
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, timestamp));
    InternalLazyIMT._insert(lazyIMTData, stateLeaf);

    emit SignUp(lazyIMTData.numberOfLeaves - 1, _pubKey.x, _pubKey.y, voiceCreditBalance, timestamp);
  }

  /// @notice Deploy a new Poll contract.
  /// @param _duration How long should the Poll last for
  /// @param _treeDepths The depth of the Merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _verifier The Verifier Contract
  /// @param _vkRegistry The VkRegistry Contract
  /// @param _mode Voting mode
  function deployPoll(
    uint256 _duration,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey,
    address _verifier,
    address _vkRegistry,
    Mode _mode
  ) public virtual {
    // cache the poll to a local variable so we can increment it
    uint256 pollId = nextPollId;

    // Increment the poll ID for the next poll
    // 2 ** 256 polls available
    unchecked {
      nextPollId++;
    }

    // check coordinator key is a valid point on the curve
    if (!CurveBabyJubJub.isOnCurve(_coordinatorPubKey.x, _coordinatorPubKey.y)) {
      revert InvalidPubKey();
    }

    uint256 voteOptionTreeDepth = _treeDepths.voteOptionTreeDepth;

    address p = pollFactory.deploy(
      _duration,
      _treeDepths,
      _coordinatorPubKey,
      address(this),
      emptyBallotRoots[voteOptionTreeDepth - 1]
    );

    address mp = messageProcessorFactory.deploy(_verifier, _vkRegistry, p, msg.sender, _mode);
    address tally = tallyFactory.deploy(_verifier, _vkRegistry, p, mp, msg.sender, _mode);

    // store the addresses in a struct so they can be returned
    PollContracts memory pollAddr = PollContracts({ poll: p, messageProcessor: mp, tally: tally });

    polls[pollId] = pollAddr;

    emit DeployPoll(pollId, _coordinatorPubKey.x, _coordinatorPubKey.y, _mode);
  }

  /// @inheritdoc IMACI
  function getStateTreeRoot() public view returns (uint256 root) {
    root = InternalLazyIMT._root(lazyIMTData);
  }

  /// @notice Get the Poll details
  /// @param _pollId The identifier of the Poll to retrieve
  /// @return pollContracts The Poll contract object
  function getPoll(uint256 _pollId) public view returns (PollContracts memory pollContracts) {
    if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
    pollContracts = polls[_pollId];
  }

  /// @inheritdoc IMACI
  function numSignUps() public view returns (uint256 signUps) {
    signUps = lazyIMTData.numberOfLeaves;
  }
}
