// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ITally
/// @notice Complete Tally interface
interface ITally {
  /// @notice Tally result
  struct TallyResult {
    /// Tally results value from tally.json
    uint256 value;
    /// Flag that this value was set and initialized
    bool isSet;
  }

  /// @notice tally result args
  struct AddTallyResultsArgs {
    /// @param voteOptionIndices Vote option index.
    uint256[] voteOptionIndices;
    /// @param tallyResults The results of vote tally for the recipients.
    uint256[] tallyResults;
    /// @param tallyResultProofs Proofs of correctness of the vote tally results.
    uint256[][][] tallyResultProofs;
    /// @param totalSpent spent field retrieved in the totalSpentVoiceCredits object
    uint256 totalSpent;
    /// @param totalSpentSalt spent salt
    uint256 totalSpentSalt;
    /// @param tallyResultSalt the respective salt in the results object in the tally.json
    uint256 tallyResultSalt;
    /// @param newResultsCommitment The salted commitment of the vote tally for this batch of
    /// leaves plus the vote tally from currentResults
    uint256 newResultsCommitment;
    /// @param spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
    uint256 spentVoiceCreditsHash;
    /// @param perVOSpentVoiceCreditsHash hashLeftRight(root noSpentVoiceCreditsPerVoteOption, perVoteOptionSpentVoiceCredits)
    uint256 perVOSpentVoiceCreditsHash;
  }

  /// @notice Add and verify tally results by batch.
  /// @param args add tally result args
  function addTallyResults(AddTallyResultsArgs calldata args) external;

  /// @notice Update the state and ballot root commitment
  function updateSbCommitment() external;

  /// @notice Verify the result of a tally batch
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @param _proof the proof generated after tallying this batch
  function tallyVotes(uint256 _newTallyCommitment, uint256[8] calldata _proof) external;

  /// @notice Check if all ballots are tallied
  /// @return tallied whether all ballots are tallied
  function isTallied() external view returns (bool tallied);

  /// @notice Get the tally commitment
  /// @return The current tally commitment
  function tallyCommitment() external view returns (uint256);

  /// @notice Get the tally batch number
  /// @return The current tally batch number
  function tallyBatchNum() external view returns (uint256);

  /// @notice Get the final state and ballot commitment
  /// @return The sb commitment
  function sbCommitment() external view returns (uint256);

  /// @notice Get tally results for a specific index
  /// @param index The index to query
  /// @return The tally result
  function getTallyResults(uint256 index) external view returns (TallyResult memory);

  /// @notice Get the total number of tally results
  /// @return The total tally results count
  function totalTallyResults() external view returns (uint256);

  /// @notice Get the total spent voice credits
  /// @return The total spent amount
  function totalSpent() external view returns (uint256);

  /// @notice Get public circuit inputs.
  /// @param _batchStartIndex the batch start index
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @return publicInputs public circuit inputs
  function getPublicCircuitInputs(
    uint256 _batchStartIndex,
    uint256 _newTallyCommitment
  ) external view returns (uint256[] memory publicInputs);

  /// @notice Verify the tally proof using the verifying key
  /// @param _batchStartIndex the batch start index
  /// @param _newTallyCommitment the new tally commitment to be verified
  /// @param _proof the proof generated after processing all messages
  /// @return isValid whether the proof is valid
  function verifyTallyProof(
    uint256 _batchStartIndex,
    uint256 _newTallyCommitment,
    uint256[8] calldata _proof
  ) external view returns (bool isValid);

  /// @notice Verify the number of spent voice credits per vote option from the tally.json
  /// @param _voteOptionIndex the index of the vote option where credits were spent
  /// @param _spent the spent voice credits for a given vote option index
  /// @param _spentProof proof generated for the perVoteOptionSpentVoiceCredits
  /// @param _spentSalt the corresponding salt given in the tally perVoteOptionSpentVoiceCredits object
  /// @param _voteOptionTreeDepth depth of the vote option tree
  /// @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt)
  // in the tally.json file
  /// @return isValid Whether the provided proof is valid
  function verifyPerVoteOptionSpentVoiceCredits(
    uint256 _voteOptionIndex,
    uint256 _spent,
    uint256[][] calldata _spentProof,
    uint256 _spentSalt,
    uint8 _voteOptionTreeDepth,
    uint256 _spentVoiceCreditsHash,
    uint256 _resultCommitment
  ) external view returns (bool isValid);

  /// @notice Verify the number of spent voice credits from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @param _perVoteOptionSpentVoiceCreditsHash only for QV - hashLeftRight(merkle root of the no spent voice credits, salt)
  /// @return isValid Whether the provided values are valid
  function verifySpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVoteOptionSpentVoiceCreditsHash
  ) external view returns (bool isValid);

  /// @notice Verify the result generated from the tally.json
  /// @param _voteOptionIndex the index of the vote option to verify the correctness of the tally
  /// @param _tallyResult Flattened array of the tally
  /// @param _tallyResultProof Corresponding proof of the tally result
  /// @param _tallyResultSalt the respective salt in the results object in the tally.json
  /// @param _voteOptionTreeDepth depth of the vote option tree
  /// @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
  /// @param _perVoteOptionSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice
  /// credits per vote option, perVoteOptionSpentVoiceCredits salt)
  /// @return isValid Whether the provided proof is valid
  function verifyTallyResult(
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt,
    uint8 _voteOptionTreeDepth,
    uint256 _spentVoiceCreditsHash,
    uint256 _perVoteOptionSpentVoiceCreditsHash
  ) external view returns (bool isValid);
}
