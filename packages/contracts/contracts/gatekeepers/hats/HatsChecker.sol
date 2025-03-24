// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

import { IHats } from "./IHats.sol";

/// @title HatsChecker
/// @notice Hats validator.
/// @dev Extends BaseChecker to implement Hats validation logic.
contract HatsChecker is BaseChecker {
  /// @notice The Hats Protocol contract address
  IHats public hats;

  /// @notice Tracks hats that users must wear to be eligible to register
  mapping(uint256 => bool) public criterionHats;

  /// @notice Custom errors
  error NotCriterionHat();
  error NotWearingCriterionHat();

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (address _hats, uint256[] memory _criterionHats) = abi.decode(data, (address, uint256[]));

    hats = IHats(_hats);

    // add the criterion hats
    for (uint256 i = 0; i < _criterionHats.length; i++) {
      criterionHats[_criterionHats[i]] = true;
    }
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate.
  /// @param evidence Encoded data used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // decode the _data as a hat
    uint256 hat = abi.decode(evidence, (uint256));

    // the hat must be set as a criterion hat
    if (!criterionHats[hat]) {
      revert NotCriterionHat();
    }

    // _subject must be wearing the criterion hat
    if (!hats.isWearerOfHat(subject, hat)) {
      revert NotWearingCriterionHat();
    }

    return true;
  }
}
