// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { HatsGatekeeperBase } from "./HatsGatekeeperBase.sol";

/// @title HatsGatekeeperSingle
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are wearing a specified hat
contract HatsGatekeeperSingle is HatsGatekeeperBase {
  /*//////////////////////////////////////////////////////////////
                            PUBLIC CONSTANTS
  //////////////////////////////////////////////////////////////*/

  /// @notice The hat that users must wear to be eligible to register
  uint256 public immutable criterionHat;

  /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
  //////////////////////////////////////////////////////////////*/

  /// @notice Deploy an instance of HatsGatekeeperSingle
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHat The required hat
  constructor(address _hats, uint256 _criterionHat) payable HatsGatekeeperBase(_hats) {
    criterionHat = _criterionHat;
  }

  /*//////////////////////////////////////////////////////////////
                            GATEKEEPER FUNCTION
  //////////////////////////////////////////////////////////////*/

  /// @notice Registers the user
  /// @param _user The address of the user
  function register(address _user, bytes memory /*_data*/) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // _user must not be already registered
    if (registered[_user]) revert AlreadyRegistered();

    registered[_user] = true;

    // _user must be wearing the criterion hat
    if (!hats.isWearerOfHat(_user, criterionHat)) revert NotWearingCriterionHat();
  }
}
