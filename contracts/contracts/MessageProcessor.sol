// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {AccQueue} from "./trees/AccQueue.sol";
import {IMACI} from "./IMACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Poll} from "./Poll.sol";
import {SnarkCommon} from "./crypto/SnarkCommon.sol";
import {CommonUtilities} from "./Utility.sol";
import {Verifier} from "./crypto/Verifier.sol";
import {VkRegistry} from "./VkRegistry.sol";

contract MessageProcessor is Ownable, SnarkCommon, CommonUtilities {

    string constant ERROR_VOTING_PERIOD_PASSED = "ProcessE01";
    string constant ERROR_VOTING_PERIOD_NOT_PASSED = "ProcessE02";
    string constant ERROR_NO_MORE_MESSAGES = "ProcessE03";
    string constant ERROR_STATE_AQ_NOT_MERGED = "ProcessE04";
    string constant ERROR_MESSAGE_AQ_NOT_MERGED = "ProcessE04";
    string constant ERROR_INVALID_PROCESS_MESSAGE_PROOF = "ProcessE05";
    string constant ERROR_VK_NOT_SET = "ProcessE06";


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

    constructor(Verifier _verifier) {
        verifier = _verifier;
    }

    modifier votingPeriodOver(Poll _poll) {
        (uint256 deployTime, uint256 duration) = _poll
            .getDeployTimeAndDuration();
        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - deployTime;
        require(secondsPassed > duration, ERROR_VOTING_PERIOD_NOT_PASSED);
        _;
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
    ) public onlyOwner votingPeriodOver(_poll) {
        // There must be unprocessed messages
        require(!processingComplete, ERROR_NO_MORE_MESSAGES);

        // The state AccQueue must be merged
        require(_poll.stateAqMerged(), ERROR_STATE_AQ_NOT_MERGED);

        // Retrieve stored vals
        (, , uint8 messageTreeDepth, ) = _poll.treeDepths();
        (uint256 messageBatchSize, , ) = _poll.batchSizes();

        AccQueue messageAq;
        (, , messageAq, ) = _poll.extContracts();

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
        (, , uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = _poll
            .treeDepths();
        (uint256 messageBatchSize, , ) = _poll.batchSizes();
        (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();
        (VkRegistry vkRegistry, IMACI maci, , ) = _poll.extContracts();

        require(address(vkRegistry) != address(0), ERROR_VK_NOT_SET);

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
        (, uint256 numMessages) = _poll.numSignUpsAndMessages();
        (uint24 mbs, , ) = _poll.batchSizes();
        uint256 messageBatchSize = uint256(mbs);

        uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;
        if (batchEndIndex > numMessages) {
            batchEndIndex = numMessages;
        }

        uint256 result = maxVoteOptions +
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
        numBatchesProcessed++;
    }



}
