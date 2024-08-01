// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockGitcoinPassportDecoder
/// @notice A mock contract to test the GitcoinPassportDecoder gatekeeper
contract MockGitcoinPassportDecoder {
  uint256 public score;

  /// @notice Get the score of a user's passport
  /// @param _user The address of the user
  function getScore(address _user) external returns (uint256) {
    return score;
  }

  /// @notice Change the return value of getScore
  function changeScore(uint256 newScore) external {
    score = newScore;
  }
}
