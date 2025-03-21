// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

import { IGitcoinPassportDecoder } from "./IGitcoinPassportDecoder.sol";

/// @title GitcoinPassportChecker
/// @notice GitcoinPassport validator.
/// @dev Extends BaseChecker to implement GitcoinPassport validation logic.
contract GitcoinPassportChecker is BaseChecker {
  /// @notice the gitcoin passport decoder instance
  IGitcoinPassportDecoder public passportDecoder;

  /// @notice the threshold score to be considered human
  uint256 public thresholdScore;

  /// @notice to get the score we need to divide by this factor
  uint256 public constant FACTOR = 100;

  /// @notice custom errors
  error ScoreTooLow();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (address _passportDecoder, uint256 _thresholdScore) = abi.decode(data, (address, uint256));

    passportDecoder = IGitcoinPassportDecoder(_passportDecoder);
    thresholdScore = _thresholdScore;
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate.
  /// @param evidence Encoded data used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // get the score from the GitcoinPassportDecoder contract
    uint256 score = passportDecoder.getScore(subject);

    // check if the score is enough
    if (score / FACTOR < thresholdScore) {
      revert ScoreTooLow();
    }

    return true;
  }
}
