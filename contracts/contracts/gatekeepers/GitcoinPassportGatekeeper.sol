// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { IGitcoinPassportDecoder } from "../interfaces/IGitcoinPassportDecoder.sol";

/// @title GitcoinPassportGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they've received an attestation of a specific schema from a trusted attester
contract GitcoinPassportGatekeeper is SignUpGatekeeper, Ownable(msg.sender) {
  /// @notice the gitcoin passport decoder instance
  IGitcoinPassportDecoder public immutable passportDecoder;

  /// @notice the reference to the MACI contract
  address public maci;

  /// @notice the threshold score to be considered human
  uint256 public immutable thresholdScore;

  /// @notice to get the score we need to divide by this factor
  uint256 public constant FACTOR = 100;

  // a mapping of attestations that have already registered
  mapping(address => bool) public registeredUsers;

  /// @notice custom errors
  error AlreadyRegistered();
  error OnlyMACI();
  error ZeroAddress();
  error ScoreTooLow();

  /// @notice Deploy an instance of GitcoinPassportGatekeeper
  /// @param _passportDecoder The GitcoinPassportDecoder contract
  /// @param _thresholdScore The threshold score to be considered human
  constructor(address _passportDecoder, uint256 _thresholdScore) payable {
    if (_passportDecoder == address(0)) revert ZeroAddress();
    passportDecoder = IGitcoinPassportDecoder(_passportDecoder);
    thresholdScore = _thresholdScore;
  }

  /// @notice Adds an uninitialised MACI instance to allow for token signups
  /// @param _maci The MACI contract interface to be stored
  function setMaciInstance(address _maci) public override onlyOwner {
    if (_maci == address(0)) revert ZeroAddress();
    maci = _maci;
  }

  /// @notice Register an user based on their attestation
  /// @dev Throw if the attestation is not valid or just complete silently
  /// @param _user The user's Ethereum address.
  function register(address _user, bytes memory /*_data*/) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // ensure that the user has not been registered yet
    if (registeredUsers[_user]) revert AlreadyRegistered();

    // register the user so it cannot register again
    registeredUsers[_user] = true;

    // get the score from the GitcoinPassportDecoder contract
    uint256 score = passportDecoder.getScore(_user);

    // check if the score is enough
    if (score / FACTOR < thresholdScore) {
      revert ScoreTooLow();
    }
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function getTrait() public pure override returns (string memory) {
    return "GitcoinPassport";
  }
}
