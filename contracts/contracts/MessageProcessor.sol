// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title MessageProcessor
/// @dev MessageProcessor is used to process messages published by signup users.
/// It will process message by batch due to large size of messages.
/// After it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts.
contract MessageProcessor is Ownable, SnarkCommon, Hasher, CommonUtilities, IMessageProcessor, DomainObjs {
  /// @notice custom errors
  error NoMoreMessages();
  error StateNotMerged();
  error MessageAqNotMerged();
  error InvalidProcessMessageProof();
  error MaxVoteOptionsTooLarge();
  error NumSignUpsTooLarge();
  error CurrentMessageBatchIndexTooLarge();
  error BatchEndIndexTooLarge();

  // the number of children per node in the merkle trees
  uint256 internal constant TREE_ARITY = 5;

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
  Mode public immutable mode;

  /// @notice Create a new instance
  /// @param _verifier The Verifier contract address
  /// @param _vkRegistry The VkRegistry contract address
  /// @param _poll The Poll contract address
  /// @param _mpOwner The owner of the MessageProcessor contract
  /// @param _mode Voting mode
  constructor(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _mpOwner,
    Mode _mode
  ) payable Ownable(_mpOwner) {
    verifier = IVerifier(_verifier);
    vkRegistry = IVkRegistry(_vkRegistry);
    poll = IPoll(_poll);
    mode = _mode;
  }

  /// @notice Update the Poll's currentSbCommitment if the proof is valid.
  /// @param _newSbCommitment The new state root and ballot root commitment
  ///                         after all messages are processed
  /// @param _proof The zk-SNARK proof
  function processMessages(uint256 _newSbCommitment, uint256[8] calldata _proof) external onlyOwner {
    // ensure the voting period is over
    _votingPeriodOver(poll);

    // There must be unprocessed messages
    if (processingComplete) {
      revert NoMoreMessages();
    }

    // The state AccQueue must be merged
    if (!poll.stateMerged()) {
      revert StateNotMerged();
    }

    // Retrieve stored vals
    (, uint8 messageTreeSubDepth, uint8 messageTreeDepth, ) = poll.treeDepths();
    // calculate the message batch size from the message tree subdepth
    uint256 messageBatchSize = TREE_ARITY ** messageTreeSubDepth;

    (, AccQueue messageAq) = poll.extContracts();

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

    if (!verifyProcessProof(currentMessageBatchIndex, _newSbCommitment, _proof)) {
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

  /// @inheritdoc IMessageProcessor
  function getPublicCircuitInputs(
    uint256 _currentMessageBatchIndex,
    uint256 _newSbCommitment
  ) public view override returns (uint256[] memory publicInputs) {
    (, uint8 messageTreeSubDepth, uint8 messageTreeDepth, ) = poll.treeDepths();
    (, AccQueue messageAq) = poll.extContracts();
    uint256 coordinatorPubKeyHash = poll.coordinatorPubKeyHash();
    uint256 messageBatchSize = TREE_ARITY ** messageTreeSubDepth;
    (uint256 numSignUps, uint256 numMessages) = poll.numSignUpsAndMessages();
    (uint256 deployTime, uint256 duration) = poll.getDeployTimeAndDuration();
    uint256 batchEndIndex = _currentMessageBatchIndex + messageBatchSize;

    if (batchEndIndex > numMessages) {
      batchEndIndex = numMessages;
    }

    publicInputs = new uint256[](9);
    publicInputs[0] = numSignUps;
    publicInputs[1] = deployTime + duration;
    publicInputs[2] = messageAq.getMainRoot(messageTreeDepth);
    publicInputs[3] = poll.actualStateTreeDepth();
    publicInputs[4] = batchEndIndex;
    publicInputs[5] = _currentMessageBatchIndex;
    publicInputs[6] = coordinatorPubKeyHash;
    publicInputs[7] = (sbCommitment == 0 ? poll.currentSbCommitment() : sbCommitment);
    publicInputs[8] = _newSbCommitment;
  }

  /// @notice Verify the proof for processMessage
  /// @dev used to update the sbCommitment
  /// @param _currentMessageBatchIndex The current message batch index
  /// @param _newSbCommitment The new state root and ballot root commitment
  ///                         after all messages are processed
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyProcessProof(
    uint256 _currentMessageBatchIndex,
    uint256 _newSbCommitment,
    uint256[8] calldata _proof
  ) public view returns (bool isValid) {
    // get the tree depths
    (, uint8 messageTreeSubDepth, uint8 messageTreeDepth, uint8 voteOptionTreeDepth) = poll.treeDepths();
    (IMACI maci, ) = poll.extContracts();
    uint256[] memory publicCircuitInputs = getPublicCircuitInputs(_currentMessageBatchIndex, _newSbCommitment);

    // Get the verifying key from the VkRegistry
    VerifyingKey memory vk = vkRegistry.getProcessVk(
      maci.stateTreeDepth(),
      messageTreeDepth,
      voteOptionTreeDepth,
      TREE_ARITY ** messageTreeSubDepth,
      mode
    );

    isValid = verifier.verify(_proof, vk, publicCircuitInputs);
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
