// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { MACI } from "../MACI.sol";

/// @title FreeForAllGatekeeper
/// @notice A SignUpGatekeeper which allows anyone to sign up.
contract FreeForAllGatekeeper is SignUpGatekeeper {
  /// @notice setMaciInstance does nothing in this gatekeeper
  /// @param _maci The MACI contract
  function setMaciInstance(MACI _maci) public override {}

  /// @notice Registers the user without any restrictions.
  /// @param _address The address of the user
  /// @param _data memory additional data
  function register(address _address, bytes memory _data) public override {}
}
