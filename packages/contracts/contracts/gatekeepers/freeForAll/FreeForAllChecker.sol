// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";

/// @title FreeForAllChecker
/// @notice Free for all validator.
/// @dev Extends BaseChecker to implement FreeForAll validation logic.
contract FreeForAllChecker is BaseChecker {
  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();
  }

  /// @notice Returns true for everycall.
  /// @param subject Address to validate ownership for.
  /// @param evidence Encoded token ID used for validation.
  /// @return Boolean indicating whether the subject owns the token.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    return true;
  }
}
