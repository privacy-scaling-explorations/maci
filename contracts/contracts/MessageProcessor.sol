// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {AccQueue} from "./trees/AccQueue.sol";
import {IMACI} from "./IMACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Poll} from "./Poll.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {Hasher} from "./crypto/Hasher.sol";
import {CommonUtilities} from "./utilities/Utility.sol";
import {Verifier} from "./crypto/Verifier.sol";
import {VkRegistry} from "./VkRegistry.sol";
import {DomainObjs} from "./DomainObjs.sol";
import {Utilities} from "./utilities/Utility.sol";

/*
 * MessageProcessor is used to process messages published by signup users
 * it will process message by batch due to large size of messages
 * after it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts
 */
contract MessageProcessor is Ownable, SnarkCommon, CommonUtilities, Utilities {
    error NO_MORE_MESSAGES();
    error STATE_AQ_NOT_MERGED();
    error MESSAGE_AQ_NOT_MERGED();
    error INVALID_PROCESS_MESSAGE_PROOF();
    error VK_NOT_SET();

    uint8 public constant DEACT_TREE_DEPTH = 10;
    string constant ERROR_MAX_DEACTIVATED_KEYS_REACHED = "PollE08";

    // Whether there are unprocessed messages left
    bool public processingComplete;
    // The number of batches processed
    uint256 public numBatchesProcessed;
    // The current message batch index. When the coordinator runs
    // processMessages(), this action relates to messages
    // currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
    uint256 public currentMessageBatchIndex;
    // The commitment to the state and ballot roots
    uint256 public sbCommitment;

    Verifier public verifier;

    event DeactivateKey(uint256 keyHash, uint256[2] c1, uint256[2] c2);

    constructor(Verifier _verifier) {
        verifier = _verifier;
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
    ) external onlyOwner {
        _votingPeriodOver(_poll);
        // There must be unprocessed messages
        if (processingComplete) {
            revert NO_MORE_MESSAGES();
        }

        // The state AccQueue must be merged
        if (!_poll.stateAqMerged()) {
            revert STATE_AQ_NOT_MERGED();
        }

        // Retrieve stored vals
        (, , uint8 messageTreeDepth, ) = _poll.treeDepths();
        (uint256 messageBatchSize, , ) = _poll.batchSizes();

        AccQueue messageAq;
        (, , messageAq, , ) = _poll.extContracts();

        // Require that the message queue has been merged
        uint256 messageRoot = messageAq.getMainRoot(messageTreeDepth);
        if (messageRoot == 0) {
            revert MESSAGE_AQ_NOT_MERGED();
        }

        // Copy the state and ballot commitment and set the batch index if this
        // is the first batch to process
        if (numBatchesProcessed == 0) {
            uint256 currentSbCommitment = _poll.currentSbCommitment();
            sbCommitment = currentSbCommitment;
            (, uint256 numMessages, ) = _poll
                .numSignUpsAndMessagesAndDeactivatedKeys();
            uint256 r = numMessages % messageBatchSize;

            if (r == 0) {
                currentMessageBatchIndex =
                    (numMessages / messageBatchSize) *
                    messageBatchSize;
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
        if (!isValid) {
            revert INVALID_PROCESS_MESSAGE_PROOF();
        }

        {
            (, uint256 numMessages, ) = _poll
                .numSignUpsAndMessagesAndDeactivatedKeys();
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

    /**
     * @notice Confirms the deactivation of a MACI public key. This function must be called by Coordinator after User calls the deactivateKey function
     * @param _batchLeaves Deactivated keys leaves
     * @param _batchSize The capacity of the subroot of the deactivated keys tree
     */
    function confirmDeactivation(
        uint256[][] memory _batchLeaves,
        uint256 _batchSize,
        Poll poll
    ) external onlyOwner {
        (
            ,
            ,
            ,
            AccQueue deactivatedKeysAq,

        ) = poll.extContracts();

        ( , , uint256 numDeactivatedKeys) = poll
            .numSignUpsAndMessagesAndDeactivatedKeys();
        
        (uint256 maxMessages, ) = poll.maxValues();

        require(
            numDeactivatedKeys <= maxMessages,
            ERROR_MAX_DEACTIVATED_KEYS_REACHED
        );

        for (uint256 i = 0; i < _batchSize; i++) {
            uint256 keyHash = _batchLeaves[i][0];
            uint256[2] memory c1;
            uint256[2] memory c2;

            c1[0] = _batchLeaves[i][1];
            c1[1] = _batchLeaves[i][2];
            c2[0] = _batchLeaves[i][3];
            c2[1] = _batchLeaves[i][4];

            deactivatedKeysAq.enqueue(
                hash5([keyHash, c1[0], c1[1], c2[0], c2[1]])
            );
            emit DeactivateKey(keyHash, c1, c2);
        }
    }

    /**
     * @notice Completes the deactivation of all MACI public keys.
     * @param _stateNumSrQueueOps The number of subroot queue operations to merge for the MACI state tree
     * @param poll Poll contract address
     * @param _pollId The pollId of the Poll contract
     */
    function mergeForDeactivation(
        uint256 _stateNumSrQueueOps,
        Poll poll,
        uint256 _pollId
    ) external onlyOwner {
        (
            ,
            IMACI maci,
            ,
            AccQueue deactivatedKeysAq,

        ) = poll.extContracts();

        {
            (uint256 deployTime, ) = poll.getDeployTimeAndDuration();

            require(
                block.timestamp - deployTime > maci.deactivationPeriod(),
                "Deactivation period has not passed"
            );
        }

        poll.mergeMaciStateAqSubRoots(_stateNumSrQueueOps, _pollId);
        poll.mergeMaciStateAq(_stateNumSrQueueOps);

        deactivatedKeysAq.mergeSubRoots(_stateNumSrQueueOps);
        deactivatedKeysAq.merge(DEACT_TREE_DEPTH);
    }

    /**
     * @notice Completes the deactivation of all MACI public keys.
     * @param _proof The Zk proof
     * @param poll Poll contract address
     */
    function completeDeactivation(
        uint256[8] memory _proof,
        Poll poll
    ) external onlyOwner {
        (
            VkRegistry vkRegistry,
            IMACI maci,
            ,
            AccQueue deactivatedKeysAq,

        ) = poll.extContracts();

        (, , uint8 messageTreeDepth, ) = poll
            .treeDepths();

        {
            (uint256 deployTime, ) = poll.getDeployTimeAndDuration();

            require(
                block.timestamp - deployTime > maci.deactivationPeriod(),
                "Deactivation period has not passed"
            );
        }

        VerifyingKey memory vk = vkRegistry.getProcessDeactivationVk(
            maci.stateTreeDepth(),
            messageTreeDepth
        );

        (uint256 numSignUps, , ) = poll
            .numSignUpsAndMessagesAndDeactivatedKeys();

        uint256 input = genProcessDeactivationMessagesPublicInputHash(
            deactivatedKeysAq.getMainRoot(DEACT_TREE_DEPTH),
            numSignUps,
            maci.getStateAqRoot(),
            poll.deactivationChainHash()
        );

        require(verifier.verify(_proof, vk, input), "Verification failed");
    }

    // TODO: Perform all the checks including verifier and pass the call to poll contract
    function generateNewKeyFromDeactivated(
        DomainObjs.Message memory _message,
        DomainObjs.PubKey memory _coordPubKey,
        DomainObjs.PubKey memory _sharedPubKey,
        Poll poll,
        uint256[8] memory _proof
    ) external returns (uint256) {
        (
            VkRegistry vkRegistry,
            IMACI maci,
            ,
            AccQueue deactivatedKeysAq,

        ) = poll.extContracts();

        (, , uint8 messageTreeDepth, ) = poll
            .treeDepths();

        VerifyingKey memory vk = vkRegistry.getProcessDeactivationVk(
            maci.stateTreeDepth(),
            messageTreeDepth
        );

        uint256 input = genGenerateNewKeyFromDeactivatedPublicInputHash(
            maci.getStateAqRoot(),
            deactivatedKeysAq.getMainRoot(DEACT_TREE_DEPTH),
            hashMessageAndEncPubKey(_message, _coordPubKey),
            _coordPubKey,
            _sharedPubKey
        );

        require(verifier.verify(_proof, vk, input), "Verification failed");

        return poll.generateNewKeyFromDeactivated(_message, _coordPubKey);
    }

    function verifyProcessProof(
        Poll _poll,
        uint256 _currentMessageBatchIndex,
        uint256 _messageRoot,
        uint256 _currentSbCommitment,
        uint256 _newSbCommitment,
        uint256[8] memory _proof
    ) internal view returns (bool) {
        (, , uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = _poll
            .treeDepths();
        (uint256 messageBatchSize, , ) = _poll.batchSizes();
        (uint256 numSignUps, , ) = _poll
            .numSignUpsAndMessagesAndDeactivatedKeys();
        (VkRegistry vkRegistry, IMACI maci, , , ) = _poll.extContracts();

        if (address(vkRegistry) == address(0)) {
            revert VK_NOT_SET();
        }

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

    function genProcessDeactivationMessagesPublicInputHash(
        uint256 _deactivatedTreeRoot,
        uint256 _numSignUps,
        uint256 _currentStateRoot,
        uint256 _chainHash
    ) private pure returns (uint256) {
        uint256[] memory input = new uint256[](4);
        input[0] = _deactivatedTreeRoot;
        input[1] = _numSignUps;
        input[2] = _currentStateRoot;
        input[3] = _chainHash;
        uint256 inputHash = sha256Hash(input);

        return inputHash;
    }

    function genGenerateNewKeyFromDeactivatedPublicInputHash(
        uint256 _currentStateRoot,
        uint256 _deactivatedTreeRoot,
        uint256 _messageHash,
        DomainObjs.PubKey memory _coordPublicKey,
        DomainObjs.PubKey memory _sharedPublicKey
    ) private pure returns (uint256) {
        uint256[] memory input = new uint256[](7);
        input[0] = _currentStateRoot;
        input[1] = _deactivatedTreeRoot;
        input[2] = _messageHash;
        input[3] = _coordPublicKey.x;
        input[4] = _coordPublicKey.y;
        input[5] = _sharedPublicKey.x;
        input[6] = _sharedPublicKey.y;
        uint256 inputHash = sha256Hash(input);

        return inputHash;
    }

    /*
     * @notice Returns the SHA256 hash of the packed values (see
     * genProcessMessagesPackedVals), the hash of the coordinator's public key,
     * the message root, and the commitment to the current state root and
     * ballot root. By passing the SHA256 hash of these values to the circuit
     * as a single public input and the preimage as private inputs, we reduce
     * its verification gas cost though the number of constraints will be
     * higher and proving time will be higher.
     * @param _poll: contract address
     * @param _currentMessageBatchIndex: batch index of current message batch
     * @param _numSignUps: number of users that signup
     * @param _currentSbCommitment: current sbCommitment
     * @param _newSbCommitment: new sbCommitment after we update this message batch
     * @return returns the SHA256 hash of the packed values
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

        (uint256 deployTime, uint256 duration) = _poll
            .getDeployTimeAndDuration();

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
        (, uint256 numMessages, ) = _poll
            .numSignUpsAndMessagesAndDeactivatedKeys();
        (uint24 mbs, , ) = _poll.batchSizes();
        uint256 messageBatchSize = uint256(mbs);

        uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;
        if (batchEndIndex > numMessages) {
            batchEndIndex = numMessages;
        }

        require(maxVoteOptions < 2 ** 50, "maxVoteOptions too large");
        require(_numSignUps < 2 ** 50, "numSignUps too large");
        require(
            _currentMessageBatchIndex < 2 ** 50,
            "currentMessageBatchIndex too large"
        );
        require(batchEndIndex < 2 ** 50, "batchEndIndex too large");
        uint256 result = maxVoteOptions +
            (_numSignUps << 50) +
            (_currentMessageBatchIndex << 100) +
            (batchEndIndex << 150);

        return result;
    }

    /*
     * @notice update message processing state variables
     * @param _newSbCommitment: sbCommitment to be updated
     * @param _currentMessageBatchIndex: currentMessageBatchIndex to be updated
     * @param _processingComplete: update flag that indicate processing is finished or not
     * @return None
     */
    function updateMessageProcessingData(
        uint256 _newSbCommitment,
        uint256 _currentMessageBatchIndex,
        bool _processingComplete
    ) internal {
        sbCommitment = _newSbCommitment;
        processingComplete = _processingComplete;
        currentMessageBatchIndex = _currentMessageBatchIndex;
        numBatchesProcessed++;
    }
}
