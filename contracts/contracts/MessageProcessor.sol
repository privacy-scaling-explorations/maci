// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

  /// @notice The current message batch index
  uint256 public currentBatchIndex;

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
    currentBatchIndex = 1;
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

    // Retrieve stored vals
    (, uint8 voteOptionTreeDepth) = poll.treeDepths();
    // Retrieve stored val
    uint8 messageBatchSize = poll.messageBatchSize();

    uint256[] memory batchHashes;
    // Copy the state and ballot commitment and set the batch index if this
    // is the first batch to process
    if (numBatchesProcessed == 0) {
      uint256 currentSbCommitment = poll.currentSbCommitment();
      sbCommitment = currentSbCommitment;

      poll.padLastBatch();
      batchHashes = poll.getBatchHashes();
      currentBatchIndex = batchHashes.length;

      if (currentBatchIndex > 0) {
        currentBatchIndex -= 1;
      }
    } else {
      batchHashes = poll.getBatchHashes();
    }

    uint256 outputBatchHash = batchHashes[currentBatchIndex];

    if (
      !verifyProcessProof(
        currentBatchIndex,
        outputBatchHash,
        sbCommitment,
        _newSbCommitment,
        messageBatchSize,
        voteOptionTreeDepth,
        _proof
      )
    ) {
      revert InvalidProcessMessageProof();
    }

    (, uint256 numMessages) = poll.numSignUpsAndMessages();

    updateMessageProcessingData(_newSbCommitment, numMessages <= messageBatchSize * (numBatchesProcessed + 1));
  }

  /// @notice Verify the proof for processMessage
  /// @dev used to update the sbCommitment
  /// @param _currentBatchIndex The batch index of current message batch
  /// @param _currentSbCommitment The current sbCommitment (state and ballot)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @param _messageBatchSize The message batch size
  /// @param _voteOptionTreeDepth The vote option tree depth
  /// @param _proof The zk-SNARK proof
  /// @return isValid Whether the proof is valid
  function verifyProcessProof(
    uint256 _currentBatchIndex,
    uint256 _outputBatchHash,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment,
    uint8 _messageBatchSize,
    uint8 _voteOptionTreeDepth,
    uint256[8] memory _proof
  ) internal view returns (bool isValid) {
    // get the tree depths
    // get the message batch size from the message tree subdepth
    // get the number of signups
    (uint256 numSignUps, uint256 numMessages) = poll.numSignUpsAndMessages();
    IMACI maci = poll.getMaciContract();

    // Calculate the public input hash (a SHA256 hash of several values)
    uint256 publicInputHash = genProcessMessagesPublicInputHash(
      _currentBatchIndex,
      _outputBatchHash,
      numSignUps,
      numMessages,
      _currentSbCommitment,
      _newSbCommitment,
      _messageBatchSize,
      _voteOptionTreeDepth
    );

    // Get the verifying key from the VkRegistry
    VerifyingKey memory vk = vkRegistry.getProcessVk(
      maci.stateTreeDepth(),
      _voteOptionTreeDepth,
      _messageBatchSize,
      mode
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
  /// @param _currentBatchIndex The batch index of current message batch
  /// @param _numSignUps The number of users that signup
  /// @param _numMessages The number of messages
  /// @param _currentSbCommitment The current sbCommitment (state and ballot root)
  /// @param _newSbCommitment The new sbCommitment after we update this message batch
  /// @param _messageBatchSize The message batch size
  /// @return inputHash Returns the SHA256 hash of the packed values
  function genProcessMessagesPublicInputHash(
    uint256 _currentBatchIndex,
    uint256 _outputBatchHash,
    uint256 _numSignUps,
    uint256 _numMessages,
    uint256 _currentSbCommitment,
    uint256 _newSbCommitment,
    uint8 _messageBatchSize,
    uint8 _voteOptionTreeDepth
  ) public view returns (uint256 inputHash) {
    uint256 coordinatorPubKeyHash = poll.coordinatorPubKeyHash();

    uint8 actualStateTreeDepth = poll.actualStateTreeDepth();

    // pack the values
    uint256 packedVals = genProcessMessagesPackedVals(
      _currentBatchIndex,
      _numSignUps,
      _numMessages,
      _messageBatchSize,
      _voteOptionTreeDepth
    );

    // generate the circuit only public input
    uint256[] memory input = new uint256[](6);
    input[0] = packedVals;
    input[1] = coordinatorPubKeyHash;
    input[2] = _outputBatchHash;
    input[3] = _currentSbCommitment;
    input[4] = _newSbCommitment;
    input[5] = actualStateTreeDepth;
    inputHash = sha256Hash(input);
  }

  /// @notice One of the inputs to the ProcessMessages circuit is a 250-bit
  /// representation of four 50-bit values. This function generates this
  /// 250-bit value, which consists of the maximum number of vote options, the
  /// number of signups, the current message batch index, and the end index of
  /// the current batch.
  /// @param _currentBatchIndex batch index of current message batch
  /// @param _numSignUps number of users that signup
  /// @param _numMessages number of messages
  /// @param _messageBatchSize The message batch size
  /// @param _voteOptionTreeDepth vote option tree depth
  /// @return result The packed value
  function genProcessMessagesPackedVals(
    uint256 _currentBatchIndex,
    uint256 _numSignUps,
    uint256 _numMessages,
    uint8 _messageBatchSize,
    uint8 _voteOptionTreeDepth
  ) public pure returns (uint256 result) {
    uint256 maxVoteOptions = TREE_ARITY ** _voteOptionTreeDepth;

    uint256 batchEndIndex = (_currentBatchIndex + 1) * _messageBatchSize;
    if (batchEndIndex > _numMessages) {
      batchEndIndex = _numMessages;
    }

    if (maxVoteOptions >= 2 ** 50) revert MaxVoteOptionsTooLarge();
    if (_numSignUps >= 2 ** 50) revert NumSignUpsTooLarge();
    if (_currentBatchIndex * _messageBatchSize >= 2 ** 50) revert CurrentMessageBatchIndexTooLarge();
    if (batchEndIndex >= 2 ** 50) revert BatchEndIndexTooLarge();
    result = maxVoteOptions + (_numSignUps << 50) + (_messageBatchSize << 100) + (batchEndIndex << 150);
  }

  /// @notice update message processing state variables
  /// @param _newSbCommitment sbCommitment to be updated
  /// @param _processingComplete update flag that indicate processing is finished or not
  function updateMessageProcessingData(uint256 _newSbCommitment, bool _processingComplete) internal {
    sbCommitment = _newSbCommitment;
    processingComplete = _processingComplete;
    currentBatchIndex -= 1;
    numBatchesProcessed++;
  }
}
