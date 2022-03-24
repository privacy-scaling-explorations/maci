// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import {
    Poll,
    PollFactory,
    PollProcessorAndTallyer,
    MessageAqFactory
} from "./Poll.sol";

import { InitialVoiceCreditProxy }
    from "./initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { AccQueue, AccQueueQuinaryBlankSl } from "./trees/AccQueue.sol";
import { IMACI } from "./IMACI.sol";
import { Params } from "./Params.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Minimum Anti-Collusion Infrastructure
 * Version 1
 */
contract MACI is IMACI, DomainObjs, Params, SnarkCommon, Ownable {

    // The state tree depth is fixed. As such it should be as large as feasible
    // so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
    uint8 public override stateTreeDepth = 10;

    // IMPORTANT: remember to change the spent voice credits tree in Poll.sol
    // if we change the state tree depth!

    uint8 constant internal STATE_TREE_SUBDEPTH = 2;
    uint8 constant internal STATE_TREE_ARITY = 5;
    uint8 constant internal MESSAGE_TREE_ARITY = 5;

    // The Keccack256 hash of 'Maci'
    uint256 constant internal NOTHING_UP_MY_SLEEVE
        = uint256(8370432830353022751713833565135785980866757267633941821328460903436894336785);

    //// The hash of a blank state leaf
    uint256 constant internal BLANK_STATE_LEAF_HASH
        = uint256(6769006970205099520508948723718471724660867171122235270773600567925038008762);

    // Each poll has an incrementing ID
    uint256 internal nextPollId = 0;

    // A mapping of poll IDs to Poll contracts.
    mapping (uint256 => Poll) public polls;

    //// A mapping of block timestamps to state roots
    //mapping (uint256 => uint256) public stateRootSnapshots;

    // The number of signups
    uint256 public override numSignUps;

    // A mapping of block timestamps to the number of state leaves
    mapping (uint256 => uint256) public numStateLeaves;

    // The block timestamp at which the state queue subroots were last merged
    //uint256 public mergeSubRootsTimestamp;

    // The verifying key registry. There may be multiple verifying keys stored
    // on chain, and Poll contracts must select the correct VK based on the
    // circuit's compile-time parameters, such as tree depths and batch sizes.
    VkRegistry public override vkRegistry;

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
        require(hash2([uint256(1),uint256(1)]) != 0, "MACI: poseidon hash libraries not linked");
    }

    /*
     * Initialise the various factory/helper contracts. This should only be run
     * once and it must be run before deploying the first Poll.
     */
    function init(
        VkRegistry _vkRegistry,
        MessageAqFactory _messageAqFactory
    ) public onlyOwner {
        require(isInitialised == false, "MACI: already initialised");

        vkRegistry = _vkRegistry;
        messageAqFactory = _messageAqFactory;

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

        isInitialised = true;

        emit Init(_vkRegistry, _messageAqFactory);
    }

    modifier afterInit() {
        require(isInitialised == true, "MACI: not initialised");
        _;
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
            numSignUps < STATE_TREE_ARITY ** stateTreeDepth,
            "MACI: maximum number of signups reached"
        );

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        require(
            _pubKey.x < SNARK_SCALAR_FIELD && _pubKey.y < SNARK_SCALAR_FIELD,
            "MACI: _pubKey values should be less than the snark scalar field"
        );

        // Get the user's voice credit balance.
        uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
            msg.sender,
            _initialVoiceCreditProxyData
        );

        // The limit on voice credits is 2 ^ 32 which is hardcoded into the
        // MessageValidator circuit, specifically at check that there are
        // sufficient voice credits (using GreaterEqThan(32)).
        // TODO: perhaps increase this to 2 ^ 50 = 1125899906842624?
        require(
            voiceCreditBalance <= 4294967296,
            "MACI: too many voice credits"
        );

        uint256 timestamp = block.timestamp;
        // Create a state leaf and enqueue it.
        uint256 stateLeaf = hashStateLeaf(
            StateLeaf(_pubKey, voiceCreditBalance, timestamp)
        );
        uint256 stateIndex = stateAq.enqueue(stateLeaf);

        // Increment the number of signups
        numSignUps ++;

        emit SignUp(stateIndex, _pubKey, voiceCreditBalance, timestamp);
    }

    //function signUpViaRelayer(
        //MaciPubKey memory pubKey,
        //bytes memory signature,
        // uint256 nonce
    //) public {
        //// TODO: validate signature and sign up
    //)

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

    function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId)
    public
    onlyPoll(_pollId)
    override
    afterInit {
        stateAq.mergeSubRoots(_numSrQueueOps);

        emit MergeStateAqSubRoots(_pollId, _numSrQueueOps);
    }

    function mergeStateAq(
        uint256 _pollId
    )
    public
    onlyPoll(_pollId)
    override
    afterInit
    returns (uint256) {
        uint256 root = stateAq.merge(stateTreeDepth);

        emit MergeStateAq(_pollId);

        return root;
    }

    function getStateAqRoot() public view override returns (uint256) {
        return stateAq.getMainRoot(stateTreeDepth);
    }

    /*
     * Deploy a new Poll contract.
     */
    function deployPoll(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        PubKey memory _coordinatorPubKey
    ) public afterInit {
        uint256 pollId = nextPollId;

        if (pollId > 0) {
            require(
                stateAq.treeMerged() == true,
                "MACI: previous poll must be completed before using a new instance"
            );
        }

        // The message batch size and the tally batch size
        BatchSizes memory batchSizes = BatchSizes(
            MESSAGE_TREE_ARITY ** uint8(_treeDepths.messageTreeSubDepth),
            STATE_TREE_ARITY ** uint8(_treeDepths.intStateTreeDepth)
        );

        Poll p = pollFactory.deploy(
            _duration,
            _maxValues,
            _treeDepths,
            batchSizes,
            _coordinatorPubKey,
            vkRegistry,
            this,
            owner()
        );

        polls[pollId] = p;

        // Increment the poll ID for the next poll
        nextPollId ++;

        emit DeployPoll(pollId, address(p), _coordinatorPubKey);
    }

    function getPoll(uint256 _pollId) public view returns (Poll) {
        require(
            _pollId < nextPollId,
            "MACI: poll with _pollId does not exist"
        );
        return polls[_pollId];
    }
}
