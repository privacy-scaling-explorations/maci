// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title ITally
/// @notice Tally interface
interface ITally {
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
    /// @param newResultsCommitment The salted commitment of the vote tally for this batch of leaves plus the vote tally from currentResults
    uint256 newResultsCommitment;
    /// @param spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
    uint256 spentVoiceCreditsHash;
    /// @param perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
    uint256 perVOSpentVoiceCreditsHash;
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
  ) external view returns (bool);

  /// @notice Verify the number of spent voice credits from the tally.json
  /// @param _totalSpent spent field retrieved in the totalSpentVoiceCredits object
  /// @param _totalSpentSalt the corresponding salt in the totalSpentVoiceCredit object
  /// @param _resultCommitment hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file
  /// @param _perVOSpentVoiceCreditsHash only for QV - hashLeftRight(merkle root of the no spent voice credits, salt)
  function verifySpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) external view returns (bool);
}
