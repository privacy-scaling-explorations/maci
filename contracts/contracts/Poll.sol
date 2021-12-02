// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { IMACI } from "./IMACI.sol";
import { Params } from "./Params.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { Verifier } from "./crypto/Verifier.sol";
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
        uint256 treeArity = 5;

        // Validate _maxValues
        // NOTE: these checks may not be necessary. Removing them will save
        // 0.28 Kb of bytecode.

        // maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
        // it will be packed as a 50-bit value along with other values as one
        // of the inputs (aka packedVal)

        require(
            _maxValues.maxMessages <= treeArity ** uint256(_treeDepths.messageTreeDepth) &&
            _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
            _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
            _maxValues.maxVoteOptions <= treeArity ** uint256(_treeDepths.voteOptionTreeDepth) &&
            _maxValues.maxVoteOptions < (2 ** 50),
            "PollFactory: invalid _maxValues"
        );

        AccQueue messageAq =
            messageAqFactory.deploy(_treeDepths.messageTreeSubDepth);

        ExtContracts memory extContracts;

        // TODO: remove _vkRegistry; only PollProcessorAndTallyer needs it
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

    uint256 public mergedStateRoot;
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
    uint256 public currentSbCommitment;

    uint256 internal numMessages;

    function numSignUpsAndMessages() public view returns (uint256, uint256) {
        uint numSignUps = extContracts.maci.numSignUps();
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
    string constant ERROR_STATE_AQ_SUBTREES_NEED_MERGE = "PollE08";

    uint8 private constant LEAVES_PER_NODE = 5;

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

    function isAfterDeadline() public view returns (bool) {
        uint256 secondsPassed = block.timestamp - deployTime;
        return secondsPassed > duration;
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
        n[0] = _message.data[0];
        n[1] = _message.data[1];
        n[2] = _message.data[2];
        n[3] = _message.data[3];
        n[4] = _message.data[4];

        uint256[5] memory m;
        m[0] = _message.data[5];
        m[1] = _message.data[6];
        m[2] = _message.data[7];
        m[3] = _message.data[8];
        m[4] = _message.data[9];

        return hash4([
            hash5(n),
            hash5(m),
            _encPubKey.x,
            _encPubKey.y
        ]);
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

        require(extContracts.maci.stateAq().subTreesMerged(), ERROR_STATE_AQ_SUBTREES_NEED_MERGE);
        extContracts.maci.mergeStateAq(_pollId);

        stateAqMerged = true;

        mergedStateRoot = extContracts.maci.getStateAqRoot();
        // Set currentSbCommitment
        uint256[3] memory sb;
        sb[0] = mergedStateRoot;
        sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
        sb[2] = uint256(0);

        currentSbCommitment = hash3(sb);
        emit MergeMaciStateAq(mergedStateRoot);
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

    /*
    * @notice Verify the number of spent voice credits from the tally.json
    * @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
    * @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
    * @return valid a boolean representing successful verification
    */
    function verifySpentVoiceCredits(
        uint256 _totalSpent,
        uint256 _totalSpentSalt
    ) public view returns (bool) {
        uint256 ballotRoot = hashLeftRight(_totalSpent, _totalSpentSalt);
        return ballotRoot == emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
    }

    /*
    * @notice Verify the number of spent voice credits per vote option from the tally.json
    * @param _voteOptionIndex the index of the vote option where credits were spent
    * @param _spent the spent voice credits for a given vote option index
    * @param _spentProof proof generated for the perVOSpentVoiceCredits
    * @param _salt the corresponding salt given in the tally perVOSpentVoiceCredits object
    * @return valid a boolean representing successful verification
    */
    function verifyPerVOSpentVoiceCredits(
        uint256 _voteOptionIndex,
        uint256 _spent,
        uint256[][] memory _spentProof,
        uint256 _spentSalt
    ) public view returns (bool) {
         uint256 computedRoot = computeMerkleRootFromPath(
            treeDepths.voteOptionTreeDepth,
            _voteOptionIndex,
            _spent,
            _spentProof
        );

        uint256 ballotRoot = hashLeftRight(computedRoot, _spentSalt);

        uint256[3] memory sb;
        sb[0] = mergedStateRoot;
        sb[1] = ballotRoot;
        sb[2] = uint256(0);

        return currentSbCommitment == hash3(sb);
    }

    /*
    * @notice Verify the result generated of the tally.json
    * @param _voteOptionIndex the index of the vote option to verify the correctness of the tally
    * @param _tallyResult Flattened array of the tally 
    * @param _tallyResultProof Corresponding proof of the tally result
    * @param _tallyResultSalt the respective salt in the results object in the tally.json
    * @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt) 
    * @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
    * @param _tallyCommitment newTallyCommitment field in the tally.json
    * @return valid a boolean representing successful verification
    */
    function verifyTallyResult(
        uint256 _voteOptionIndex,
        uint256 _tallyResult,
        uint256[][] memory _tallyResultProof,
        uint256 _spentVoiceCreditsHash,
        uint256 _perVOSpentVoiceCreditsHash,
        uint256 _tallyCommitment
    ) public view returns (bool){
         uint256 computedRoot = computeMerkleRootFromPath(
            treeDepths.voteOptionTreeDepth,
            _voteOptionIndex,
            _tallyResult,
            _tallyResultProof
        );

        uint256[3] memory tally;
        tally[0] = computedRoot;
        tally[1] = _spentVoiceCreditsHash;
        tally[2] = _perVOSpentVoiceCreditsHash;

        return hash3(tally) == _tallyCommitment;
    }


    function computeMerkleRootFromPath(
        uint8 _depth,
        uint256 _index,
        uint256 _leaf,
        uint256[][] memory _pathElements
    ) internal pure returns (uint256) {
        uint256 pos = _index % LEAVES_PER_NODE;
        uint256 current = _leaf;
        uint8 k;

        uint256[LEAVES_PER_NODE] memory level;

        for (uint8 i = 0; i < _depth; i ++) {
            for (uint8 j = 0; j < LEAVES_PER_NODE; j ++) {
                if (j == pos) {
                    level[j] = current;
                } else {
                    if (j > pos) {
                        k = j - 1;
                    } else {
                        k = j;
                    }
                    level[j] = _pathElements[i][k];
                }
            }

            _index /= LEAVES_PER_NODE;
            pos = _index % LEAVES_PER_NODE;
            current = hash5(level);
        }
        return current;
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

    // The commitment to the tally results. Its initial value is 0, but after
    // the tally of each batch is proven on-chain via a zk-SNARK, it should be
    // updated to:
    //
    // hash3(
    //   hashLeftRight(merkle root of current results, salt0)
    //   hashLeftRight(number of spent voice credits, salt1),
    //   hashLeftRight(merkle root of the no. of spent voice credits per vote option, salt2)
    // )
    //
    // Where each salt is unique and the merkle roots are of arrays of leaves
    // TREE_ARITY ** voteOptionTreeDepth long.
    uint256 public tallyCommitment;

    uint256 public tallyBatchNum;

    Verifier public verifier;

    constructor(
        Verifier _verifier
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
        // There must be unprocessed messages
        require(!processingComplete, ERROR_NO_MORE_MESSAGES);

        // The state AccQueue must be merged
        require(_poll.stateAqMerged(), ERROR_STATE_AQ_NOT_MERGED);

        // Retrieve stored vals
        ( , , uint8 messageTreeDepth, ) = _poll.treeDepths();
        (uint256 messageBatchSize, ) = _poll.batchSizes();

        AccQueue messageAq;
        (, , messageAq) = _poll.extContracts();

        // Require that the message queue has been merged
        uint256 messageRoot = messageAq.getMainRoot(messageTreeDepth);
        require(messageRoot != 0, ERROR_MESSAGE_AQ_NOT_MERGED);

        // Copy the state and ballot commitment and set the batch index if this
        // is the first batch to process
        if (numBatchesProcessed == 0) {
            uint256 currentSbCommitment = _poll.currentSbCommitment();
            sbCommitment = currentSbCommitment;
            (, uint256 numMessages) = _poll.numSignUpsAndMessages();
            uint256 r = numMessages % messageBatchSize;

            if (r == 0) {
                currentMessageBatchIndex =
                    (numMessages / messageBatchSize) * messageBatchSize;
            } else {
                currentMessageBatchIndex = numMessages;
            }

            if (currentMessageBatchIndex > 0) {
                if (r == 0) {
                    currentMessageBatchIndex -= messageBatchSize;
                } else {
                    currentMessageBatchIndex -= r;
                }
            }
        }

        bool isValid = verifyProcessProof(
            _poll,
            currentMessageBatchIndex,
            messageRoot,
            sbCommitment,
            _newSbCommitment,
            _proof
        );
        require(isValid, ERROR_INVALID_PROCESS_MESSAGE_PROOF);

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
        uint256 _currentMessageBatchIndex,
        uint256 _messageRoot,
        uint256 _currentSbCommitment,
        uint256 _newSbCommitment,
        uint256[8] memory _proof
    ) internal view returns (bool) {

        ( , , uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = _poll.treeDepths();
        (uint256 messageBatchSize, ) = _poll.batchSizes();
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();
        (VkRegistry vkRegistry, IMACI maci, ) = _poll.extContracts();

        // Calculate the public input hash (a SHA256 hash of several values)
        uint256 publicInputHash = genProcessMessagesPublicInputHash(
            _poll,
            _currentMessageBatchIndex,
            _messageRoot,
            numSignUps,
            _currentSbCommitment,
            _newSbCommitment
        );

        // Get the verifying key from the VkRegistry
        VerifyingKey memory vk = vkRegistry.getProcessVk(
            maci.stateTreeDepth(),
            messageTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize
        );

        return verifier.verify(_proof, vk, publicInputHash);
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
        uint256 _currentMessageBatchIndex,
        uint256 _messageRoot,
        uint256 _numSignUps,
        uint256 _currentSbCommitment,
        uint256 _newSbCommitment
    ) public view returns (uint256) {
        uint256 coordinatorPubKeyHash = _poll.coordinatorPubKeyHash();

        uint256 packedVals = genProcessMessagesPackedVals(
            _poll,
            _currentMessageBatchIndex,
            _numSignUps
        );

        (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();

        uint256[] memory input = new uint256[](6);
        input[0] = packedVals;
        input[1] = coordinatorPubKeyHash;
        input[2] = _messageRoot;
        input[3] = _currentSbCommitment;
        input[4] = _newSbCommitment;
        input[5] = deployTime + duration;
        uint256 inputHash = sha256Hash(input);

        return inputHash;
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
        uint256 _currentMessageBatchIndex,
        uint256 _numSignUps
    ) public view returns (uint256) {
        (, uint256 maxVoteOptions) = _poll.maxValues();
        (, uint256 numMessages) = _poll.numSignUpsAndMessages();
        (uint8 mbs, ) = _poll.batchSizes();
        uint256 messageBatchSize = uint256(mbs);

        uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;
        if (batchEndIndex > numMessages) {
            batchEndIndex = numMessages;
        }

        uint256 result =
            maxVoteOptions +
            (_numSignUps << uint256(50)) +
            (_currentMessageBatchIndex << uint256(100)) +
            (batchEndIndex << uint256(150));

        return result;
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
    function genTallyVotesPackedVals(
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize
    ) public pure returns (uint256) {

        // TODO: ensure that each value is less than or equal to 2 ** 50
        uint256 result =
            (_batchStartIndex / _tallyBatchSize) +
            (_numSignUps << uint256(50));

        return result;
    }

    function genTallyVotesPublicInputHash(
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize,
        uint256 _newTallyCommitment
    ) public view returns (uint256) {
        uint256 packedVals = genTallyVotesPackedVals(
            _numSignUps,
            _batchStartIndex,
            _tallyBatchSize
        );
        uint256[] memory input = new uint256[](4);
        input[0] = packedVals;
        input[1] = sbCommitment;
        input[2] = tallyCommitment;
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
        // Require that all messages have been processed
        require(
            processingComplete,
            ERROR_PROCESSING_NOT_COMPLETE
        );

        ( , uint256 tallyBatchSize) = _poll.batchSizes(); 
        uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;
        (uint256 numSignUps,) = _poll.numSignUpsAndMessages();

        // Require that there are untalied ballots left
        require(
            batchStartIndex <= numSignUps,
            ERROR_ALL_BALLOTS_TALLIED
        );

        bool isValid = verifyTallyProof(
            _poll,
            _proof,
            numSignUps,
            batchStartIndex,
            tallyBatchSize,
            _newTallyCommitment
        );
        require(isValid, ERROR_INVALID_TALLY_VOTES_PROOF);

        // Update the tally commitment and the tally batch num
        tallyCommitment = _newTallyCommitment;
        tallyBatchNum ++;
    }

    /*
    * @notice Verify the tally proof using the verifiying key
    * @param _poll contract address of the poll proof to be verified
    * @param _proof the proof generated after processing all messages
    * @param _numSignUps number of signups for a given poll
    * @param _batchStartIndex the number of batches multiplied by the size of the batch
    * @param _tallyBatchSize batch size for the tally
    * @param _newTallyCommitment the tally commitment to be verified at a given batch index
    * @return valid a boolean representing successful verification
    */
    function verifyTallyProof(
        Poll _poll,
        uint256[8] memory _proof,
        uint256 _numSignUps,
        uint256 _batchStartIndex,
        uint256 _tallyBatchSize,
        uint256 _newTallyCommitment
    ) public view returns (bool) {
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
            _numSignUps,
            _batchStartIndex,
            _tallyBatchSize,
            _newTallyCommitment
        );

        // Verify the proof
        return verifier.verify(_proof, vk, publicInputHash);
    }
}
