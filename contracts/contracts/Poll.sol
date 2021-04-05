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
import { AccQueue, AccQueueQuinaryMaci } from "./trees/AccQueue.sol";
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
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        VkRegistry _vkRegistry,
        IMACI _maci,
        address _pollOwner
    ) public onlyOwner returns (Poll) {
        uint8 treeArity = 5;

        // Validate _maxValues
        // NOTE: these checks may not be necessary. Removing them will save
        // 0.28 Kb of bytecode.

        // maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
        // it will be packed as a 50-bit value along with other values as one
        // of the inputs (aka packedVal)

        require(
            _maxValues.maxMessages <= treeArity ** _treeDepths.messageTreeDepth &&
            _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
            _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
            _maxValues.maxVoteOptions <= treeArity ** _treeDepths.voteOptionTreeDepth &&
            _maxValues.maxVoteOptions < (2 ** 50),
            "PollFactory: invalid _maxValues"
        );

        AccQueue messageAq =
            messageAqFactory.deploy(_treeDepths.messageTreeSubDepth);

        ExtContracts memory extContracts;
        extContracts.vkRegistry = _vkRegistry;
        extContracts.maci = _maci;
        extContracts.messageAq = messageAq;

        Poll poll = new Poll(
            _duration,
            _maxValues,
            _treeDepths,
            _batchSizes,
            _coordinatorPubKey,
            extContracts
        );

        // Make the Poll contract own the messageAq contract, so only it can
        // run enqueue/merge
        messageAq.transferOwnership(address(poll));

        // TODO: should this be _maci.owner() instead?
        poll.transferOwnership(_pollOwner);

        return poll;
    }
}

/*
 * Do not deploy this directly. Use PollFactory.deploy() which performs some
 * checks on the Poll constructor arguments.
 */
