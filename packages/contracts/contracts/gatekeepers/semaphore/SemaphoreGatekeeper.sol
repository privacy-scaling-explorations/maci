// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BasePolicy } from "@excubiae/contracts/policy/BasePolicy.sol";

import { ISemaphore } from "./ISemaphore.sol";

/// @title SemaphoreGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they can prove they are part of a semaphore group.
/// @dev Please note that once a identity is used to register, it cannot be used again.
/// This is because we store the nullifier which is
/// hash(secret, groupId)
contract SemaphoreGatekeeper is BasePolicy {
  /// @notice The registered identities
  mapping(uint256 => bool) public spentNullifiers;

  /// @notice custom errors
  error AlreadyRegistered();

  /// @notice Create a new instance of the gatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Register an user if they can prove they belong to a semaphore group
  /// @dev Throw if the proof is not valid or just complete silently
  /// @param _evidence The ABI-encoded schemaId as a uint256.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    ISemaphore.SemaphoreProof memory proof = abi.decode(_evidence, (ISemaphore.SemaphoreProof));
    uint256 _nullifier = proof.nullifier;

    if (spentNullifiers[_nullifier]) {
      revert AlreadyRegistered();
    }

    spentNullifiers[_nullifier] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "Semaphore";
  }
}
