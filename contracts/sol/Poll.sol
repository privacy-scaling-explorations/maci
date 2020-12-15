// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { IMACI } from "./IMACI.sol";
import { Params } from "./Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { AccQueue, AccQueueQuinaryMaci } from "./trees/AccQueue.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { EmptyBallotRoots } from "./trees/EmptyBallotRoots.sol";

contract MessageAqFactory is Ownable {
    function deploy(uint256 _subDepth)
    public
    onlyOwner
    returns (AccQueueQuinaryMaci) {
        AccQueueQuinaryMaci aq = new AccQueueQuinaryMaci(_subDepth);
        aq.transferOwnership(owner());
        return aq;
    }
}

/*
 * A factory contract which deploys Poll contracts. It allows the MACI contract
 * size to stay within the limit set by EIP-170.
 */
contract PollFactory is EmptyBallotRoots, Params, DomainObjs, Ownable {

    MessageAqFactory public messageAqFactory;

    event DeployPoll(uint256 _pollId, address _pollAddr);

    function setMessageAqFactory(MessageAqFactory _messageAqFactory)
    public
    onlyOwner {
        messageAqFactory = _messageAqFactory;
    }

    function deploy(
        uint256 _duration,
        uint8 _stateTreeDepth,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        VkRegistry _vkRegistry,
        IMACI _maci,
        address _pollOwner,
        PollProcessor _pollProcessor
    ) public onlyOwner returns (Poll) {

        AccQueueQuinaryMaci messageAq =
            messageAqFactory.deploy(_treeDepths.messageTreeSubDepth);

        Poll poll = new Poll(
            _duration,
            _stateTreeDepth,
            _maxValues,
            _treeDepths,
            _batchSizes,
            _coordinatorPubKey,
            _vkRegistry,
            _maci,
            messageAq,
            _pollProcessor
        );

        messageAq.transferOwnership(address(poll));

        poll.setEmptyBallotRoot(
            emptyBallotRoots[_treeDepths.voteOptionTreeDepth]
        );
        poll.transferOwnership(_pollOwner);

        return poll;
    }
}