contract Poll is 
    Params, Hasher, IMessage, IPubKey, SnarkCommon, Ownable,
    PollDeploymentParams, EmptyBallotRoots {

    // The coordinator's public key
    PubKey public coordinatorPubKey;

    uint256 public coordinatorPubKeyHash;

    // TODO: to reduce the Poll bytecode size, consider storing deployTime and
    // duration in a mapping in the MACI contract

    // The timestamp of the block at which the Poll was deployed
    uint256 internal deployTime;

    // The duration of the polling period, in seconds
    uint256 internal duration;

    function getDeployTimeAndDuration() public view returns (uint256, uint256) {
        return (deployTime, duration);
    }

    // Whether the MACI contract's stateAq has been merged by this contract
    bool public stateAqMerged;

    // The commitment to the state leaves and the ballots. This is
    // hash3(stateRoot, ballotRoot, salt).
    // Its initial value should be
    // hash(maciStateRootSnapshot, emptyBallotRoot, 0)
    // Each successful invocation of processMessages() should use a different
    // salt to update this value, so that an external observer cannot tell in
    // the case that none of the messages are valid.
    uint256 internal currentSbCommitment;

    // The commitment to the tally results. Its initial value should be:
    // hash3(
    //   hashLeftRight(merkleRoot([0...0], 0),
    //   hashLeftRight(0, 0),
    //   hashLeftRight(merkleRoot([0...0]), 0)
    // )
    // Where [0...0] is an array of 0s, TREE_ARITY ** voteOptionTreeDepth long

    // TODO: set this to 0?
    uint256 internal currentTallyCommitment = 
        0x17e1b6993b1af9f8dfe8d4202c2f2a610994ff19b92462f9a54da39d11026d6b;

    uint256 internal numSignUps;
    uint256 internal numMessages;

    function numSignUpsAndMessages() public view returns (uint256, uint256) {
        return (numSignUps, numMessages);
    }

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
    string constant ERROR_MAX_MESSAGES_REACHED = "PollE06";
    string constant ERROR_STATE_AQ_ALREADY_MERGED = "PollE07";

    event PublishMessage(Message _message, PubKey _encPubKey);
    event MergeMaciStateAqSubRoots(uint256 _numSrQueueOps);
    event MergeMaciStateAq(uint256 _stateRoot);
    event MergeMessageAqSubRoots(uint256 _numSrQueueOps);
    event MergeMessageAq(uint256 _messageRoot);

    ExtContracts public extContracts;

    /*
     * Each MACI instance can have multiple Polls.
     * When a Poll is deployed, its voting period starts immediately.
     */
    constructor(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        ExtContracts memory _extContracts
    ) {

        extContracts = _extContracts;

        coordinatorPubKey = _coordinatorPubKey;
        coordinatorPubKeyHash = hashLeftRight(_coordinatorPubKey.x, _coordinatorPubKey.y);
        duration = _duration;
        maxValues = _maxValues;
        batchSizes = _batchSizes;
        treeDepths = _treeDepths;

        // Record the current timestamp
        deployTime = block.timestamp;
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
     * Gets the currentSbCommitment and currentTallyCommitment storage
     * variables, which are internal so as to minimise the Poll bytecode size.
     */
    function currentSbAndTallyCommitments()
    public
    view
    returns (uint256, uint256) {
        return (currentSbCommitment, currentTallyCommitment);
    }

    /*
     * Allows anyone to publish a message (an encrypted command and signature).
     * This function also enqueues the message.
     * @param _message The message to publish
     * @param _encPubKey An epheremal public key which can be combined with the
     *     coordinator's private key to generate an ECDH shared key with which
     *     to encrypt the message.
     */
    function publishMessage(
        Message memory _message,
        PubKey memory _encPubKey
    ) public {
        uint256 secondsPassed = block.timestamp - deployTime;
        require(
            secondsPassed <= duration,
            ERROR_VOTING_PERIOD_PASSED
        );
        require(
            numMessages <= maxValues.maxMessages,
            ERROR_MAX_MESSAGES_REACHED
        );
        require(
            _encPubKey.x < SNARK_SCALAR_FIELD &&
            _encPubKey.y < SNARK_SCALAR_FIELD,
            ERROR_INVALID_PUBKEY
        );
        uint256 messageLeaf = hashMessageAndEncPubKey(_message, _encPubKey);
        extContracts.messageAq.enqueue(messageLeaf);
        numMessages ++;

        emit PublishMessage(_message, _encPubKey);
    }

    function hashMessageAndEncPubKey(
        Message memory _message,
        PubKey memory _encPubKey
    ) public pure returns (uint256) {
        uint256[5] memory n;
        n[0] = _message.iv;
        n[1] = _message.data[0];
        n[2] = _message.data[1];
        n[3] = _message.data[2];
        n[4] = _message.data[3];

        uint256[5] memory m;
        m[0] = _message.data[4];
        m[1] = _message.data[5];
        m[2] = _message.data[6];
        m[3] = _encPubKey.x;
        m[4] = _encPubKey.y;

        return hashLeftRight(
            hash5(n),
            hash5(m)
        );
    }

    /*
     * The first step of merging the MACI state AccQueue. This allows the
     * ProcessMessages circuit to access the latest state tree and ballots via
     * currentSbCommitment.
     */
    function mergeMaciStateAqSubRoots(
        uint256 _numSrQueueOps,
        uint256 _pollId
    )
    public
    onlyOwner
    isAfterVotingDeadline {
        // This function can only be called once per Poll
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        if (!extContracts.maci.stateAq().subTreesMerged()) {
            extContracts.maci.mergeStateAqSubRoots(_numSrQueueOps, _pollId);
        }
        
        if (numSignUps == 0) {
            numSignUps = extContracts.maci.numSignUps();
        }

        emit MergeMaciStateAqSubRoots(_numSrQueueOps);
    }

    /*
     * The second step of merging the MACI state AccQueue. This allows the
     * ProcessMessages circuit to access the latest state tree and ballots via
     * currentSbCommitment.
     */
    function mergeMaciStateAq(
        uint256 _pollId
    )
    public
    onlyOwner
    isAfterVotingDeadline {
        // This function can only be called once per Poll after the voting
        // deadline
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        if (extContracts.maci.stateAq().subTreesMerged()) {
            extContracts.maci.mergeStateAq(_pollId);
        }
        stateAqMerged = true;

        uint256 stateRoot = extContracts.maci.getStateAqRoot();
        // Set currentSbCommitment
        uint256[3] memory sb;
        sb[0] = stateRoot;
        sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth];
        sb[2] = uint256(0);

        currentSbCommitment = hash3(sb);
        emit MergeMaciStateAq(stateRoot);
    }

    /*
     * The first step in merging the message AccQueue so that the
     * ProcessMessages circuit can access the message root.
     */
    function mergeMessageAqSubRoots(uint256 _numSrQueueOps)
    public
    onlyOwner
    isAfterVotingDeadline {
        extContracts.messageAq.mergeSubRoots(_numSrQueueOps);
        emit MergeMessageAqSubRoots(_numSrQueueOps);
    }

    /*
     * The second step in merging the message AccQueue so that the
     * ProcessMessages circuit can access the message root.
     */
    function mergeMessageAq()
    public
    onlyOwner
    isAfterVotingDeadline {
        uint256 root = extContracts.messageAq.merge(treeDepths.messageTreeDepth);
        emit MergeMessageAq(root);
    }

    /*
     * Enqueue a batch of messages.
     */
    function batchEnqueueMessage(uint256 _messageSubRoot)
    public
    onlyOwner
    isAfterVotingDeadline {
        extContracts.messageAq.insertSubTree(_messageSubRoot);
        // TODO: emit event
    }
}

