// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { AccQueue } from "./trees/AccQueue.sol";
import { IMACI } from "./interfaces/IMACI.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { IVerifier } from "./interfaces/IVerifier.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";
import { IMessageProcessor } from "./interfaces/IMessageProcessor.sol";
import { CommonUtilities } from "./utilities/CommonUtilities.sol";

/// @title MessageProcessor
/// @dev MessageProcessor is used to process messages published by signup users.
/// It will process message by batch due to large size of messages.
/// After it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts.
contract MessageProcessor is Ownable, SnarkCommon, Hasher, CommonUtilities, IMessageProcessor {
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

  // the number of children per node in the merkle trees
  uint256 private constant TREE_ARITY = 5;

  /// @inheritdoc IMessageProcessor
  bool public processingComplete;

  /// @notice  The number of batches processed
  uint256 public numBatchesProcessed;

  /// @notice  The current message batch index. When the coordinator runs
  /// processMessages(), this action relates to messages
  /// currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.
  uint256 public currentMessageBatchIndex;

  /// @inheritdoc IMessageProcessor
  uint256 public sbCommitment;

  IPoll public immutable poll;
  IVerifier public immutable verifier;
  IVkRegistry public immutable vkRegistry;

  /// @notice Create a new instance
  /// @param _verifier The Verifier contract address
  /// @param _vkRegistry The VkRegistry contract address
  /// @param _poll The Poll contract address
  constructor(address _verifier, address _vkRegistry, address _poll) payable {
    verifier = IVerifier(_verifier);
    vkRegistry = IVkRegistry(_vkRegistry);
    poll = IPoll(_poll);
  }

  /// @notice Update the Poll's currentSbCommitment if the proof is valid.
  /// @param _newSbCommitment The new state root and ballot root commitment
  ///                         after all messages are processed
  /// @param _proof The zk-SNARK proof
  function processMessages(uint256 _newSbCommitment, uint256[8] memory _proof) external onlyOwner {
    // ensure the voting period is over
    _votingPeriodOver(poll);

    // There must be unprocessed messages
    if (processingComplete) {
      revert NoMoreMessages();
    }

    // The state AccQueue must be merged
    if (!poll.stateAqMerged()) {
      revert StateAqNotMerged();
    }

    // Retrieve stored vals
    (, uint8 messageTreeSubDepth, uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = poll.treeDepths();
    // calculate the message batch size from the message tree subdepth
    uint256 messageBatchSize = TREE_ARITY ** messageTreeSubDepth;

    (, AccQueue messageAq, ) = poll.extContracts();

    // Require that the message queue has been merged
    uint256 messageRoot = messageAq.getMainRoot(messageTreeDepth);
    if (messageRoot == 0) {
      revert MessageAqNotMerged();
    }

    // Copy the state and ballot commitment and set the batch index if this
    // is the first batch to process
    if (numBatchesProcessed == 0) {
      uint256 currentSbCommitment = poll.currentSbCommitment();
      sbCommitment = currentSbCommitment;
      (, uint256 numMessages) = poll.numSignUpsAndMessages();
      uint256 r = numMessages % messageBatchSize;

      currentMessageBatchIndex = numMessages;

      if (currentMessageBatchIndex > 0) {
        if (r == 0) {
          currentMessageBatchIndex -= messageBatchSize;
        } else {
          currentMessageBatchIndex -= r;
        }
      }
    }

    if (
      !verifyProcessProof(
        currentMessageBatchIndex,
        messageRoot,
        sbCommitment,
        _newSbCommitment,
        messageTreeSubDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        _proof
      )
    ) {
      revert InvalidProcessMessageProof();
    }

    {
      (, uint256 numMessages) = poll.numSignUpsAndMessages();
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
  /// @param _currentMessageBatchIndex The batch index of current message batch
  /// @param _messageRoot The message tree root
  /// @param _currentSbCommitment The current sbCommitment (state and ballot)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @param _messageTreeSubDepth The message tree subdepth
  /// @param _messageTreeDepth The message tree depth
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyProcessProof(
    uint256 _currentMessageBatchIndex,
    uint256 _messageRoot,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment,
    uint8 _messageTreeSubDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint256[8] memory _proof
  ) internal view returns (bool isValid) {
    // get the tree depths
    // get the message batch size from the message tree subdepth
    // get the number of signups
    (uint256 numSignUps, uint256 numMessages) = poll.numSignUpsAndMessages();
    (IMACI maci, , ) = poll.extContracts();

    // Calculate the public input hash (a SHA256 hash of several values)
    uint256 publicInputHash = genProcessMessagesPublicInputHash(
      _currentMessageBatchIndex,
      _messageRoot,
      numSignUps,
      numMessages,
      _currentSbCommitment,
      _newSbCommitment,
      _messageTreeSubDepth,
      _voteOptionTreeDepth
    );

    // Get the verifying key from the VkRegistry
    VerifyingKey memory vk = vkRegistry.getProcessVk(
      maci.stateTreeDepth(),
      _messageTreeDepth,
      _voteOptionTreeDepth,
      TREE_ARITY ** _messageTreeSubDepth
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
  /// @param _currentMessageBatchIndex The batch index of current message batch
  /// @param _numSignUps The number of users that signup
  /// @param _numMessages The number of messages
  /// @param _currentSbCommitment The current sbCommitment (state and ballot root)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @param _messageTreeSubDepth The message tree subdepth
  /// @return inputHash Returns the SHA256 hash of the packed values
  function genProcessMessagesPublicInputHash(
    uint256 _currentMessageBatchIndex,
    uint256 _messageRoot,
    uint256 _numSignUps,
    uint256 _numMessages,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment,
    uint8 _messageTreeSubDepth,
    uint8 _voteOptionTreeDepth
  ) public view returns (uint256 inputHash) {
    uint256 coordinatorPubKeyHash = poll.coordinatorPubKeyHash();

    // pack the values
    uint256 packedVals = genProcessMessagesPackedVals(
      _currentMessageBatchIndex,
      _numSignUps,
      _numMessages,
      _messageTreeSubDepth,
      _voteOptionTreeDepth
    );

    (uint256 deployTime, uint256 duration) = poll.getDeployTimeAndDuration();

    // generate the circuit only public input
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
  /// @param _currentMessageBatchIndex batch index of current message batch
  /// @param _numSignUps number of users that signup
  /// @param _numMessages number of messages
  /// @param _messageTreeSubDepth message tree subdepth
  /// @param _voteOptionTreeDepth vote option tree depth
  /// @return result The packed value
  function genProcessMessagesPackedVals(
    uint256 _currentMessageBatchIndex,
    uint256 _numSignUps,
    uint256 _numMessages,
    uint8 _messageTreeSubDepth,
    uint8 _voteOptionTreeDepth
  ) public pure returns (uint256 result) {
    uint256 maxVoteOptions = TREE_ARITY ** _voteOptionTreeDepth;

    // calculate the message batch size from the message tree subdepth
    uint256 messageBatchSize = TREE_ARITY ** _messageTreeSubDepth;
    uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;
    if (batchEndIndex > _numMessages) {
      batchEndIndex = _numMessages;
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
