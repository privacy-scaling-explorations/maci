// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { IMACI } from "./IMACI.sol";
import { Params } from "./Params.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { IVerifier } from "./crypto/Verifier.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { SnarkConstants } from "./crypto/SnarkConstants.sol";
import { DomainObjs, IPubKey, IMessage } from "./DomainObjs.sol";
import {
    AccQueue,
    //AccQueueQuinaryMaciWithSha256,
    AccQueueQuinaryMaci
} from "./trees/AccQueue.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { VkRegistry } from "./VkRegistry.sol";
import { EmptyBallotRoots } from "./trees/EmptyBallotRoots.sol";

contract MessageAqFactory is Ownable {
    function deploy(uint256 _subDepth)
    public
    onlyOwner
    returns (AccQueue) {
        //AccQueue aq = new AccQueueQuinaryMaciWithSha256(_subDepth);
        AccQueue aq = new AccQueueQuinaryMaci(_subDepth);
        aq.transferOwnership(owner());
        return aq;
    }
}

contract PollDeploymentParams {
    struct ExtContracts {
        VkRegistry vkRegistry;
        IMACI maci;
        AccQueue messageAq;
    }
}

/*
 * A factory contract which deploys Poll contracts. It allows the MACI contract
 * size to stay within the limit set by EIP-170.
 */
contract PollFactory is EmptyBallotRoots, Params, IPubKey, IMessage, Ownable, Hasher, PollDeploymentParams {

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
        uint256 _coordinatorPubKeyHash,
        VkRegistry _vkRegistry,
        IMACI _maci,
        address _pollOwner,
        PollProcessorAndTallyer _ppt,
        uint256 _mergeSubRootsTimestamp
    ) public onlyOwner returns (Poll) {
        {
        uint8 treeArity = 5;

        // Validate _maxValues
        require(
            _maxValues.maxUsers <= treeArity ** _stateTreeDepth &&
            _maxValues.maxMessages <= 
                treeArity ** _treeDepths.messageTreeDepth &&
            _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
            _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
            _maxValues.maxUsers >= _treeDepths.intStateTreeDepth &&
            _maxValues.maxUsers % _batchSizes.tallyBatchSize == 0 &&
            _maxValues.maxVoteOptions <= 
                treeArity ** _treeDepths.voteOptionTreeDepth,
            "PollFactory: invalid _maxValues"
        );
        }

        AccQueue messageAq =
            messageAqFactory.deploy(_treeDepths.messageTreeSubDepth);

        ExtContracts memory extContracts;
        extContracts.vkRegistry = _vkRegistry;
        extContracts.maci = _maci;
        extContracts.messageAq = messageAq;

        Poll poll = new Poll(
            _duration,
            _stateTreeDepth,
            _maxValues,
            _treeDepths,
            _batchSizes,
            _coordinatorPubKeyHash,
            extContracts,
            _ppt,
            _maci.getNumStateLeaves(_mergeSubRootsTimestamp)
        );

        messageAq.transferOwnership(address(poll));

        uint256[] memory sb = new uint256[](3);
        sb[0] = _maci.getStateRootSnapshot(_mergeSubRootsTimestamp);
        sb[1] = emptyBallotRoots[_treeDepths.voteOptionTreeDepth];
        sb[2] = uint256(0);

        poll.setEmptySbCommitment(hash3(sb));

        poll.transferOwnership(_pollOwner);

        return poll;
    }
}

/*
 * Do not deploy this directly. Use PollFactory.deploy() which performs some
 * checks on the Poll constructor arguments.
 */