contract Poll is Params, DomainObjs, SnarkConstants, SnarkCommon, Ownable {
    // The coordinator's public key
    PubKey public coordinatorPubKey;

    uint256 public deployTime;

    // The duration of the polling period, in seconds
    uint256 public duration;

    // The verifying key signature for the message processing circuit
    uint256 public processVkSig;

    // The verifying key signature for the tally circuit
    uint256 public tallyVkSig;

    // The MACI instance
    IMACI public maci;

    // The message queue
    AccQueue public messageAq;

    // The ballot tree root.
    uint256 public ballotRoot;

    PollProcessor public pollProcessor;

    // The state root. This value should be 0 until the first invocation of
    // processMessages(), at which point it should be set to the MACI state
    // root, and then updated based on the result of processing each batch of
    // messages.
    uint256 public currentStateRoot;

    // Whether there are unprocessed messages left
    bool public hasUnprocessedMessages = true;

    // The current message batch index. When the coordinator runs
    // processMessages(), this action relates to messages
    // currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
    uint256 public currentMessageBatchIndex;

    // The number of batches processed
    uint256 public numBatchesProcessed;

    MaxValues public maxValues;
    TreeDepths public treeDepths;
    BatchSizes public batchSizes;

    uint8 constant internal TREE_ARITY = 5;

    // Error codes. We store them as constants and keep them short to reduce
    // this contract's bytecode size.
    string constant ERROR_MAXVALUES = "PollE01";
    string constant ERROR_VK_NOT_SET = "PollE02";
    string constant ERROR_BALLOT_ROOT_NOT_SET = "PollE03";
    string constant ERROR_VOTING_PERIOD_PASSED = "PollE04";
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "PollE05";
    string constant ERROR_INVALID_PUBKEY = "PollE06";
    string constant ERROR_ONLY_POLL_PROCESSOR = "PollE07";

    event PublishMessage(
        Message _message,
        PubKey _encPubKey
    );

    /*
     * Each MACI instance can have multiple Polls.
     * When a Poll is deployed, its voting period starts immediately.
     */
    constructor(
        uint256 _duration,
        uint8 _stateTreeDepth,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        VkRegistry _vkRegistry,
        IMACI _maci,
        AccQueue _messageAq,
        PollProcessor _pollProcessor
    ) {
        uint8 treeArity = TREE_ARITY;
        // Validate each item in _maxValues
        require(
            (
                _maxValues.maxUsers <= treeArity ** _stateTreeDepth &&
                _maxValues.maxMessages <= treeArity ** _treeDepths.messageTreeDepth
            ) &&
            (
                _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
                _maxValues.maxMessages % _batchSizes.messageBatchSize == 0
            ) &&
            (
                _maxValues.maxUsers >= _treeDepths.intStateTreeDepth &&
                _maxValues.maxUsers % _batchSizes.tallyBatchSize == 0
            ) && (
                _maxValues.maxVoteOptions <= treeArity ** _treeDepths.voteOptionTreeDepth
            ),
            ERROR_MAXVALUES
        );

        coordinatorPubKey = _coordinatorPubKey;
        duration = _duration;
        maxValues = _maxValues;
        batchSizes = _batchSizes;
        treeDepths = _treeDepths;

        maci = _maci;
        messageAq = _messageAq;

        uint256 pSig = _vkRegistry.genProcessVkSig(
            _stateTreeDepth,
            _treeDepths.messageTreeDepth,
            _treeDepths.voteOptionTreeDepth,
            _batchSizes.messageBatchSize
        );

        uint256 tSig = _vkRegistry.genTallyVkSig(
            _stateTreeDepth,
            _treeDepths.intStateTreeDepth,
            _treeDepths.voteOptionTreeDepth
        );

        require(
            _vkRegistry.isProcessVkSet(pSig) &&
            _vkRegistry.isTallyVkSet(tSig),
            ERROR_VK_NOT_SET
        );

        // Store the VK sigs
        processVkSig = pSig;
        tallyVkSig = tSig;

        // Record the current timestamp
        deployTime = block.timestamp;

        // Set the poll processor contract
        pollProcessor = _pollProcessor;
    }

    /*
     * TODO: write comment
     */
    function setEmptyBallotRoot(uint256 _emptyBallotRoot) public onlyOwner {
        require(ballotRoot == 0, ERROR_BALLOT_ROOT_NOT_SET);
        ballotRoot = _emptyBallotRoot;
    }

    /*
     * TODO: write comment
     */
    modifier isBeforeVotingDeadline() {
        // Throw if the voting period is over
        uint256 secondsPassed = block.timestamp - deployTime;
        require(
            secondsPassed <= duration,
            ERROR_VOTING_PERIOD_PASSED
        );
        _;
    }

    /*
     * TODO: write comment
     */
    modifier isAfterVotingDeadline() {
        // Throw if the voting period is not over
        uint256 secondsPassed = block.timestamp - deployTime;
        require(
            secondsPassed > duration,
            ERROR_VOTING_PERIOD_NOT_PASSED
        );
        _;
    }

    /*
     * Allows anyone to publish a message (an encrypted command and signature).
     * This function also enqueues the message.
     * @param _message The message to publish
     * @param _encPubKey An epheremal public key which can be combined with the
     *     coordinator's private key to generate an ECDH shared key which which
     *     was used to encrypt the message.
     */
    function publishMessage(
        Message memory _message,
        PubKey memory _encPubKey
    )
    public
    isBeforeVotingDeadline {
        require(
            _encPubKey.x < SNARK_SCALAR_FIELD &&
            _encPubKey.y < SNARK_SCALAR_FIELD,
            ERROR_INVALID_PUBKEY
        );
        uint256 messageLeaf = hashMessage(_message);
        messageAq.enqueue(messageLeaf);

        emit PublishMessage(_message, _encPubKey);
    }

    /*
     * TODO: write comment
     */
    function mergeMessageAqSubRoots(uint256 _numSrQueueOps)
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.mergeSubRoots(_numSrQueueOps);
    }

    /*
     * TODO: write comment
     */
    function mergeMessageAq()
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.merge(treeDepths.messageTreeDepth);
    }

    /*
     * TODO: write comment
     */
    function batchEnqueueMessage(uint256 _messageSubRoot)
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.insertSubTree(_messageSubRoot);
    }

    /*
     * The PollProcessor will call this function to update the Poll's state
     * after processing each batch.
     */
    function setMessageProcessingData(
        uint256 _newStateRoot,
        bool _hasUnprocessedMessages,
        uint256 _currentMessageBatchIndex
    ) public {
        require(
            msg.sender == address(pollProcessor),
            ERROR_ONLY_POLL_PROCESSOR
        );

        currentStateRoot = _newStateRoot;
        hasUnprocessedMessages = _hasUnprocessedMessages;
        currentMessageBatchIndex = _currentMessageBatchIndex;
        numBatchesProcessed ++;
    }
}


