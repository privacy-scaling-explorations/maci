// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BasePolicy } from "@excubiae/contracts/policy/BasePolicy.sol";

/// @title AnonAadhaarGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they can prove they are valid Aadhaar owners.
/// @dev Please note that once a identity is used to register, it cannot be used again.
/// This is because we store the nullifier of the proof.
contract AnonAadhaarGatekeeper is BasePolicy {
  /// @notice The registered identities
  mapping(uint256 => bool) public registeredAadhaars;

  /// @notice custom errors
  error AlreadyRegistered();

  /// @notice Create a new instance of AnonAadhaarGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Register an user if they can prove anonAadhaar proof
  /// @dev Throw if the proof is not valid or just complete silently
  /// @param _subject The address of the entity being validated.
  /// @param _evidence The ABI-encoded data containing nullifierSeed, nullifier, timestamp, signal, revealArray,
  /// and groth16Proof.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // decode the argument
    (uint256 providedNullifierSeed, uint256 nullifier, , , , ) = abi.decode(
      _evidence,
      (uint256, uint256, uint256, uint256, uint256[4], uint256[8])
    );

    // ensure that the nullifier has not been registered yet
    if (registeredAadhaars[nullifier]) {
      revert AlreadyRegistered();
    }

    // register the nullifier so it cannot be called again with the same one
    registeredAadhaars[nullifier] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "AnonAadhaar";
  }
}
