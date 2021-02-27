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
contract PollFactory is Params, IPubKey, IMessage, Ownable, Hasher, PollDeploymentParams {

    MessageAqFactory public messageAqFactory;

    function setMessageAqFactory(MessageAqFactory _messageAqFactory)
    public
    onlyOwner {
        messageAqFactory = _messageAqFactory;
    }

    /*
     * Deploy a new Poll contract and AccQueue contract for messages.
     */
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
        PollProcessorAndTallyer _ppt
    ) public onlyOwner returns (Poll) {
        {
        uint8 treeArity = 5;

        // Validate _maxValues
        require(
            _maxValues.maxMessages <= treeArity ** _treeDepths.messageTreeDepth &&
            _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
            _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
            _maxValues.maxVoteOptions <= treeArity ** _treeDepths.voteOptionTreeDepth,
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
            _coordinatorPubKey,
            extContracts,
            _ppt
        );

        messageAq.transferOwnership(address(poll));

        poll.transferOwnership(_pollOwner);

        return poll;
    }
}

/*
 * Do not deploy this directly. Use PollFactory.deploy() which performs some
 * checks on the Poll constructor arguments.
 */
contract Poll is Params, Hasher, IMessage, IPubKey, SnarkCommon, Ownable, PollDeploymentParams, EmptyBallotRoots {
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

    // Whether the MACI contract's stateAq has been merged by this contract
    bool public stateAqMerged;

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
    string constant ERROR_MAX_MESSAGES_REACHED = "PollE07";
    string constant ERROR_STATE_AQ_ALREADY_MERGED = "PollE08";

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
        ExtContracts memory _extContracts,
        PollProcessorAndTallyer _ppt
    ) {
        VkRegistry _vkRegistry = _extContracts.vkRegistry;
        IMACI _maci = _extContracts.maci;
        AccQueue _messageAq = _extContracts.messageAq;

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
        ppt = _ppt;
    }

    /*
     * A modifier that causes the function to revert if the voting period is
     * over.
     */
    modifier isBeforeVotingDeadline() {
        uint256 secondsPassed = block.timestamp - deployTime;
        require(
            secondsPassed <= duration,
            ERROR_VOTING_PERIOD_PASSED
        );
        _;
    }

    /*
     * A modifier that causes the function to revert if the voting period is
     * not over.
     */
    modifier isAfterVotingDeadline() {
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
            numMessages <= maxValues.maxMessages,
            ERROR_MAX_MESSAGES_REACHED
        );
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
     * The first step of merging the MACI state AccQueue. This allows the
     * ProcessMessages circuit to access the latest state tree and ballots via
     * currentSbCommitment.
     * TODO: consider an attack where someone signs up repeatedly while the
     * subroots are being merged. With a good signup gatekeeper, however, this
    * is unlikely to succeed in DDOSing the process.
     */
    function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps)
    public
    onlyOwner
    isAfterVotingDeadline {
        // This function can only be called once per Poll
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        if (!maci.stateAq().subTreesMerged()) {
            maci.mergeStateAqSubRoots(_numSrQueueOps);
        }
        
        if (numSignUps == 0) {
            numSignUps = maci.numSignUps();
        }

    }

    /*
     * The second step of merging the MACI state AccQueue. This allows the
     * ProcessMessages circuit to access the latest state tree and ballots via
     * currentSbCommitment.
     */
    function mergeMaciStateAq()
    public
    onlyOwner
    isAfterVotingDeadline {
        // This function can only be called once per Poll after the voting
        // deadline
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        // TODO: remove this redundant check?
        require(currentSbCommitment == 0, ERROR_SB_COMMITMENT_NOT_SET);

        if (!maci.stateAq().subTreesMerged()) {
            maci.mergeStateAq();
        }
        stateAqMerged = true;

        // Set currentSbCommitment
        uint256[] memory sb = new uint256[](3);
        sb[0] = maci.getStateAqRoot();
        sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth];
        sb[2] = uint256(0);

        currentSbCommitment = hash3(sb);
    }

    /*
     * The first step in merging the message AccQueue so that the
     * ProcessMessages circuit can access the message root.
     */
    function mergeMessageAqSubRoots(uint256 _numSrQueueOps)
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.mergeSubRoots(_numSrQueueOps);
    }

    /*
     * The second step in merging the message AccQueue so that the
     * ProcessMessages circuit can access the message root.
     */
    function mergeMessageAq()
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.merge(treeDepths.messageTreeDepth);
    }

    /*
     * Enqueue a batch of messages.
     */
    function batchEnqueueMessage(uint256 _messageSubRoot)
    public
    onlyOwner
    isAfterVotingDeadline {
        messageAq.insertSubTree(_messageSubRoot);
        // TODO: emit event
    }
}