contract Poll is Params, Hasher, IMessage, IPubKey, SnarkCommon, Ownable, PollDeploymentParams {
    // The coordinator's public key
    uint256 public coordinatorPubKeyHash;

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

    PollProcessorAndTallyer public ppt;

    // The commitment to the state leaves and the ballots. This is
    // hash3(stateRoot, ballotRoot, salt).
    // Its initial value should be
    // hash(maciStateRootSnapshot, emptyBallotRoot, 0)
    // Each successful invocation of processMessages() should use a different
    // salt to update this value, so that an external observer cannot tell in
    // the case that none of the messages are valid.
    uint256 public currentSbCommitment;

    // The commitment to the tally results. Its initial value should be:
    // hash3(
    //   hashLeftRight(merkleRoot([0...0], 0),
    //   hashLeftRight(0, 0),
    //   hashLeftRight(merkleRoot([0...0]), 0)
    // )
    // Where [0...0] is an array of 0s, TREE_ARITY ** voteOptionTreeDepth long
    uint256 public currentTallyCommitment = 
        0x17e1b6993b1af9f8dfe8d4202c2f2a610994ff19b92462f9a54da39d11026d6b;

    uint256 public numSignUps;

    // The number of published messages
    uint256 public numMessages;

    MaxValues public maxValues;
    TreeDepths public treeDepths;
    BatchSizes public batchSizes;

    // Error codes. We store them as constants and keep them short to reduce
    // this contract's bytecode size.
    string constant ERROR_VK_NOT_SET = "PollE01";
    string constant ERROR_SB_COMMITMENT_NOT_SET = "PollE02";
    string constant ERROR_VOTING_PERIOD_PASSED = "PollE03";
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "PollE04";
    string constant ERROR_INVALID_PUBKEY = "PollE05";
    string constant ERROR_ONLY_PPT = "PollE06";

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
        uint256 _coordinatorPubKeyHash,
        ExtContracts memory _extContracts,
        PollProcessorAndTallyer _ppt,
        uint256 _numSignUps
    ) {
        VkRegistry _vkRegistry = _extContracts.vkRegistry;
        IMACI _maci = _extContracts.maci;
        AccQueue _messageAq = _extContracts.messageAq;

        coordinatorPubKeyHash = _coordinatorPubKeyHash;
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
        ppt = _ppt;

        // Set the current number of signups
        numSignUps = _numSignUps;
    }

    /*
     * TODO: write comment
     */
    function setEmptySbCommitment(uint256 _emptyEmptySbCommitment) public onlyOwner {
        require(currentSbCommitment == 0, ERROR_SB_COMMITMENT_NOT_SET);
        currentSbCommitment = _emptyEmptySbCommitment;
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
        numMessages ++;

        emit PublishMessage(_message, _encPubKey);
    }

    function hashMessage(Message memory _message) public pure returns (uint256) {
        uint256[] memory n = new uint256[](8);
        n[0] = _message.iv;
        n[1] = _message.data[0];
        n[2] = _message.data[1];
        n[3] = _message.data[2];
        n[4] = _message.data[3];
        n[5] = _message.data[4];
        n[6] = _message.data[5];
        n[7] = _message.data[6];

        return sha256Hash(n);
        //uint256[] memory n = new uint256[](5);
        //n[0] = _message.iv;
        //n[1] = _message.data[0];
        //n[2] = _message.data[1];
        //n[3] = _message.data[2];
        //n[4] = _message.data[3];

        //uint256[] memory m = new uint256[](4);
        //m[0] = hash5(n);
        //m[1] = _message.data[4];
        //m[2] = _message.data[5];
        //m[3] = _message.data[6];

        //return hash4(m);
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
        // TODO: emit event
    }
}

