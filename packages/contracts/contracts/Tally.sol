// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IMACI } from "./interfaces/IMACI.sol";
import { Hasher } from "./crypto/Hasher.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPoll } from "./interfaces/IPoll.sol";
import { ITally } from "./interfaces/ITally.sol";
import { IMessageProcessor } from "./interfaces/IMessageProcessor.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { IVerifier } from "./interfaces/IVerifier.sol";
import { IVkRegistry } from "./interfaces/IVkRegistry.sol";
import { CommonUtilities } from "./utilities/CommonUtilities.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";

/// @title Tally
/// @notice The Tally contract is used during votes tallying
/// and by users to verify the tally results.
contract Tally is Ownable, SnarkCommon, CommonUtilities, Hasher, DomainObjs, ITally {
  uint256 internal constant TREE_ARITY = 2;
  uint256 internal constant VOTE_OPTION_TREE_ARITY = 5;

  /// @notice Tally results
  struct TallyResult {
    /// Tally results value from tally.json
    uint256 value;
    /// Flag that this value was set and initialized
    bool flag;
  }

  /// @notice The commitment to the tally results. Its initial value is 0, but after
  /// the tally of each batch is proven on-chain via a zk-SNARK, it should be
  /// updated to:
  ///
  /// QV:
  /// hash3(
  ///   hashLeftRight(merkle root of current results, salt0)
  ///   hashLeftRight(number of spent voice credits, salt1),
  ///   hashLeftRight(merkle root of the no. of spent voice credits per vote option, salt2)
  /// )
  ///
  /// Non-QV:
  /// hash2(
  ///   hashLeftRight(merkle root of current results, salt0)
  ///   hashLeftRight(number of spent voice credits, salt1),
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
  Mode public immutable mode;

  // The tally results
  mapping(uint256 => TallyResult) public tallyResults;

  // The total tally results number
  uint256 public totalTallyResults;

  /// @notice custom errors
  error ProcessingNotComplete();
  error InvalidTallyVotesProof();
  error AllBallotsTallied();
  error NumSignUpsTooLarge();
  error BatchStartIndexTooLarge();
  error TallyBatchSizeTooLarge();
  error NotSupported();
  error VotesNotTallied();

  /// @notice Create a new Tally contract
  /// @param _verifier The Verifier contract
  /// @param _vkRegistry The VkRegistry contract
  /// @param _poll The Poll contract
  /// @param _mp The MessageProcessor contract
  /// @param _tallyOwner The owner of the Tally contract
  /// @param _mode The mode of the poll
  constructor(
    address _verifier,
    address _vkRegistry,
    address _poll,
    address _mp,
    address _tallyOwner,
    Mode _mode
  ) payable Ownable(_tallyOwner) {
    verifier = IVerifier(_verifier);
    vkRegistry = IVkRegistry(_vkRegistry);
    poll = IPoll(_poll);
    messageProcessor = IMessageProcessor(_mp);
    mode = _mode;
  }

  /// @notice Check if all ballots are tallied
  /// @return tallied whether all ballots are tallied
  function isTallied() public view returns (bool tallied) {
    (uint8 intStateTreeDepth, , , ) = poll.treeDepths();
    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    // Require that there are untallied ballots left
    tallied = tallyBatchNum * (TREE_ARITY ** intStateTreeDepth) >= numSignUps;
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

    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    // Require that there are untallied ballots left
    if (batchStartIndex >= numSignUps) {
      revert AllBallotsTallied();
    }

    // save some gas because we won't overflow uint256
    unchecked {
      tallyBatchNum++;
    }

    if (!verifyTallyProof(batchStartIndex, _newTallyCommitment, _proof)) {
      revert InvalidTallyVotesProof();
    }

    // Update the tally commitment and the tally batch num
    tallyCommitment = _newTallyCommitment;
  }

  /// @notice Get public circuit inputs.
  /// @param _batchStartIndex the batch start index
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @return publicInputs public circuit inputs
  function getPublicCircuitInputs(
    uint256 _batchStartIndex,
    uint256 _newTallyCommitment
  ) public view returns (uint256[] memory publicInputs) {
    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();

    publicInputs = new uint256[](5);
    publicInputs[0] = sbCommitment;
    publicInputs[1] = tallyCommitment;
    publicInputs[2] = _newTallyCommitment;
    publicInputs[3] = _batchStartIndex;
    publicInputs[4] = numSignUps;
  }

  /// @notice Verify the tally proof using the verifying key
  /// @param _batchStartIndex the batch start index
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @param _proof the proof generated after processing all messages
  /// @return isValid whether the proof is valid
  function verifyTallyProof(
    uint256 _batchStartIndex,
    uint256 _newTallyCommitment,
    uint256[8] calldata _proof
  ) public view returns (bool isValid) {
    (uint8 intStateTreeDepth, , , uint8 voteOptionTreeDepth) = poll.treeDepths();
    (IMACI maci, ) = poll.extContracts();
    uint256[] memory circuitPublicInputs = getPublicCircuitInputs(_batchStartIndex, _newTallyCommitment);

    // Get the verifying key
    VerifyingKey memory vk = vkRegistry.getTallyVk(maci.stateTreeDepth(), intStateTreeDepth, voteOptionTreeDepth, mode);
    // Verify the proof
    isValid = verifier.verify(_proof, vk, circuitPublicInputs);
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
    uint256 pos = _index % VOTE_OPTION_TREE_ARITY;
    current = _leaf;
    uint8 k;

    uint256[VOTE_OPTION_TREE_ARITY] memory level;

    for (uint8 i = 0; i < _depth; ++i) {
      for (uint8 j = 0; j < VOTE_OPTION_TREE_ARITY; ++j) {
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

      _index /= VOTE_OPTION_TREE_ARITY;
      pos = _index % VOTE_OPTION_TREE_ARITY;
      current = hash5(level);
    }
  }

  /// @notice Verify the number of spent voice credits from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @param _perVOSpentVoiceCreditsHash only for QV - hashLeftRight(merkle root of the no spent voice credits, salt)
  /// @return isValid Whether the provided values are valid
  function verifySpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) public view returns (bool isValid) {
    if (mode == Mode.QV) {
      isValid = verifyQvSpentVoiceCredits(_totalSpent, _totalSpentSalt, _resultCommitment, _perVOSpentVoiceCreditsHash);
    } else if (mode == Mode.NON_QV) {
      isValid = verifyNonQvSpentVoiceCredits(_totalSpent, _totalSpentSalt, _resultCommitment);
    }
  }

  /// @notice Verify the number of spent voice credits for QV from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, salt)
  /// @return isValid Whether the provided values are valid
  function verifyQvSpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) internal view returns (bool isValid) {
    uint256[3] memory tally;
    tally[0] = _resultCommitment;
    tally[1] = hashLeftRight(_totalSpent, _totalSpentSalt);
    tally[2] = _perVOSpentVoiceCreditsHash;

    isValid = hash3(tally) == tallyCommitment;
  }

  /// @notice Verify the number of spent voice credits for Non-QV from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @return isValid Whether the provided values are valid
  function verifyNonQvSpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment
  ) internal view returns (bool isValid) {
    uint256[2] memory tally;
    tally[0] = _resultCommitment;
    tally[1] = hashLeftRight(_totalSpent, _totalSpentSalt);

    isValid = hash2(tally) == tallyCommitment;
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
    if (mode != Mode.QV) {
      revert NotSupported();
    }

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

    if (mode == Mode.QV) {
      uint256[3] memory tally;
      tally[0] = hashLeftRight(computedRoot, _tallyResultSalt);
      tally[1] = _spentVoiceCreditsHash;
      tally[2] = _perVOSpentVoiceCreditsHash;

      isValid = hash3(tally) == tallyCommitment;
    } else if (mode == Mode.NON_QV) {
      uint256[2] memory tally;
      tally[0] = hashLeftRight(computedRoot, _tallyResultSalt);
      tally[1] = _spentVoiceCreditsHash;

      isValid = hash2(tally) == tallyCommitment;
    }
  }

  /**
   * @notice Add and verify tally results by batch.
   * @param _voteOptionIndices Vote option index.
   * @param _tallyResults The results of vote tally for the recipients.
   * @param _tallyResultProofs Proofs of correctness of the vote tally results.
   * @param _tallyResultSalt the respective salt in the results object in the tally.json
   * @param _spentVoiceCreditsHashes hashLeftRight(number of spent voice credits, spent salt)
   * @param _perVOSpentVoiceCreditsHashes hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
   */
  function addTallyResults(
    uint256[] calldata _voteOptionIndices,
    uint256[] calldata _tallyResults,
    uint256[][][] calldata _tallyResultProofs,
    uint256 _tallyResultSalt,
    uint256 _spentVoiceCreditsHashes,
    uint256 _perVOSpentVoiceCreditsHashes
  ) public virtual onlyOwner {
    if (!isTallied()) {
      revert VotesNotTallied();
    }

    (, , , uint8 voteOptionTreeDepth) = poll.treeDepths();
    uint256 voteOptionsLength = _voteOptionIndices.length;

    for (uint256 i = 0; i < voteOptionsLength; ) {
      addTallyResult(
        _voteOptionIndices[i],
        _tallyResults[i],
        _tallyResultProofs[i],
        _tallyResultSalt,
        _spentVoiceCreditsHashes,
        _perVOSpentVoiceCreditsHashes,
        voteOptionTreeDepth
      );

      unchecked {
        i++;
      }
    }
  }

  /**
   * @dev Add and verify tally votes and calculate sum of tally squares for alpha calculation.
   * @param _voteOptionIndex Vote option index.
   * @param _tallyResult The results of vote tally for the recipients.
   * @param _tallyResultProof Proofs of correctness of the vote tally results.
   * @param _tallyResultSalt the respective salt in the results object in the tally.json
   * @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
   * @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
   * @param _voteOptionTreeDepth vote option tree depth
   */
  function addTallyResult(
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt,
    uint256 _spentVoiceCreditsHash,
    uint256 _perVOSpentVoiceCreditsHash,
    uint8 _voteOptionTreeDepth
  ) internal virtual {
    bool isValid = verifyTallyResult(
      _voteOptionIndex,
      _tallyResult,
      _tallyResultProof,
      _tallyResultSalt,
      _voteOptionTreeDepth,
      _spentVoiceCreditsHash,
      _perVOSpentVoiceCreditsHash
    );

    if (!isValid) {
      revert InvalidTallyVotesProof();
    }

    TallyResult storage previous = tallyResults[_voteOptionIndex];

    if (!previous.flag) {
      totalTallyResults++;
    }

    previous.flag = true;
    previous.value = _tallyResult;
  }
}