contract PollProcessorAndTallyer is
    Ownable, SnarkCommon, SnarkConstants, IPubKey, PollDeploymentParams{

    // Error codes
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "PptE01";
    string constant ERROR_NO_MORE_MESSAGES = "PptE02";
    string constant ERROR_MESSAGE_AQ_NOT_MERGED = "PptE03";
    string constant ERROR_INVALID_STATE_ROOT_SNAPSHOT_TIMESTAMP = "PptE04";
    string constant ERROR_INVALID_PROCESS_MESSAGE_PROOF = "PptE05";
    string constant ERROR_INVALID_TALLY_VOTES_PROOF = "PptE06";
    string constant ERROR_PROCESSING_NOT_COMPLETE = "PptE07";
    string constant ERROR_ALL_BALLOTS_TALLIED = "PptE08";
    string constant ERROR_STATE_AQ_NOT_MERGED = "PptE09";

    // The commitment to the state and ballot roots
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
        (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();
        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - deployTime;
        require(
            secondsPassed > duration,
            ERROR_VOTING_PERIOD_NOT_PASSED
        );
        _;
    }

    /*
     * Hashes an array of values using SHA256 and returns its modulo with the
     * snark scalar field. This function is used to hash inputs to circuits,
     * where said inputs would otherwise be public inputs. As such, the only
     * public input to the circuit is the SHA256 hash, and all others are
     * private inputs. The circuit will verify that the hash is valid. Doing so
     * saves a lot of gas during verification, though it makes the circuit take
     * up more constraints.
     */
    function sha256Hash(uint256[] memory array) public pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(array))) % SNARK_SCALAR_FIELD;
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
        uint256 numMessages;
        (, numMessages) = _poll.numSignUpsAndMessages();
        uint256 batchEndIndex = numMessages - index >= messageBatchSize ?
            index + messageBatchSize
            :
            numMessages - index - 1;

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
    function genProcessMessagesPublicInputHash(
        Poll _poll,
        uint256 _messageRoot,
        uint256 _numSignUps,
        uint256 _newSbCommitment
    ) public view returns (uint256) {
        uint256 coordinatorPubKeyHash = _poll.coordinatorPubKeyHash();

        uint256 packedVals = genProcessMessagesPackedVals(_poll, _numSignUps);
        uint256 currentSbCommitment;
        (currentSbCommitment,) = _poll.currentSbAndTallyCommitments();

        (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();

        uint256[] memory input = new uint256[](6);
        input[0] = packedVals;
        input[1] = coordinatorPubKeyHash;
        input[2] = _messageRoot;
        input[3] = currentSbCommitment;
        input[4] = _newSbCommitment;
        input[5] = deployTime + duration;
        uint256 inputHash = sha256Hash(input);

        return inputHash;
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

        AccQueue messageAq;
        (, , messageAq) = _poll.extContracts();

        // Require that the message queue has been merged
        uint256 messageRoot =
            messageAq.getMainRoot(messageTreeDepth);
        require(
            messageRoot != 0,
            ERROR_MESSAGE_AQ_NOT_MERGED
        );

        (uint256 messageBatchSize, ) = _poll.batchSizes();

        // Require that unprocessed messages exist
        require(
            !processingComplete,
            ERROR_NO_MORE_MESSAGES
        );

        // Copy the state root and set the batch index if this is the
        // first batch to process
        if (numBatchesProcessed == 0) {
            uint256 numMessages = messageAq.numLeaves();
            currentMessageBatchIndex =
                (numMessages / messageBatchSize) * messageBatchSize;
        }


        {
            verifyProcessProof(
                _poll,
                messageRoot,
                messageTreeDepth,
                voteOptionTreeDepth,
                _newSbCommitment,
                _proof
            );
        }

        {
            (, uint256 numMessages) = _poll.numSignUpsAndMessages();
            // Decrease the message batch start index to ensure that each
            // message batch is processed in order
            if (currentMessageBatchIndex > 0) {
                currentMessageBatchIndex -= messageBatchSize;
            }

            updateMessageProcessingData(
                _newSbCommitment,
                currentMessageBatchIndex,
                numMessages <= messageBatchSize * (numBatchesProcessed + 1)
            );
        }
    }

    function verifyProcessProof(
        Poll _poll,
        uint256 _messageRoot,
        uint256 _messageTreeDepth,
        uint256 _voteOptionTreeDepth,
        uint256 _newSbCommitment,
        uint256[8] memory _proof
    ) internal view {
        (uint256 messageBatchSize, ) = _poll.batchSizes();
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();
        uint256 publicInputHash = genProcessMessagesPublicInputHash(
            _poll,
            _messageRoot,
            numSignUps,
            _newSbCommitment
        );
        (VkRegistry vkRegistry, IMACI maci, ) = _poll.extContracts();
        VerifyingKey memory vk = vkRegistry.getProcessVk(
            maci.stateTreeDepth(),
            _messageTreeDepth,
            _voteOptionTreeDepth,
            messageBatchSize
        );
        bool isValid = verifier.verify(_proof, vk, publicInputHash);
        require(isValid, ERROR_INVALID_PROCESS_MESSAGE_PROOF);
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
        (uint256 numSignUps,) = _poll.numSignUpsAndMessages();

        // TODO: ensure that each value is less than or equal to 2 ** 50
        uint256 result =
            batchStartIndex +
            numSignUps << uint256(50);

        return result;
    }

    function genTallyVotesPublicInputHash(
        Poll _poll,
        uint256 _newTallyCommitment
    ) public view returns (uint256) {
        uint256 currentSbCommitment;
        uint256 currentTallyCommitment;
        (currentSbCommitment, currentTallyCommitment) = _poll.currentSbAndTallyCommitments();

        uint256 packedVals = genTallyVotesPackedVals(_poll);
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = currentSbCommitment;
        input[2] = currentTallyCommitment;
        input[3] = _newTallyCommitment;
        uint256 inputHash = sha256Hash(input);
        return inputHash;
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
        uint256 numSignUps;
        (numSignUps,) = _poll.numSignUpsAndMessages();

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

        { 
            verifyTallyProof(_poll, _proof, _newTallyCommitment);
        }

        // Update the tally commitment and the tally batch num
        tallyCommitment = _newTallyCommitment;
        tallyBatchNum ++;
    }

    function verifyTallyProof(
        Poll _poll,
        uint256[8] memory _proof,
        uint256 _newTallyCommitment
    ) internal view {
        (
            uint8 intStateTreeDepth,
            ,
            ,
            uint8 voteOptionTreeDepth
        ) = _poll.treeDepths();

        (VkRegistry vkRegistry, IMACI maci, ) = _poll.extContracts();

        // Get the verifying key
        VerifyingKey memory vk = vkRegistry.getTallyVk(
            maci.stateTreeDepth(),
            intStateTreeDepth,
            voteOptionTreeDepth
        );

        // Get the public inputs
        uint256 publicInputHash = genTallyVotesPublicInputHash(
            _poll,
            _newTallyCommitment
        );


        // Verify the proof
        bool isValid = verifier.verify(_proof, vk, publicInputHash);
        require(isValid, ERROR_INVALID_TALLY_VOTES_PROOF);
    }
}
