// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { ISemaphore } from "../interfaces/ISemaphore.sol";

/// @title SemaphoreGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they can prove they are part of a semaphore group.
/// @dev Please note that once a identity is used to register, it cannot be used again.
/// This is because we store the nullifier which is
/// hash(secret, groupId)
contract SemaphoreGatekeeper is SignUpGatekeeper, Ownable(msg.sender) {
  /// @notice The group id of the semaphore group
  uint256 public immutable groupId;

  /// @notice The semaphore contract
  ISemaphore public immutable semaphoreContract;

  /// @notice The address of the MACI contract
  address public maci;

  /// @notice The registered identities
  mapping(uint256 => bool) public registeredIdentities;

  /// @notice Errors
  error ZeroAddress();
  error OnlyMACI();
  error AlreadyRegistered();
  error InvalidGroup();
  error InvalidProof();

  /// @notice Create a new instance of the gatekeeper
  /// @param _semaphoreContract The address of the semaphore contract
  /// @param _groupId The group id of the semaphore group
  constructor(address _semaphoreContract, uint256 _groupId) payable {
    if (_semaphoreContract == address(0)) revert ZeroAddress();
    semaphoreContract = ISemaphore(_semaphoreContract);
    groupId = _groupId;
  }

  /// @notice Adds an uninitialised MACI instance to allow for token signups
  /// @param _maci The MACI contract interface to be stored
  function setMaciInstance(address _maci) public override onlyOwner {
    if (_maci == address(0)) revert ZeroAddress();
    maci = _maci;
  }

  /// @notice Register an user if they can prove they belong to a semaphore group
  /// @dev Throw if the proof is not valid or just complete silently
  /// @param _data The ABI-encoded schemaId as a uint256.
  function register(address /*_user*/, bytes memory _data) public override {
    // decode the argument
    ISemaphore.SemaphoreProof memory proof = abi.decode(_data, (ISemaphore.SemaphoreProof));

    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // ensure that the nullifier has not been registered yet
    if (registeredIdentities[proof.nullifier]) revert AlreadyRegistered();

    // check that the scope is equal to the group id
    if (proof.scope != groupId) revert InvalidGroup();

    // register the nullifier so it cannot be called again with the same one
    // note that given the nullifier will be hash(secret, groupId), the same
    // identity cannot then be registered twice for this group
    registeredIdentities[proof.nullifier] = true;

    // check if the proof validates
    if (!semaphoreContract.verifyProof(proof.scope, proof)) revert InvalidProof();
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function getTrait() public pure override returns (string memory) {
    return "Semaphore";
  }
}
