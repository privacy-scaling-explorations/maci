// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";

/// @title FreeForAllGatekeeper
/// @notice A SignUpGatekeeper which allows anyone to sign up.
contract FreeForAllGatekeeper is SignUpGatekeeper {
  /// @notice Create a new instance of FreeForAllGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "FreeForAll";
  }
}
