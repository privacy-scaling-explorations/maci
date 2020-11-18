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

    event DeployPoll(uint256 _pollId, address _pollAddr);

    constructor(
        PollFactory _pollFactory
    ) {
        stateAq = new AccQueueQuinaryMaci(STATE_TREE_SUBDEPTH);

        pollFactory = _pollFactory;
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
        PubKey memory pubKey
    ) public afterInit {
        require(
            pubKey.x < SNARK_SCALAR_FIELD && pubKey.y < SNARK_SCALAR_FIELD,
            "MACI: pubkey values should be less than the snark scalar field"
        );

        uint256 stateLeaf = hashLeftRight(pubKey.x, pubKey.y);
        stateAq.enqueue(stateLeaf);
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
            vkRegistry
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
