// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ITally } from "../interfaces/ITally.sol";

contract MockTally is ITally {
  bool public returnValue = true;

  /// @notice Flip the return value
  /// @dev used for mock testing
  function flipReturnValue() external {
    returnValue = !returnValue;
  }

  /// @inheritdoc ITally
  function verifyPerVOSpentVoiceCredits(
    uint256 _voteOptionIndex,
    uint256 _spent,
    uint256[][] calldata _spentProof,
    uint256 _spentSalt,
    uint8 _voteOptionTreeDepth,
    uint256 _spentVoiceCreditsHash,
    uint256 _resultCommitment
  ) external view returns (bool) {
    return returnValue;
  }

  /// @inheritdoc ITally
  function verifySpentVoiceCredits(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _resultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) external view returns (bool) {
    return returnValue;
  }
}