contract PollProcessorAndTallyer is Ownable, SnarkCommon, Hasher, IPubKey {
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "PptE01";
    string constant ERROR_NO_MORE_MESSAGES = "PptE02";
    string constant ERROR_MESSAGE_AQ_NOT_MERGED = "PptE03";
    string constant ERROR_INVALID_STATE_ROOT_SNAPSHOT_TIMESTAMP = "PptE04";
    string constant ERROR_INVALID_PROCESS_MESSAGE_PROOF = "PptE05";
    string constant ERROR_INVALID_TALLY_VOTES_PROOF = "PptE06";
    string constant ERROR_PROCESSING_NOT_COMPLETE = "PptE07";
    string constant ERROR_ALL_BALLOTS_TALLIED = "PptE08";
    string constant ERROR_STATE_AQ_NOT_MERGED = "PptE09";

    uint256 public sbCommitment;

    // The current message batch index. When the coordinator runs
    // processMessages(), this action relates to messages
    // currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
    uint256 public currentMessageBatchIndex;

    // Whether there are unprocessed messages left
    bool public processingComplete;

    // The number of batches processed
    uint256 public numBatchesProcessed;

    uint256 public tallyCommitment;
    uint256 public tallyBatchNum;

    IVerifier public verifier;

    constructor(
        IVerifier _verifier
    ) {
        verifier = _verifier;
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

    /*
     * One of the inputs to the ProcessMessages circuit is a 250-bit
     * representation of four 50-bit values. This function generates this
     * 250-bit value, which consists of the maximum number of vote options, the
     * number of signups, the current message batch index, and the end index of
    * the current batch.
     */
    function genProcessMessagesPackedVals(
        Poll _poll,
        uint256 _numSignUps
    ) public view returns (uint256) {
        (
            , // ignore the 1st value
            uint256 maxVoteOptions
        ) = _poll.maxValues();

        (uint8 mbs, ) = _poll.batchSizes();
        uint256 messageBatchSize = uint256(mbs);

        uint256 index = currentMessageBatchIndex;
        uint256 numMessages = _poll.numMessages();
        uint256 batchEndIndex = numMessages - index >= messageBatchSize ?
            index + messageBatchSize
            :
            numMessages - index - 1;

        // TODO: ensure that each value is less than or equal to 2 ** 50

        uint256 result =
            maxVoteOptions +
            (_numSignUps << uint256(50)) +
            (index << uint256(100)) +
            (batchEndIndex << uint256(150));

        return result;
    }

    /*
     * Returns the SHA256 hash of the packed values (see
     * genProcessMessagesPackedVals), the hash of the coordinator's public key,
     * the message root, and the commitment to the current state root and
     * ballot root. By passing the SHA256 hash of these values to the circuit
     * as a single public input and the preimage as private inputs, we reduce
     * its verification gas cost though the number of constraints will be
     * higher and proving time will be higher.
     */
    function genProcessMessagesPublicInputs(
        Poll _poll,
        uint256 _messageRoot,
        uint256 _numSignUps
    ) public view returns (uint256[] memory) {
        (uint256 coordinatorPubKeyX, uint256 coordinatorPubKeyY) = _poll.coordinatorPubKey();
        uint256 coordinatorPubKeyHash = hashLeftRight(coordinatorPubKeyX, coordinatorPubKeyY);

        uint256 packedVals = genProcessMessagesPackedVals(_poll, _numSignUps);

        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = coordinatorPubKeyHash;
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
        require(_poll.stateAqMerged(), ERROR_STATE_AQ_NOT_MERGED);
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

        // Require that unprocessed messages exist
        require(
            !processingComplete,
            ERROR_NO_MORE_MESSAGES
        );

        // Copy the state root and set the batch index if this is the
        // first batch to process
        if (numBatchesProcessed == 0) {
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
            uint256 numSignUps = _poll.numSignUps();
            // Curly brackets to avoid "Compiler error: Stack too deep, try
            // removing local variables."
            uint256[] memory publicInputs = genProcessMessagesPublicInputs(
                _poll,
                messageRoot,
                numSignUps
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
            bool pc =
                numMessages <= messageBatchSize * (numBatchesProcessed + 1);

            updateMessageProcessingData(
                _newSbCommitment,
                currentMessageBatchIndex,
                pc
            );
        }
    }

    function updateMessageProcessingData(
        uint256 _newSbCommitment,
        uint256 _currentMessageBatchIndex,
        bool _processingComplete
    ) internal {
        sbCommitment = _newSbCommitment;
        processingComplete = _processingComplete;
        currentMessageBatchIndex = _currentMessageBatchIndex;
        numBatchesProcessed ++;
    }

    /*
     * Pack the batch start index and number of signups into a 100-bit value.
     */
    function genTallyVotesPackedVals(Poll _poll)
        public view returns (uint256) {
        
        ( , uint256 tallyBatchSize) = _poll.batchSizes(); 

        uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;

        // TODO: ensure that each value is less than or equal to 2 ** 50
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

        ( , uint256 tallyBatchSize) = _poll.batchSizes(); 

        uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;
        uint256 numSignUps = _poll.numSignUps();

        // Require that all messages have been processed
        require(
            processingComplete,
            ERROR_PROCESSING_NOT_COMPLETE
        );

        // Require that there are untalied ballots left
        require(
            batchStartIndex < numSignUps,
            ERROR_ALL_BALLOTS_TALLIED
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
        tallyCommitment = _newTallyCommitment;
        tallyBatchNum ++;
    }
}
