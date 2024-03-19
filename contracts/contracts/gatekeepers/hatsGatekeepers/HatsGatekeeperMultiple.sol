// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { HatsGatekeeperBase } from "./HatsGatekeeperBase.sol";

/// @title HatsGatekeeperMultiple
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are wearing one of the specified hats
contract HatsGatekeeperMultiple is HatsGatekeeperBase {
  /*//////////////////////////////////////////////////////////////
                              CUSTOM ERRORS
  //////////////////////////////////////////////////////////////*/

  error NotCriterionHat();

  /*//////////////////////////////////////////////////////////////
                            PUBLIC CONSTANTS
  //////////////////////////////////////////////////////////////*/

  /// @notice Tracks hats that users must wear to be eligible to register
  mapping(uint256 => bool) public criterionHat;

  /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
  //////////////////////////////////////////////////////////////*/

  /// @notice Deploy an instance of HatsGatekeeperMultiple
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHats Array of accepted criterion hats
  constructor(address _hats, uint256[] memory _criterionHats) payable HatsGatekeeperBase(_hats) {
    // add the criterion hats
    for (uint256 i; i < _criterionHats.length; ++i) {
      criterionHat[_criterionHats[i]] = true;
    }
  }

  /*//////////////////////////////////////////////////////////////
                            GATEKEEPER FUNCTION
  //////////////////////////////////////////////////////////////*/

  /// @notice Registers the user
  /// @param _user The address of the user
  /// @param _data additional data
  function register(address _user, bytes memory _data) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // _user must not be already registered
    if (registered[_user]) revert AlreadyRegistered();

    // decode the _data as a hat
    uint256 hat = abi.decode(_data, (uint256));

    // the hat must be set as a criterion hat
    if (!criterionHat[hat]) revert NotCriterionHat();

    registered[_user] = true;

    // _user must be wearing the criterion hat
    if (!hats.isWearerOfHat(_user, hat)) revert NotWearingCriterionHat();
  }
}