// TODO: to reduce the Poll contract size, make this contract
// store data instead
contract PollProcessorAndTallyer is Ownable, SnarkCommon, Hasher {
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "PptE01";
    string constant ERROR_NO_MORE_MESSAGES = "PptE02";
    string constant ERROR_MESSAGE_AQ_NOT_MERGED = "PptE03";
    string constant ERROR_INVALID_STATE_ROOT_SNAPSHOT_TIMESTAMP = "PptE04";
    string constant ERROR_INVALID_PROCESS_MESSAGE_PROOF = "PptE05";
    string constant ERROR_INVALID_TALLY_VOTES_PROOF = "PptE06";
    string constant ERROR_PROCESSING_NOT_COMPLETE = "PptE07";
    string constant ERROR_ALL_BALLOTS_TALLIED = "PptE08";

    struct PptData {
        uint256 sbCommitment;

        // The current message batch index. When the coordinator runs
        // processMessages(), this action relates to messages
        // currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
        uint256 currentMessageBatchIndex;

        // Whether there are unprocessed messages left
        bool processingComplete;

        // The number of batches processed
        uint256 numBatchesProcessed;

        uint256 tallyCommitment;
        uint256 tallyBatchNum;
    }

    mapping (Poll => PptData) public pollPptData;

    IVerifier public verifier;

    constructor(
        IVerifier _verifier
    ) {
        verifier = _verifier;
    }

    function genProcessMessagesPackedVals(
        Poll _poll
    ) public view returns (uint256) {
        (
            // ignore the 1st and 3rd value
            ,
            uint256 maxVoteOptions,

        ) = _poll.maxValues();

        (uint8 mbs, ) = _poll.batchSizes();
        uint256 messageBatchSize = uint256(mbs);
        uint256 numSignUps = _poll.numSignUps();

        uint256 index = pollPptData[_poll].currentMessageBatchIndex;
        uint256 numMessages = _poll.numMessages();
        uint256 batchEndIndex = numMessages - index >= messageBatchSize ?
            index + messageBatchSize
            :
            numMessages - index - 1;

        uint256 result =
            maxVoteOptions +
            (numSignUps << uint256(50)) +
            (index << uint256(100)) +
            (batchEndIndex << uint256(150));

        return result;
    }

    modifier votingPeriodOver(Poll _poll) {
        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - _poll.deployTime();
        require(
            secondsPassed > _poll.duration(),
            ERROR_VOTING_PERIOD_NOT_PASSED
        );
        _;
    }

    function genProcessMessagesPublicInputs(
        Poll _poll,
        uint256 _messageRoot
    ) public view returns (uint256[] memory) {
        uint256 packedVals = genProcessMessagesPackedVals(_poll);
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = _poll.coordinatorPubKeyHash();
        input[2] = _messageRoot;
        input[3] = _poll.currentSbCommitment();
        uint256 inputHash = sha256Hash(input);

        uint256[] memory publicInputs = new uint256[](1);
        publicInputs[0] = inputHash;

        return publicInputs;
    }

    /*
     * Update the Poll's currentSbCommitment if the proof is valid.
     * @param _poll The poll to update
     * @param _newSbCommitment The new state root and ballot root commitment
     *                         after all messages are processed
     * @param _proof The zk-SNARK proof
     */
    function processMessages(
        Poll _poll,
        uint256 _newSbCommitment,
        uint256[8] memory _proof
    )
    public
    onlyOwner
    votingPeriodOver(_poll)
    {
        uint8 messageTreeDepth;
        uint8 voteOptionTreeDepth;
        (
            ,
            ,
            messageTreeDepth,
            voteOptionTreeDepth
        ) = _poll.treeDepths();

        // Require that the message queue has been merged
        uint256 messageRoot =
            _poll.messageAq().getMainRoot(messageTreeDepth);
        require(
            messageRoot != 0,
            ERROR_MESSAGE_AQ_NOT_MERGED
        );

        uint256 messageBatchSize;
        (messageBatchSize, ) = _poll.batchSizes();

        PptData memory data = pollPptData[_poll];

        // Require that unprocessed messages exist
        require(
            !data.processingComplete,
            ERROR_NO_MORE_MESSAGES
        );

        uint256 currentMessageBatchIndex = data.currentMessageBatchIndex;

        // Copy the state root and set the batch index if this is the
        // first batch to process
        if (data.numBatchesProcessed == 0) {
            uint256 numMessages = _poll.messageAq().numLeaves();
            currentMessageBatchIndex =
                (numMessages / messageBatchSize) * messageBatchSize;
        }

        VerifyingKey memory vk = _poll.maci().vkRegistry().getProcessVk(
            _poll.maci().stateTreeDepth(),
            messageTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize
        );

        { 
            // Curly brackets to avoid "Compiler error: Stack too deep, try
            // removing local variables."
            uint256[] memory publicInputs = genProcessMessagesPublicInputs(
                _poll,
                messageRoot
            );
            bool isValid = verifier.verify(_proof, vk, publicInputs);

            require(isValid, ERROR_INVALID_PROCESS_MESSAGE_PROOF);
        }

        {
            // Decrease the message batch start index to ensure that each
            // message batch is processed in order
            if (currentMessageBatchIndex > 0) {
                currentMessageBatchIndex -= messageBatchSize;
            }
            uint256 numMessages = _poll.numMessages();
            bool processingComplete =
                numMessages <= messageBatchSize * (data.numBatchesProcessed + 1);

            updatePollMessageProcessingData(
                _poll,
                _newSbCommitment,
                currentMessageBatchIndex,
                processingComplete
            );
        }
    }

    function updatePollMessageProcessingData(
        Poll _poll,
        uint256 _newSbCommitment,
        uint256 _currentMessageBatchIndex,
        bool _processingComplete
    ) internal {
        PptData memory data = pollPptData[_poll];

        data.sbCommitment = _newSbCommitment;

        data.processingComplete = _processingComplete;

        data.currentMessageBatchIndex = _currentMessageBatchIndex;

        data.numBatchesProcessed = data.numBatchesProcessed + 1;

        pollPptData[_poll] = data;
    }

    function genTallyVotesPackedVals(Poll _poll)
        public view returns (uint256) {
        
        ( , uint256 tallyBatchSize) = _poll.batchSizes(); 

        PptData memory data = pollPptData[_poll];
        uint256 batchStartIndex = data.tallyBatchNum * tallyBatchSize;

        uint256 result =
            batchStartIndex +
            (_poll.numSignUps() << uint256(50));

        return result;
    }

    function genTallyVotesPublicInputs(
        Poll _poll,
        uint256 _newTallyCommitment
    ) public view returns (uint256[] memory) {
        uint256 packedVals = genTallyVotesPackedVals(_poll);
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = _poll.currentSbCommitment();
        input[2] = _poll.currentTallyCommitment();
        input[3] = _newTallyCommitment;
        uint256 inputHash = sha256Hash(input);

        uint256[] memory publicInputs = new uint256[](1);
        publicInputs[0] = inputHash;

        return publicInputs;
    }

    function tallyVotes(
        Poll _poll,
        uint256 _newTallyCommitment,
        uint256[8] memory _proof
    )
    public
    onlyOwner
    votingPeriodOver(_poll)
    {
        PptData memory data = pollPptData[_poll];

        ( , uint256 tallyBatchSize) = _poll.batchSizes(); 

        uint256 batchStartIndex = data.tallyBatchNum * tallyBatchSize;
        uint256 numSignUps = _poll.numSignUps();

        require(
            batchStartIndex < numSignUps,
            ERROR_ALL_BALLOTS_TALLIED
        );

        // Require that all messages have been processed
        require(
            data.processingComplete,
            ERROR_PROCESSING_NOT_COMPLETE
        );

        uint8 intStateTreeDepth;
        uint8 voteOptionTreeDepth;
        (
            intStateTreeDepth,
            ,
            ,
            voteOptionTreeDepth
        ) = _poll.treeDepths();

        // Get the verifying key
        VerifyingKey memory vk = _poll.maci().vkRegistry().getTallyVk(
            _poll.maci().stateTreeDepth(),
            intStateTreeDepth,
            voteOptionTreeDepth
        );

        { 
            // Curly brackets to avoid "Compiler error: Stack too deep, try
            // removing local variables."

            // Get the public inputs
            uint256[] memory publicInputs = genTallyVotesPublicInputs(
                _poll,
                _newTallyCommitment
            );

            // Verify the proof
            bool isValid = verifier.verify(_proof, vk, publicInputs);

            require(isValid, ERROR_INVALID_TALLY_VOTES_PROOF);
        }

        // Update the tally commitment and the tally batch num
        data.tallyCommitment = _newTallyCommitment;
        data.tallyBatchNum = data.tallyBatchNum + 1;
        pollPptData[_poll] = data;
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
        uint256,              // coordinatorPubKeyHash
        uint256,              // duration
        VkSigs memory,        // VkSigs
        AccQueue,             // messageAq
        MaxValues memory,     // maxValues
        TreeDepths memory,    // treeDepths
        BatchSizes memory     // batchSizes
    ){
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
            _poll.coordinatorPubKeyHash(),
            _poll.duration(),
            vkSigs,
            messageAq,
            maxValues,
            treeDepths,
            batchSizes
        );
    }
}
