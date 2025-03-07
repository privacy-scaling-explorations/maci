// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { IGitcoinPassportDecoder } from "./interfaces/IGitcoinPassportDecoder.sol";

/// @title GitcoinPassportGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they've received an attestation of a specific schema from a trusted attester
contract GitcoinPassportGatekeeper is SignUpGatekeeper {
  /// @notice the gitcoin passport decoder instance
  IGitcoinPassportDecoder public immutable passportDecoder;

  /// @notice the threshold score to be considered human
  uint256 public immutable thresholdScore;

  /// @notice to get the score we need to divide by this factor
  uint256 public constant FACTOR = 100;

  // a mapping of attestations that have already registered
  mapping(address => bool) public registeredUsers;

  /// @notice custom errors
  error ScoreTooLow();

  /// @notice Deploy an instance of GitcoinPassportGatekeeper
  /// @param _passportDecoder The GitcoinPassportDecoder contract
  /// @param _thresholdScore The threshold score to be considered human
  constructor(address _passportDecoder, uint256 _thresholdScore) payable {
    if (_passportDecoder == address(0)) revert ZeroAddress();
    passportDecoder = IGitcoinPassportDecoder(_passportDecoder);
    thresholdScore = _thresholdScore;
  }

  /// @notice Register an user based on their attestation
  /// @dev Throw if the attestation is not valid or just complete silently
  /// @param _subject The user's Ethereum address.
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    // ensure that the user has not been registered yet
    if (registeredUsers[_subject]) revert AlreadyRegistered();

    // register the user so it cannot register again
    registeredUsers[_subject] = true;

    // get the score from the GitcoinPassportDecoder contract
    uint256 score = passportDecoder.getScore(_subject);

    // check if the score is enough
    if (score / FACTOR < thresholdScore) {
      revert ScoreTooLow();
    }
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "GitcoinPassport";
  }
}
