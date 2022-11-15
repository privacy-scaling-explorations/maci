// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {Poll, PollFactory, PollProcessorAndTallyer, MessageAqFactory} from "./Poll.sol";
import {InitialVoiceCreditProxy} from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "./gatekeepers/SignUpGatekeeper.sol";
import {AccQueue, AccQueueQuinaryBlankSl} from "./trees/AccQueue.sol";
import {IMACI} from "./IMACI.sol";
import {Params} from "./Params.sol";
import {DomainObjs} from "./DomainObjs.sol";
import {VkRegistry} from "./VkRegistry.sol";
import {TopupCredit} from "./TopupCredit.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {SnarkConstants} from "./crypto/SnarkConstants.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Minimum Anti-Collusion Infrastructure
 * Version 1
 */
contract MACI is IMACI, DomainObjs, Params, SnarkCommon, Ownable {
    // The state tree depth is fixed. As such it should be as large as feasible
    // so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
    uint8 public constant override stateTreeDepth = 10;

    // IMPORTANT: remember to change the ballot tree depth 
    // in contracts/ts/genEmptyBallotRootsContract.ts file
    // if we change the state tree depth!

    uint8 internal constant STATE_TREE_SUBDEPTH = 2;
    uint8 internal constant STATE_TREE_ARITY = 5;
    uint8 internal constant MESSAGE_TREE_ARITY = 5;

    //// The hash of a blank state leaf
    uint256 internal constant BLANK_STATE_LEAF_HASH =
        uint256(
            6769006970205099520508948723718471724660867171122235270773600567925038008762
        );

    // Each poll has an incrementing ID
    uint256 internal nextPollId = 0;

    // A mapping of poll IDs to Poll contracts.
    mapping(uint256 => Poll) public polls;

    // The number of signups
    uint256 public override numSignUps;

    // A mapping of block timestamps to the number of state leaves
    mapping(uint256 => uint256) public numStateLeaves;

    // The block timestamp at which the state queue subroots were last merged
    //uint256 public mergeSubRootsTimestamp;

    // The verifying key registry. There may be multiple verifying keys stored
    // on chain, and Poll contracts must select the correct VK based on the
    // circuit's compile-time parameters, such as tree depths and batch sizes.
    VkRegistry public override vkRegistry;

    // ERC20 contract that hold topup credits
    TopupCredit public topupCredit;

    PollFactory public pollFactory;
    MessageAqFactory public messageAqFactory;

    // The state AccQueue. Represents a mapping between each user's public key
    // and their voice credit balance.
    AccQueue public override stateAq;

    // Whether the init() function has been successfully executed yet.
    bool public isInitialised = false;

    // Address of the SignUpGatekeeper, a contract which determines whether a
    // user may sign up to vote
    SignUpGatekeeper public signUpGatekeeper;

    // The contract which provides the values of the initial voice credit
    // balance per user
    InitialVoiceCreditProxy public initialVoiceCreditProxy;

    // When the contract was deployed. We assume that the signup period starts
    // immediately upon deployment.
    uint256 public signUpTimestamp;

    // Events
    event Init(VkRegistry _vkRegistry, MessageAqFactory _messageAqFactory);
    event SignUp(
        uint256 _stateIndex,
        PubKey _userPubKey,
        uint256 _voiceCreditBalance,
        uint256 _timestamp
    );

    event DeployPoll(uint256 _pollId, address _pollAddr, PubKey _pubKey);

    // TODO: consider removing MergeStateAqSubRoots and MergeStateAq as the
    // functions in Poll which call them already have their own events
    event MergeStateAqSubRoots(uint256 _pollId, uint256 _numSrQueueOps);
    event MergeStateAq(uint256 _pollId);

    /*
    * Ensure certain functions only run after the contract has been initialized
    */
    modifier afterInit() {
        require(isInitialised, "MACI: not initialised");
        _;
    }

    /*
    * Only allow a Poll contract to call the modified function.
    */
    modifier onlyPoll(uint256 _pollId) {
        require(
            msg.sender == address(polls[_pollId]),
            "MACI: only a Poll contract can call this function"
        );
        _;
    }

    constructor(
        PollFactory _pollFactory,
        SignUpGatekeeper _signUpGatekeeper,
        InitialVoiceCreditProxy _initialVoiceCreditProxy
    ) {
        // Deploy the state AccQueue
        stateAq = new AccQueueQuinaryBlankSl(STATE_TREE_SUBDEPTH);
        stateAq.enqueue(BLANK_STATE_LEAF_HASH);

        pollFactory = _pollFactory;
        signUpGatekeeper = _signUpGatekeeper;
        initialVoiceCreditProxy = _initialVoiceCreditProxy;

        signUpTimestamp = block.timestamp;

        // Verify linked poseidon libraries
        require(
            hash2([uint256(1), uint256(1)]) != 0,
            "MACI: poseidon hash libraries not linked"
        );
    }

    /*
     * Initialise the various factory/helper contracts. This should only be run
     * once and it must be run before deploying the first Poll.
     * @param _vkRegistry The VkRegistry contract
     * @param _messageAqFactory The MessageAqFactory contract 
     * @param _topupCredit The topupCredit contract 
     */
    function init(
        VkRegistry _vkRegistry,
        MessageAqFactory _messageAqFactory,
        TopupCredit _topupCredit
    ) public onlyOwner {
        require(!isInitialised, "MACI: already initialised");

        isInitialised = true;

        vkRegistry = _vkRegistry;
        messageAqFactory = _messageAqFactory;
        topupCredit = _topupCredit;

        // Check that the factory contracts have correct access controls before
        // allowing any functions in MACI to run (via the afterInit modifier)
        require(
            pollFactory.owner() == address(this),
            "MACI: PollFactory owner incorrectly set"
        );

        // The PollFactory needs to store the MessageAqFactory address
        pollFactory.setMessageAqFactory(messageAqFactory);

        // The MessageAQFactory owner must be the PollFactory contract
        require(
            messageAqFactory.owner() == address(pollFactory),
            "MACI: MessageAqFactory owner incorrectly set"
        );

        // The VkRegistry owner must be the owner of this contract
        require(
            vkRegistry.owner() == owner(),
            "MACI: VkRegistry owner incorrectly set"
        );

        emit Init(_vkRegistry, _messageAqFactory);
    }

    /*
     * Allows any eligible user sign up. The sign-up gatekeeper should prevent
     * double sign-ups or ineligible users from doing so.  This function will
     * only succeed if the sign-up deadline has not passed. It also enqueues a
     * fresh state leaf into the state AccQueue.
     * @param _userPubKey The user's desired public key.
     * @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
     *     register() function. For instance, the POAPGatekeeper or
     *     SignUpTokenGatekeeper requires this value to be the ABI-encoded
     *     token ID.
     * @param _initialVoiceCreditProxyData Data to pass to the
     *     InitialVoiceCreditProxy, which allows it to determine how many voice
     *     credits this user should have.
     */
    function signUp(
        PubKey memory _pubKey,
        bytes memory _signUpGatekeeperData,
        bytes memory _initialVoiceCreditProxyData
    ) public afterInit {
        // The circuits only support up to (5 ** 10 - 1) signups
        require(
            numSignUps < uint256(STATE_TREE_ARITY) ** uint256(stateTreeDepth),
            "MACI: maximum number of signups reached"
        );

        require(
            _pubKey.x < SNARK_SCALAR_FIELD && _pubKey.y < SNARK_SCALAR_FIELD,
            "MACI: _pubKey values should be less than the snark scalar field"
        );

        // Increment the number of signups
        // cannot overflow as numSignUps < 5 ** 10 -1
        unchecked {
            numSignUps++;
        }

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        // Get the user's voice credit balance.
        uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
            msg.sender,
            _initialVoiceCreditProxyData
        );

        uint256 timestamp = block.timestamp;
        // Create a state leaf and enqueue it.
        uint256 stateLeaf = hashStateLeaf(
            StateLeaf(_pubKey, voiceCreditBalance, timestamp)
        );
        uint256 stateIndex = stateAq.enqueue(stateLeaf);

        emit SignUp(stateIndex, _pubKey, voiceCreditBalance, timestamp);
    }

    /*
    * Deploy a new Poll contract.
    * @param _duration How long should the Poll last for
    * @param _treeDepths The depth of the Merkle trees
    */
    function deployPoll(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        PubKey memory _coordinatorPubKey
    ) public afterInit {
        uint256 pollId = nextPollId;

        // Increment the poll ID for the next poll
        // 2 ** 256 polls available
        unchecked {
            nextPollId++;
        }

        if (pollId > 0) {
            require(
                stateAq.treeMerged(),
                "MACI: previous poll must be completed before using a new instance"
            );
        }

        // The message batch size and the tally batch size
        BatchSizes memory batchSizes = BatchSizes(
            uint24(MESSAGE_TREE_ARITY)**_treeDepths.messageTreeSubDepth,
            uint24(STATE_TREE_ARITY)**_treeDepths.intStateTreeDepth,
            uint24(STATE_TREE_ARITY)**_treeDepths.intStateTreeDepth
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
    }

        /*
    /* Allow Poll contracts to merge the state subroots
    /* @param _numSrQueueOps Number of operations
    /* @param _pollId The active Poll ID
    */
    function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId)
        public
        override
        onlyPoll(_pollId)
        afterInit
    {
        stateAq.mergeSubRoots(_numSrQueueOps);

        emit MergeStateAqSubRoots(_pollId, _numSrQueueOps);
    }

    /*
    /* Allow Poll contracts to merge the state root
    /* @param _pollId The active Poll ID
    /* @returns uint256 The calculated Merkle root
    */
    function mergeStateAq(uint256 _pollId)
        public
        override
        onlyPoll(_pollId)
        afterInit
        returns (uint256)
    {
        uint256 root = stateAq.merge(stateTreeDepth);

        emit MergeStateAq(_pollId);

        return root;
    }

    /*
    * Return the main root of the StateAq contract
    * @returns uint256 The Merkle root
    */
    function getStateAqRoot() public view override returns (uint256) {
        return stateAq.getMainRoot(stateTreeDepth);
    }

    /*
    * Get the Poll details
    * @param _pollId The identifier of the Poll to retrieve
    * @returns Poll The Poll data
    */
    function getPoll(uint256 _pollId) public view returns (Poll) {
        require(_pollId < nextPollId, "MACI: poll with _pollId does not exist");
        return polls[_pollId];
    }
}
