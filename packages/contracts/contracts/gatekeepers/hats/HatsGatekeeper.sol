// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";
import { IHats } from "./IHats.sol";

/// @title HatsGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are wearing one of the specified hats
contract HatsGatekeeper is SignUpGatekeeper {
  /// @notice Tracks registered users
  mapping(address => bool) public registered;

  /// @notice Deploy an instance of HatsGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Registers the user
  /// @param _subject The address of the user
  /// @param _evidence additional data
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // _subject must not be already registered
    if (registered[_subject]) revert AlreadyRegistered();

    registered[_subject] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure virtual override returns (string memory) {
    return "Hats";
  }
}
