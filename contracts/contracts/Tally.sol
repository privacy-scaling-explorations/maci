// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IMACI } from "./interfaces/IMACI.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { IMessageProcessor } from "./interfaces/IMessageProcessor.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { IVerifier } from "./interfaces/IVerifier.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";
import { CommonUtilities } from "./utilities/CommonUtilities.sol";

/// @title Tally
/// @notice The Tally contract is used during votes tallying
/// and by users to verify the tally results.
contract Tally is Ownable, SnarkCommon, CommonUtilities, Hasher {
  uint256 private constant TREE_ARITY = 5;

  /// @notice The commitment to the tally results. Its initial value is 0, but after
  /// the tally of each batch is proven on-chain via a zk-SNARK, it should be
  /// updated to:
  ///
  /// hash3(
  ///   hashLeftRight(merkle root of current results, salt0)
  ///   hashLeftRight(number of spent voice credits, salt1),
  ///   hashLeftRight(merkle root of the no. of spent voice credits per vote option, salt2)
  /// )
  ///
  /// Where each salt is unique and the merkle roots are of arrays of leaves
  /// TREE_ARITY ** voteOptionTreeDepth long.
  uint256 public tallyCommitment;

  uint256 public tallyBatchNum;

  // The final commitment to the state and ballot roots
  uint256 public sbCommitment;

  IVerifier public immutable verifier;
  IVkRegistry public immutable vkRegistry;
  IPoll public immutable poll;
  IMessageProcessor public immutable messageProcessor;

  /// @notice custom errors
  error ProcessingNotComplete();
  error InvalidTallyVotesProof();
  error AllBallotsTallied();
  error NumSignUpsTooLarge();
  error BatchStartIndexTooLarge();
  error TallyBatchSizeTooLarge();

  /// @notice Create a new Tally contract
  /// @param _verifier The Verifier contract
  /// @param _vkRegistry The VkRegistry contract
  /// @param _poll The Poll contract
  /// @param _mp The MessageProcessor contract
  constructor(address _verifier, address _vkRegistry, address _poll, address _mp) payable {
    verifier = IVerifier(_verifier);
    vkRegistry = IVkRegistry(_vkRegistry);
    poll = IPoll(_poll);
    messageProcessor = IMessageProcessor(_mp);
  }

  /// @notice Pack the batch start index and number of signups into a 100-bit value.
  /// @param _numSignUps: number of signups
  /// @param _batchStartIndex: the start index of given batch
  /// @param _tallyBatchSize: size of batch
  /// @return result an uint256 representing the 3 inputs packed together
  function genTallyVotesPackedVals(
    uint256 _numSignUps,
    uint256 _batchStartIndex,
    uint256 _tallyBatchSize
  ) public pure returns (uint256 result) {
    if (_numSignUps >= 2 ** 50) revert NumSignUpsTooLarge();
    if (_batchStartIndex >= 2 ** 50) revert BatchStartIndexTooLarge();
    if (_tallyBatchSize >= 2 ** 50) revert TallyBatchSizeTooLarge();

    result = (_batchStartIndex / _tallyBatchSize) + (_numSignUps << uint256(50));
  }

  /// @notice Check if all ballots are tallied
  /// @return tallied whether all ballots are tallied
  function isTallied() external view returns (bool tallied) {
    (uint8 intStateTreeDepth, , , ) = poll.treeDepths();
    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    // Require that there are untallied ballots left
    tallied = tallyBatchNum * (TREE_ARITY ** intStateTreeDepth) >= numSignUps;
  }

  /// @notice generate hash of public inputs for tally circuit
  /// @param _numSignUps: number of signups
  /// @param _batchStartIndex: the start index of given batch
  /// @param _tallyBatchSize: size of batch
  /// @param _newTallyCommitment: the new tally commitment to be updated
  /// @return inputHash hash of public inputs
  function genTallyVotesPublicInputHash(
    uint256 _numSignUps,
    uint256 _batchStartIndex,
    uint256 _tallyBatchSize,
    uint256 _newTallyCommitment
  ) public view returns (uint256 inputHash) {
    uint256 packedVals = genTallyVotesPackedVals(_numSignUps, _batchStartIndex, _tallyBatchSize);
    uint256[] memory input = new uint256[](4);
    input[0] = packedVals;
    input[1] = sbCommitment;
    input[2] = tallyCommitment;
    input[3] = _newTallyCommitment;
    inputHash = sha256Hash(input);
  }

  /// @notice Update the state and ballot root commitment
  function updateSbCommitment() public onlyOwner {
    // Require that all messages have been processed
    if (!messageProcessor.processingComplete()) {
      revert ProcessingNotComplete();
    }

    if (sbCommitment == 0) {
      sbCommitment = messageProcessor.sbCommitment();
    }
  }

  /// @notice Verify the result of a tally batch
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @param _proof the proof generated after tallying this batch
  function tallyVotes(uint256 _newTallyCommitment, uint256[8] calldata _proof) public onlyOwner {
    _votingPeriodOver(poll);
    updateSbCommitment();

    // get the batch size and start index
    (uint8 intStateTreeDepth, , , ) = poll.treeDepths();
    uint256 tallyBatchSize = TREE_ARITY ** intStateTreeDepth;
    uint256 batchStartIndex = tallyBatchNum * tallyBatchSize;

    // save some gas because we won't overflow uint256
    unchecked {
      tallyBatchNum++;
    }

    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    // Require that there are untallied ballots left
    if (batchStartIndex >= numSignUps) {
      revert AllBallotsTallied();
    }

    bool isValid = verifyTallyProof(_proof, numSignUps, batchStartIndex, tallyBatchSize, _newTallyCommitment);

    if (!isValid) {
      revert InvalidTallyVotesProof();
    }

    // Update the tally commitment and the tally batch num
    tallyCommitment = _newTallyCommitment;
  }

  /// @notice Verify the tally proof using the verifying key
  /// @param _proof the proof generated after processing all messages
  /// @param _numSignUps number of signups for a given poll
  /// @param _batchStartIndex the number of batches multiplied by the size of the batch
  /// @param _tallyBatchSize batch size for the tally
  /// @param _newTallyCommitment the tally commitment to be verified at a given batch index
  /// @return isValid whether the proof is valid
  function verifyTallyProof(
    uint256[8] calldata _proof,
    uint256 _numSignUps,
    uint256 _batchStartIndex,
    uint256 _tallyBatchSize,
    uint256 _newTallyCommitment
  ) public view returns (bool isValid) {
    (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = poll.treeDepths();

    (IMACI maci, , ) = poll.extContracts();

    // Get the verifying key
    VerifyingKey memory vk = vkRegistry.getTallyVk(maci.stateTreeDepth(), intStateTreeDepth, voteOptionTreeDepth);

    // Get the public inputs
    uint256 publicInputHash = genTallyVotesPublicInputHash(
      _numSignUps,
      _batchStartIndex,
      _tallyBatchSize,
      _newTallyCommitment
    );

    // Verify the proof
    isValid = verifier.verify(_proof, vk, publicInputHash);
  }

  /// @notice Compute the merkle root from the path elements
  /// and a leaf
  /// @param _depth the depth of the merkle tree
  /// @param _index the index of the leaf
  /// @param _leaf the leaf
  /// @param _pathElements the path elements to reconstruct the merkle root
  /// @return current The merkle root
  function computeMerkleRootFromPath(
    uint8 _depth,
    uint256 _index,
    uint256 _leaf,
    uint256[][] calldata _pathElements
  ) internal pure returns (uint256 current) {
    uint256 pos = _index % TREE_ARITY;
    current = _leaf;
    uint8 k;

    uint256[TREE_ARITY] memory level;

    for (uint8 i = 0; i < _depth; ++i) {
      for (uint8 j = 0; j < TREE_ARITY; ++j) {
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

      _index /= TREE_ARITY;
      pos = _index % TREE_ARITY;
      current = hash5(level);
    }
  }

  /// @notice Verify the number of spent voice credits from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, salt)
  /// @return isValid Whether the provided values are valid
  function verifySpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) public view returns (bool isValid) {
    uint256[3] memory tally;
    tally[0] = _resultCommitment;
    tally[1] = hashLeftRight(_totalSpent, _totalSpentSalt);
    tally[2] = _perVOSpentVoiceCreditsHash;

    isValid = hash3(tally) == tallyCommitment;
  }

  /// @notice Verify the number of spent voice credits per vote option from the tally.json
  /// @param _voteOptionIndex the index of the vote option where credits were spent
  /// @param _spent the spent voice credits for a given vote option index
  /// @param _spentProof proof generated for the perVOSpentVoiceCredits
  /// @param _spentSalt the corresponding salt given in the tally perVOSpentVoiceCredits object
  /// @param _voteOptionTreeDepth depth of the vote option tree
  /// @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt)
  // in the tally.json file
  /// @return isValid Whether the provided proof is valid
  function verifyPerVOSpentVoiceCredits(
    uint256 _voteOptionIndex,
    uint256 _spent,
    uint256[][] calldata _spentProof,
    uint256 _spentSalt,
    uint8 _voteOptionTreeDepth,
    uint256 _spentVoiceCreditsHash,
    uint256 _resultCommitment
  ) public view returns (bool isValid) {
    uint256 computedRoot = computeMerkleRootFromPath(_voteOptionTreeDepth, _voteOptionIndex, _spent, _spentProof);

    uint256[3] memory tally;
    tally[0] = _resultCommitment;
    tally[1] = _spentVoiceCreditsHash;
    tally[2] = hashLeftRight(computedRoot, _spentSalt);

    isValid = hash3(tally) == tallyCommitment;
  }

  /// @notice Verify the result generated from the tally.json
  /// @param _voteOptionIndex the index of the vote option to verify the correctness of the tally
  /// @param _tallyResult Flattened array of the tally
  /// @param _tallyResultProof Corresponding proof of the tally result
  /// @param _tallyResultSalt the respective salt in the results object in the tally.json
  /// @param _voteOptionTreeDepth depth of the vote option tree
  /// @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
  /// @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice
  /// credits per vote option, perVOSpentVoiceCredits salt)
  /// @return isValid Whether the provided proof is valid
  function verifyTallyResult(
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt,
    uint8 _voteOptionTreeDepth,
    uint256 _spentVoiceCreditsHash,
    uint256 _perVOSpentVoiceCreditsHash
  ) public view returns (bool isValid) {
    uint256 computedRoot = computeMerkleRootFromPath(
      _voteOptionTreeDepth,
      _voteOptionIndex,
      _tallyResult,
      _tallyResultProof
    );

    uint256[3] memory tally;
    tally[0] = hashLeftRight(computedRoot, _tallyResultSalt);
    tally[1] = _spentVoiceCreditsHash;
    tally[2] = _perVOSpentVoiceCreditsHash;

    isValid = hash3(tally) == tallyCommitment;
  }
}
