// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IPollFactory } from "./interfaces/IPollFactory.sol";
import { IMessageProcessorFactory } from "./interfaces/IMPFactory.sol";
import { ITallySubsidyFactory } from "./interfaces/ITallySubsidyFactory.sol";
import { InitialVoiceCreditProxy } from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { AccQueue } from "./trees/AccQueue.sol";
import { AccQueueQuinaryBlankSl } from "./trees/AccQueueQuinaryBlankSl.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Params } from "./utilities/Params.sol";
import { TopupCredit } from "./TopupCredit.sol";
import { Utilities } from "./utilities/Utilities.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
/// @notice A contract which allows users to sign up, and deploy new polls
contract MACI is IMACI, Params, Utilities, Ownable {
  /// @notice The state tree depth is fixed. As such it should be as large as feasible
  /// so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
  /// this should also match the parameter of the circom circuits.
  uint8 public immutable stateTreeDepth;

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
  mapping(uint256 => address) public polls;

  /// @notice Whether the subtrees have been merged (can merge root before new signup)
  bool public subtreesMerged;

  /// @notice The number of signups
  uint256 public numSignUps;

  /// @notice ERC20 contract that hold topup credits
  TopupCredit public immutable topupCredit;

  /// @notice Factory contract that deploy a Poll contract
  IPollFactory public immutable pollFactory;

  /// @notice Factory contract that deploy a MessageProcessor contract
  IMessageProcessorFactory public immutable messageProcessorFactory;

  /// @notice Factory contract that deploy a Tally contract
  ITallySubsidyFactory public immutable tallyFactory;

  /// @notice Factory contract that deploy a Subsidy contract
  ITallySubsidyFactory public immutable subsidyFactory;

  /// @notice The state AccQueue. Represents a mapping between each user's public key
  /// and their voice credit balance.
  AccQueue public immutable stateAq;

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
    address subsidy;
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
    PollContracts pollAddr
  );

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
  error SignupTemporaryBlocked();

  /// @notice Create a new instance of the MACI contract.
  /// @param _pollFactory The PollFactory contract
  /// @param _messageProcessorFactory The MessageProcessorFactory contract
  /// @param _tallyFactory The TallyFactory contract
  /// @param _subsidyFactory The SubsidyFactory contract
  /// @param _signUpGatekeeper The SignUpGatekeeper contract
  /// @param _initialVoiceCreditProxy The InitialVoiceCreditProxy contract
  /// @param _topupCredit The TopupCredit contract
  /// @param _stateTreeDepth The depth of the state tree
  constructor(
    IPollFactory _pollFactory,
    IMessageProcessorFactory _messageProcessorFactory,
    ITallySubsidyFactory _tallyFactory,
    ITallySubsidyFactory _subsidyFactory,
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
    messageProcessorFactory = _messageProcessorFactory;
    tallyFactory = _tallyFactory;
    subsidyFactory = _subsidyFactory;
    topupCredit = _topupCredit;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;

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
    // prevent new signups until we merge the roots (possible DoS)
    if (subtreesMerged) revert SignupTemporaryBlocked();

    // ensure we do not have more signups than what the circuits support
    if (numSignUps >= uint256(TREE_ARITY) ** uint256(stateTreeDepth)) revert TooManySignups();

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

    emit SignUp(stateIndex, _pubKey.x, _pubKey.y, voiceCreditBalance, timestamp);
  }

  /// @notice Deploy a new Poll contract.
  /// @param _duration How long should the Poll last for
  /// @param _treeDepths The depth of the Merkle trees
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _verifier The Verifier Contract
  /// @param _vkRegistry The VkRegistry Contract
  /// @param useSubsidy If true, the Poll will use the Subsidy contract
  /// @return pollAddr a new Poll contract address
  function deployPoll(
    uint256 _duration,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey,
    address _verifier,
    address _vkRegistry,
    bool useSubsidy
  ) public virtual onlyOwner returns (PollContracts memory pollAddr) {
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

    MaxValues memory maxValues = MaxValues({
      maxMessages: uint256(TREE_ARITY) ** _treeDepths.messageTreeDepth,
      maxVoteOptions: uint256(TREE_ARITY) ** _treeDepths.voteOptionTreeDepth
    });

    address _owner = owner();

    address p = pollFactory.deploy(
      _duration,
      maxValues,
      _treeDepths,
      _coordinatorPubKey,
      address(this),
      topupCredit,
      _owner
    );

    address mp = messageProcessorFactory.deploy(_verifier, _vkRegistry, p, _owner);
    address tally = tallyFactory.deploy(_verifier, _vkRegistry, p, mp, _owner);

    address subsidy;
    if (useSubsidy) {
      subsidy = subsidyFactory.deploy(_verifier, _vkRegistry, p, mp, _owner);
    }

    polls[pollId] = p;

    // store the addresses in a struct so they can be returned
    pollAddr = PollContracts({ poll: p, messageProcessor: mp, tally: tally, subsidy: subsidy });

    emit DeployPoll(pollId, _coordinatorPubKey.x, _coordinatorPubKey.y, pollAddr);
  }

  /// @inheritdoc IMACI
  function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public onlyPoll(_pollId) {
    stateAq.mergeSubRoots(_numSrQueueOps);

    // if we have merged all subtrees then put a block
    if (stateAq.subTreesMerged()) {
      subtreesMerged = true;
    }
  }

  /// @inheritdoc IMACI
  function mergeStateAq(uint256 _pollId) public onlyPoll(_pollId) returns (uint256 root) {
    // remove block
    subtreesMerged = false;

    root = stateAq.merge(stateTreeDepth);
  }

  /// @inheritdoc IMACI
  function getStateAqRoot() public view returns (uint256 root) {
    root = stateAq.getMainRoot(stateTreeDepth);
  }

  /// @notice Get the Poll details
  /// @param _pollId The identifier of the Poll to retrieve
  /// @return poll The Poll contract object
  function getPoll(uint256 _pollId) public view returns (address poll) {
    if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
    poll = polls[_pollId];
  }
}
