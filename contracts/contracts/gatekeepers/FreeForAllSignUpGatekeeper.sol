// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title FreeForAllGatekeeper
/// @notice A SignUpGatekeeper which allows anyone to sign up.
contract FreeForAllGatekeeper is SignUpGatekeeper {
  /// @notice Create a new instance of FreeForAllGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice setMaciInstance does nothing in this gatekeeper
  /// @param _maci The MACI contract
  // solhint-disable-next-line no-empty-blocks
  function setMaciInstance(address _maci) public override {}

  /// @notice Registers the user without any restrictions.
  /// @param _address The address of the user
  /// @param _data memory additional data
  // solhint-disable-next-line no-empty-blocks
  function register(address _address, bytes memory _data) public override {}
}
