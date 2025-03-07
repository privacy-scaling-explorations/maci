// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { IAnonAadhaar } from "./interfaces/IAnonAadhaar.sol";

/// @title AnonAadhaarGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they can prove they are valid Aadhaar owners.
/// @dev Please note that once a identity is used to register, it cannot be used again.
/// This is because we store the nullifier of the proof.
contract AnonAadhaarGatekeeper is SignUpGatekeeper {
  /// @notice The anonAadhaar contract
  IAnonAadhaar public immutable anonAadhaarContract;

  /// @notice The registered identities
  mapping(uint256 => bool) public registeredAadhaars;

  /// @notice The nullifier seed
  uint256 public immutable nullifierSeed;

  /// @notice Errors
  error InvalidProof();
  error InvalidSignal();
  error InvalidNullifierSeed();

  /// @notice Create a new instance of the gatekeeper
  /// @param _anonAadhaarVerifierAddr The address of the anonAadhaar contract
  /// @param _nullifierSeed The nullifier seed specific to the app
  constructor(address _anonAadhaarVerifierAddr, uint256 _nullifierSeed) payable {
    if (_anonAadhaarVerifierAddr == address(0)) revert ZeroAddress();
    anonAadhaarContract = IAnonAadhaar(_anonAadhaarVerifierAddr);
    nullifierSeed = _nullifierSeed;
  }

  /// @notice Register an user if they can prove anonAadhaar proof
  /// @dev Throw if the proof is not valid or just complete silently
  /// @param _subject The address of the entity being validated.
  /// @param _evidence The ABI-encoded data containing nullifierSeed, nullifier, timestamp, signal, revealArray,
  /// and groth16Proof.
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    // decode the argument
    (
      uint256 providedNullifierSeed,
      uint256 nullifier,
      uint256 timestamp,
      uint256 signal,
      uint256[4] memory revealArray,
      uint256[8] memory groth16Proof
    ) = abi.decode(_evidence, (uint256, uint256, uint256, uint256, uint256[4], uint256[8]));

    // ensure that the provided nullifier seed matches the stored nullifier seed
    if (providedNullifierSeed != nullifierSeed) revert InvalidNullifierSeed();

    // ensure that the signal is correct
    if (signal != addressToUint256(_subject)) revert InvalidSignal();

    // ensure that the nullifier has not been registered yet
    if (registeredAadhaars[nullifier]) revert AlreadyRegistered();

    // register the nullifier so it cannot be called again with the same one
    registeredAadhaars[nullifier] = true;

    // check if the proof validates
    if (
      !anonAadhaarContract.verifyAnonAadhaarProof(
        providedNullifierSeed,
        nullifier,
        timestamp,
        signal,
        revealArray,
        groth16Proof
      )
    ) revert InvalidProof();
  }

  /// @dev Convert an address to uint256, used to check against signal.
  /// @param _addr: msg.sender address.
  /// @return Address msg.sender's address in uint256
  function addressToUint256(address _addr) private pure returns (uint256) {
    return uint256(uint160(_addr));
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "AnonAadhaar";
  }
}