contract PollProcessor is Ownable {

    Poll public parentPoll;

    constructor(
        Poll _parentPoll
    ) {
        parentPoll = _parentPoll;
    }

    /*
     * Update the Poll's currentStateRoot if the proof is valid.
     * @param _newStateRoot The new state root after all messages are processed
     * @param _stateTreeRoots The intermediate state roots
     * @param _ecdhPubKeys The public key used to generated the ECDH shared key
     *                     to decrypt the message
     * @param _proof The zk-SNARK proof
     */
    function processMessages(
        uint256 _stateRootSnapshotTimestamp,
        uint256 _newStateRoot,
        uint256[8] memory _proof
    )
    public
    onlyOwner
    {
        Poll pp = parentPoll;

        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - pp.deployTime();
        require(
            secondsPassed > pp.duration(),
            "PollProcessor: the voting period is not over"
        );

        // Require that unprocessed messages exist
        require(
            pp.hasUnprocessedMessages(),
            "PollProcessor: no more messages left to process"
        );

        uint256 messageTreeDepth;
        (, messageTreeDepth, , ) = pp.treeDepths();

        // Require that the message queue has been merged
        uint256 messageRoot =
            pp.messageAq().getMainRoot(messageTreeDepth);
        require(messageRoot != 0, "Poll: the message AQ has not been merged");

        uint256 messageBatchSize;
        (messageBatchSize, ) = pp.batchSizes();

        uint256 currentStateRoot = pp.currentStateRoot();
        uint256 currentMessageBatchIndex = pp.currentMessageBatchIndex();

        // Copy the state root and set the batch index if this is the
        // first batch to process
        if (pp.numBatchesProcessed() == 0) {
            // Ensure that the state queue was merged after the voting period
            // ended
            require(
                _stateRootSnapshotTimestamp > pp.deployTime() + pp.duration(),
                "Poll: invalid state root snapshot timestamp"
            );

            currentStateRoot =
                pp.maci().getStateRootSnapshot(_stateRootSnapshotTimestamp);

            uint256 numMessages = pp.messageAq().numLeaves();
            currentMessageBatchIndex =
                (numMessages / messageBatchSize) * messageBatchSize;
        }

        // Generate public signals

        // Verify the proof

        bool hasUnprocessedMessages = pp.hasUnprocessedMessages();

        // Decrease the message batch start index to ensure that each message
        // batch is processed in order
        if (currentMessageBatchIndex == 0) {
            hasUnprocessedMessages = false;
        } else {
            currentMessageBatchIndex -= messageBatchSize;
        }

        // Update the state root
        pp.setMessageProcessingData(
            _newStateRoot,
            hasUnprocessedMessages,
            currentMessageBatchIndex
        );
    }
}

/*
 * TODO: consider replacing this with Maker's multicall
 */
contract PollStateViewer is Params, DomainObjs {
    struct VkSigs {
        uint256 processVkSig;
        uint256 tallyVkSig;
    }

    /*
     * A convenience function to return several storage variables of a Poll in
     * a single call.
     */
    function getState(Poll _poll) public view returns (
        PubKey memory,        // coordinatorPubKey
        uint256,              // duration
        VkSigs memory,        // VkSigs
        AccQueue,             // messageAq
        MaxValues memory,     // maxValues
        TreeDepths memory,    // treeDepths
        BatchSizes memory     // batchSizes
    ){
        PubKey memory pubkey;
        (pubkey.x, pubkey.y) = _poll.coordinatorPubKey();

        VkSigs memory vkSigs;
        vkSigs.processVkSig = _poll.processVkSig();
        vkSigs.tallyVkSig = _poll.tallyVkSig();

        AccQueue messageAq = _poll.messageAq();

        MaxValues memory maxValues;
        (
            maxValues.maxUsers,
            maxValues.maxMessages,
            maxValues.maxVoteOptions
        ) = _poll.maxValues();

        TreeDepths memory treeDepths;
        (
            treeDepths.intStateTreeDepth,
            treeDepths.messageTreeSubDepth,
            treeDepths.messageTreeDepth,
            treeDepths.voteOptionTreeDepth
        ) = _poll.treeDepths();

        BatchSizes memory batchSizes;
        (
            batchSizes.messageBatchSize,
            batchSizes.tallyBatchSize
        ) = _poll.batchSizes();

        return (
            pubkey,
            _poll.duration(),
            vkSigs,
            messageAq,
            maxValues,
            treeDepths,
            batchSizes
        );
    }
}
