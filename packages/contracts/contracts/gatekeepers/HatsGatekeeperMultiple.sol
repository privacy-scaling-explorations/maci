// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { HatsGatekeeperBase } from "./HatsGatekeeperBase.sol";

/// @title HatsGatekeeperMultiple
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are wearing one of the specified hats
contract HatsGatekeeperMultiple is HatsGatekeeperBase {
  /// @notice Custom errors
  error NotCriterionHat();

  /// @notice Tracks hats that users must wear to be eligible to register
  mapping(uint256 => bool) public criterionHat;

  /// @notice Deploy an instance of HatsGatekeeperMultiple
  /// @param _hats The Hats Protocol contract
  /// @param _criterionHats Array of accepted criterion hats
  constructor(address _hats, uint256[] memory _criterionHats) payable HatsGatekeeperBase(_hats) {
    // add the criterion hats
    for (uint256 i; i < _criterionHats.length; ++i) {
      criterionHat[_criterionHats[i]] = true;
    }
  }

  /// @notice Registers the user
  /// @param _subject The address of the user
  /// @param _evidence additional data
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    // _subject must not be already registered
    if (registered[_subject]) revert AlreadyRegistered();

    // decode the _data as a hat
    uint256 hat = abi.decode(_evidence, (uint256));

    // the hat must be set as a criterion hat
    if (!criterionHat[hat]) revert NotCriterionHat();

    registered[_subject] = true;

    // _subject must be wearing the criterion hat
    if (!hats.isWearerOfHat(_subject, hat)) revert NotWearingCriterionHat();
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "HatsMultiple";
  }
}
