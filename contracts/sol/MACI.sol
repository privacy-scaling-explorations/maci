// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { Poll, PollFactory, MessageAqFactory } from "./Poll.sol";
import { Params } from "./Params.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { AccQueueQuinaryMaci } from "./trees/AccQueue.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { InitialVoiceCreditProxy } from './initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

/*
 * Minimum Anti-Collusion Infrastructure
 * Version 1
 */
contract MACI is DomainObjs, Params, SnarkConstants, SnarkCommon, Ownable {
    // The state tree depth is fixed. As such it should be as large as feasible
    // so that there can be as many users as possible.  i.e. 5 ** 10 = 9765625
    uint8 public stateTreeDepth = 10;
    uint8 constant internal STATE_TREE_SUBDEPTH = 2;
    uint8 constant internal STATE_TREE_ARITY = 5;

    // Each poll has an incrementing ID
    uint256 internal nextPollId = 0;
    mapping (uint256 => Poll) public polls;

    VkRegistry public vkRegistry;

    PollFactory public pollFactory;
    AccQueueQuinaryMaci public stateAq;
    MessageAqFactory public messageAqFactory;

    bool isInitialised = false;

    // Address of the SignUpGatekeeper, a contract which determines whether a
    // user may sign up to vote
    SignUpGatekeeper public signUpGatekeeper;

    // The contract which provides the values of the initial voice credit
    // balance per user
    InitialVoiceCreditProxy public initialVoiceCreditProxy;

    event SignUp(
        uint256 _stateIndex,
        PubKey _userPubKey,
        uint256 _voiceCreditBalance
    );
    event DeployPoll(uint256 _pollId, address _pollAddr);

    constructor(
        PollFactory _pollFactory,
        SignUpGatekeeper _signUpGatekeeper,
        InitialVoiceCreditProxy _initialVoiceCreditProxy
    ) {
        stateAq = new AccQueueQuinaryMaci(STATE_TREE_SUBDEPTH);

        pollFactory = _pollFactory;
        signUpGatekeeper = _signUpGatekeeper;
        initialVoiceCreditProxy = _initialVoiceCreditProxy;
    }

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

        pollFactory.setMessageAqFactory(messageAqFactory);

        require(
            messageAqFactory.owner() == address(pollFactory),
            "MACI: MessageAqFactory owner incorrectly set"
        );

        require(
            vkRegistry.owner() == owner(),
            "MACI: VkRegistry owner incorrectly set"
        );

        isInitialised = true;
    }

    modifier afterInit() {
        require(isInitialised == true, "MACI: not initialised");
        _;
    }

    function signUp(
        PubKey memory _pubKey,
        bytes memory _signUpGatekeeperData,
        bytes memory _initialVoiceCreditProxyData
    ) public afterInit {

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        require(
            _pubKey.x < SNARK_SCALAR_FIELD && _pubKey.y < SNARK_SCALAR_FIELD,
            "MACI: _pubKey values should be less than the snark scalar field"
        );

        uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
            msg.sender,
            _initialVoiceCreditProxyData
        );

        // The limit on voice credits is 2 ^ 32 which is hardcoded into the
        // UpdateStateTree circuit, specifically at check that there are
        // sufficient voice credits (using GreaterEqThan(32)).
        // TODO: perhaps increase this to 2 ^ 50 = 1125899906842624?
        require(voiceCreditBalance <= 4294967296, "MACI: too many voice credits");

        uint256 stateLeaf = hashStateLeaf(
            StateLeaf(_pubKey, voiceCreditBalance)
        );
        uint256 stateIndex = stateAq.enqueue(stateLeaf);

        emit SignUp(stateIndex, _pubKey, voiceCreditBalance);
    }

    //function signUpViaRelayer(
        //MaciPubKey memory pubKey,
        //bytes memory signature,
        // uint256 nonce
    //) public {
        //// TODO: validate signature and sign up
    //)

    function mergeStateAqSubRoots(uint256 _numSrQueueOps) public onlyOwner afterInit {
        stateAq.mergeSubRoots(_numSrQueueOps);
    }

    function mergeStateAq() public onlyOwner afterInit {
        stateAq.merge(stateTreeDepth);
    }

    function deployPoll(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        uint8 _messageBatchSize,
        PubKey memory _coordinatorPubKey
    ) public afterInit {
        uint256 pollId = nextPollId;

        // The message batch size and the tally batch size
        BatchSizes memory batchSizes = BatchSizes(
            _messageBatchSize,
            STATE_TREE_ARITY ** uint8(_treeDepths.intStateTreeDepth)
        );

        Poll p = pollFactory.deploy(
            _duration,
            stateTreeDepth,
            _maxValues,
            _treeDepths,
            batchSizes,
            _coordinatorPubKey,
            vkRegistry,
            owner()
        );

        polls[pollId] = p;

        // Increment the poll ID for the next poll
        nextPollId ++;

        emit DeployPoll(pollId, address(p));
    }

    function getPoll(uint256 _pollId) public view returns (Poll) {
        require(_pollId < nextPollId, "MACI: poll with _pollId does not exist");
        return polls[_pollId];
    }
}
