// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IHats } from "./interfaces/IHats.sol";
import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title HatsGatekeeperBase
/// @notice Abstract contract containing the base elements of a Hats Gatekeeper contract
abstract contract HatsGatekeeperBase is SignUpGatekeeper {
  /// @notice Custom errors
  error NotWearingCriterionHat();

  /// @notice The Hats Protocol contract address
  IHats public immutable hats;

  /// @notice Tracks registered users
  mapping(address => bool) public registered;

  /// @notice Deploy an instance of HatsGatekeeper
  /// @param _hats The Hats Protocol contract
  constructor(address _hats) payable {
    hats = IHats(_hats);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure virtual override returns (string memory) {
    return "Hats";
  }
}
