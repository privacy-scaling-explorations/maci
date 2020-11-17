// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { Polls } from "./Polls.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";
import { AccQueueQuinaryMaci } from "./trees/AccQueue.sol";

/*
 * Minimum Anti-Collusion Infrastructure
 * Version 1
 */
contract MACI is Polls, VkRegistry, SnarkConstants {
    // The state tree depth is fixed per MACI instance. As such it should be as
    // large as feasible so that there can be as many users as possible.
    // i.e. 5 ** 10 = 9765625
    uint8 constant internal MAX_STATE_TREE_DEPTH = 10;
    uint8 constant internal STATE_TREE_SUBDEPTH = 2;

    // The number of leaves per node
    uint8 constant internal STATE_TREE_ARITY = 5;
    uint8 constant internal MESSAGE_TREE_ARITY = 5;
    uint8 constant internal VOTE_OPTION_TREE_ARITY = 5;
    uint8 public stateTreeDepth;

    // Each poll has an incrementing ID
    uint256 internal nextPollId = 0;
    mapping (uint256 => Poll) public polls;

    AccQueueQuinaryMaci public stateAq;

    constructor(
        uint8 _stateTreeDepth
    ) {
        // TODO: create State AccQueue
        require(_stateTreeDepth <= MAX_STATE_TREE_DEPTH, "MACI: invalid _stateTreeDepth");
        stateTreeDepth = _stateTreeDepth;
        stateAq = new AccQueueQuinaryMaci(STATE_TREE_SUBDEPTH);
    }

    event CreatePoll(uint256 _pollId);

    function signUp(
        MaciPubKey memory pubKey
    ) public {
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

    function mergeSignUpsSubRoots(uint256 _numSrQueueOps) public onlyOwner {
        stateAq.mergeSubRoots(_numSrQueueOps);
    }

    function mergeSignUps() public onlyOwner {
        stateAq.merge(MAX_STATE_TREE_DEPTH);
    }

    function publishMessage(
        uint256 _pollId,
        Message memory _message
    ) public {
        uint256 messageLeaf = hashMessage(_message);
        polls[_pollId].messageAq.enqueue(messageLeaf);
    }

    function mergeMessagesSubRoots(
        uint256 _numSrQueueOps,
        uint256 _pollId
    ) public onlyOwner {
        polls[_pollId].messageAq.mergeSubRoots(_numSrQueueOps);
    }

    function mergeMessages(
        uint256 _pollId
    ) public onlyOwner {
        polls[_pollId].messageAq.merge(
            polls[_pollId].treeDepths.messageTreeDepth
        );
    }

    function createPoll(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        uint8 _messageBatchSize,
        MaciPubKey memory _coordinatorPubKey,
        VerifyingKey memory _processVk,
        VerifyingKey memory _tallyVk
    ) public {
        uint256 pollId = nextPollId;
        uint8 stateTreeArity = STATE_TREE_ARITY;
        uint8 messageTreeArity = MESSAGE_TREE_ARITY;
        uint8 voteOptionTreeArity = VOTE_OPTION_TREE_ARITY;

        // Validate each item in _maxValues
        require(
            _maxValues.maxUsers <=
                stateTreeArity ** stateTreeDepth,
            "MACI: maxUsers is too large"
        );

        require(
            _maxValues.maxMessages <=
                messageTreeArity ** _treeDepths.messageTreeDepth,
            "MACI: maxMessages is too large"
        );

        require(
            _maxValues.maxVoteOptions <=
                voteOptionTreeArity ** _treeDepths.voteOptionTreeDepth,
            "MACI: maxVoteOptions is too large"
        );

        // _messageBatchSize must be lte maxMessages and also be a factor
        require(
            _maxValues.maxMessages >= _messageBatchSize &&
            _maxValues.maxMessages % _messageBatchSize == 0,
            "MACI: invalid _messageBatchSize given"
        );

        uint8 tallyBatchSize = stateTreeArity ** uint8(_treeDepths.intStateTreeDepth);

        require(
            _maxValues.maxUsers >= _treeDepths.intStateTreeDepth &&
            _maxValues.maxUsers % tallyBatchSize == 0,
            "MACI: invalid maxUsers given"
        );

        // Set the coordinator's public key
        polls[pollId].coordinatorPubKey = _coordinatorPubKey;

        polls[pollId].batchSizes.tallyBatchSize = tallyBatchSize;
        polls[pollId].batchSizes.messageBatchSize = _messageBatchSize;

        polls[pollId].maxValues = _maxValues;
        polls[pollId].treeDepths = _treeDepths;

        polls[pollId].duration = _duration;

        polls[pollId].messageAq = new AccQueueQuinaryMaci(_treeDepths.messageTreeDepth);

        // Get the verifying keys from the VK registry
        uint256 processVkSig = genProcessVkSig(
            stateTreeDepth,
            _treeDepths.messageTreeDepth,
            _treeDepths.voteOptionTreeDepth,
            _messageBatchSize
        );

        uint256 tallyVkSig = genTallyVkSig(
            stateTreeDepth,
            _treeDepths.intStateTreeDepth,
            _treeDepths.voteOptionTreeDepth
        );

        // Store the VKs if they aren't already
        if (!isProcessVkSet[processVkSig]) {
            // The tally vk should not be set if the process vk is not
            assert(!isTallyVkSet[tallyVkSig]);

            // TODO: validate the verifying keys
            setVerifyingKeys(
                stateTreeDepth,
                _treeDepths.intStateTreeDepth,
                _treeDepths.messageTreeDepth,
                _treeDepths.voteOptionTreeDepth,
                _messageBatchSize,
                _processVk,
                _tallyVk
            );
        }

        polls[pollId].processVkSig = processVkSig;
        polls[pollId].tallyVkSig = tallyVkSig;

        // Increment the poll ID for the next poll
        nextPollId ++;

        emit CreatePoll(pollId);
    }

    function getPoll(uint256 _pollId) public view returns (Poll memory) {
        require(_pollId < nextPollId, "MACI: poll with _pollId does not exist");
        return polls[_pollId];
    }
}
