// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { HatsGatekeeperBase } from "./HatsGatekeeperBase.sol";

/// @title HatsGatekeeperSingle
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are wearing a specified hat
contract HatsGatekeeperSingle is HatsGatekeeperBase {
  /// @notice The hat that users must wear to be eligible to register
  uint256 public immutable criterionHat;

  /// @notice Deploy an instance of HatsGatekeeperSingle
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHat The required hat
  constructor(address _hats, uint256 _criterionHat) payable HatsGatekeeperBase(_hats) {
    criterionHat = _criterionHat;
  }

  /// @notice Registers the user
  /// @param _subject The address of the user
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    // _subject must not be already registered
    if (registered[_subject]) revert AlreadyRegistered();

    registered[_subject] = true;

    // _subject must be wearing the criterion hat
    if (!hats.isWearerOfHat(_subject, criterionHat)) revert NotWearingCriterionHat();
  }
}
