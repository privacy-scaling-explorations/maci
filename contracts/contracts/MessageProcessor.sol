// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { AccQueue } from "./trees/AccQueue.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Poll } from "./Poll.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { CommonUtilities } from "./utilities/Utilities.sol";
import { Verifier } from "./crypto/Verifier.sol";
import { VkRegistry } from "./VkRegistry.sol";

/// @title MessageProcessor
/// @dev MessageProcessor is used to process messages published by signup users.
/// It will process message by batch due to large size of messages.
/// After it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts.
contract MessageProcessor is Ownable, SnarkCommon, CommonUtilities, Hasher {
  /// @notice custom errors
  error NoMoreMessages();
  error StateAqNotMerged();
  error MessageAqNotMerged();
  error InvalidProcessMessageProof();
  error VkNotSet();
  error MaxVoteOptionsTooLarge();
  error NumSignUpsTooLarge();
  error CurrentMessageBatchIndexTooLarge();
  error BatchEndIndexTooLarge();

  /// @notice Whether there are unprocessed messages left
  bool public processingComplete;
  /// @notice  The number of batches processed
  uint256 public numBatchesProcessed;
  /// @notice  The current message batch index. When the coordinator runs
  /// processMessages(), this action relates to messages
  /// currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
  uint256 public currentMessageBatchIndex;
  /// @notice The commitment to the state and ballot roots
  uint256 public sbCommitment;

  Verifier public verifier;
  VkRegistry public vkRegistry;

  /// @notice Create a new instance
  /// @param _verifier The Verifier contract address
  /// @param _vkRegistry The VkRegistry contract address
  constructor(Verifier _verifier, VkRegistry _vkRegistry) {
    verifier = _verifier;
    vkRegistry = _vkRegistry;
  }

  /// @notice Update the Poll's currentSbCommitment if the proof is valid.
  /// @param _poll The poll to update
  /// @param _newSbCommitment The new state root and ballot root commitment
  ///                         after all messages are processed
  /// @param _proof The zk-SNARK proof
  function processMessages(Poll _poll, uint256 _newSbCommitment, uint256[8] memory _proof) external onlyOwner {
    _votingPeriodOver(_poll);
    // There must be unprocessed messages
    if (processingComplete) {
      revert NoMoreMessages();
    }

    // The state AccQueue must be merged
    if (!_poll.stateAqMerged()) {
      revert StateAqNotMerged();
    }

    // Retrieve stored vals
    (, , uint8 messageTreeDepth, ) = _poll.treeDepths();
    (uint256 messageBatchSize, , ) = _poll.batchSizes();

    AccQueue messageAq;
    (, messageAq, ) = _poll.extContracts();

    // Require that the message queue has been merged
    uint256 messageRoot = messageAq.getMainRoot(messageTreeDepth);
    if (messageRoot == 0) {
      revert MessageAqNotMerged();
    }

    // Copy the state and ballot commitment and set the batch index if this
    // is the first batch to process
    if (numBatchesProcessed == 0) {
      uint256 currentSbCommitment = _poll.currentSbCommitment();
      sbCommitment = currentSbCommitment;
      (, uint256 numMessages) = _poll.numSignUpsAndMessages();
      uint256 r = numMessages % messageBatchSize;

      if (r == 0) {
        currentMessageBatchIndex = (numMessages / messageBatchSize) * messageBatchSize;
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
      revert InvalidProcessMessageProof();
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

  /// @notice Verify the proof for processMessage
  /// @dev used to update the sbCommitment
  /// @param _poll The Poll contract address
  /// @param _currentMessageBatchIndex The batch index of current message batch
  /// @param _messageRoot The message tree root
  /// @param _currentSbCommitment The current sbCommitment (state and ballot)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyProcessProof(
    Poll _poll,
    uint256 _currentMessageBatchIndex,
    uint256 _messageRoot,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment,
    uint256[8] memory _proof
  ) internal view returns (bool isValid) {
    (, , uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = _poll.treeDepths();
    (uint256 messageBatchSize, , ) = _poll.batchSizes();
    (uint256 numSignUps, ) = _poll.numSignUpsAndMessages();
    (IMACI maci, , ) = _poll.extContracts();

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

    isValid = verifier.verify(_proof, vk, publicInputHash);
  }

  /// @notice Returns the SHA256 hash of the packed values (see
  /// genProcessMessagesPackedVals), the hash of the coordinator's public key,
  /// the message root, and the commitment to the current state root and
  /// ballot root. By passing the SHA256 hash of these values to the circuit
  /// as a single public input and the preimage as private inputs, we reduce
  /// its verification gas cost though the number of constraints will be
  /// higher and proving time will be longer.
  /// @param _poll The Poll contract address
  /// @param _currentMessageBatchIndex The batch index of current message batch
  /// @param _numSignUps The number of users that signup
  /// @param _currentSbCommitment The current sbCommitment (state and ballot root)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @return inputHash Returns the SHA256 hash of the packed values
  function genProcessMessagesPublicInputHash(
    Poll _poll,
    uint256 _currentMessageBatchIndex,
    uint256 _messageRoot,
    uint256 _numSignUps,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment
  ) public view returns (uint256 inputHash) {
    uint256 coordinatorPubKeyHash = _poll.coordinatorPubKeyHash();

    uint256 packedVals = genProcessMessagesPackedVals(_poll, _currentMessageBatchIndex, _numSignUps);

    (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();

    uint256[] memory input = new uint256[](6);
    input[0] = packedVals;
    input[1] = coordinatorPubKeyHash;
    input[2] = _messageRoot;
    input[3] = _currentSbCommitment;
    input[4] = _newSbCommitment;
    input[5] = deployTime + duration;
    inputHash = sha256Hash(input);
  }

  /// @notice One of the inputs to the ProcessMessages circuit is a 250-bit
  /// representation of four 50-bit values. This function generates this
  /// 250-bit value, which consists of the maximum number of vote options, the
  /// number of signups, the current message batch index, and the end index of
  /// the current batch.
  /// @param _poll the poll contract
  /// @param _currentMessageBatchIndex batch index of current message batch
  /// @param _numSignUps number of users that signup
  /// @return result The packed value
  function genProcessMessagesPackedVals(
    Poll _poll,
    uint256 _currentMessageBatchIndex,
    uint256 _numSignUps
  ) public view returns (uint256 result) {
    (, uint256 maxVoteOptions) = _poll.maxValues();
    (, uint256 numMessages) = _poll.numSignUpsAndMessages();
    (uint24 mbs, , ) = _poll.batchSizes();
    uint256 messageBatchSize = uint256(mbs);

    uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;
    if (batchEndIndex > numMessages) {
      batchEndIndex = numMessages;
    }

    if (maxVoteOptions >= 2 ** 50) revert MaxVoteOptionsTooLarge();
    if (_numSignUps >= 2 ** 50) revert NumSignUpsTooLarge();
    if (_currentMessageBatchIndex >= 2 ** 50) revert CurrentMessageBatchIndexTooLarge();
    if (batchEndIndex >= 2 ** 50) revert BatchEndIndexTooLarge();

    result = maxVoteOptions + (_numSignUps << 50) + (_currentMessageBatchIndex << 100) + (batchEndIndex << 150);
  }

  /// @notice update message processing state variables
  /// @param _newSbCommitment sbCommitment to be updated
  /// @param _currentMessageBatchIndex currentMessageBatchIndex to be updated
  /// @param _processingComplete update flag that indicate processing is finished or not
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
