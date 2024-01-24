// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { IEAS } from "../interfaces/IEAS.sol";

/// @title EASGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they own an attestation from a valid schema and trusted attester.
contract EASGatekeeper is SignUpGatekeeper, Ownable {
  // the reference to the EAS contract
  IEAS private immutable eas;

  // the schema to check against
  bytes32 public immutable schema;

  // the trusted attester
  address public immutable attester;

  /// @notice the reference to the MACI contract
  address public maci;

  // a mapping of attestations that have already registered
  mapping(bytes32 => bool) public registeredAttestations;

  /// @notice custom errors
  error AttestationRevoked();
  error AlreadyRegistered();
  error AttesterNotTrusted();
  error NotYourAttestation();
  error InvalidSchema();
  error OnlyMACI();
  error ZeroAddress();

  /// @notice Deploy an instance of EASGatekeeper
  /// @param _eas The EAS contract
  /// @param _attester The trusted attester
  /// @param _schema The schema UID
  constructor(address _eas, address _attester, bytes32 _schema) payable Ownable() {
    if (_eas == address(0) || _attester == address(0)) revert ZeroAddress();
    eas = IEAS(_eas);
    schema = _schema;
    attester = _attester;
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
  /// @param _data The ABI-encoded schemaId as a uint256.
  function register(address _user, bytes memory _data) public override {
    // decode the argument
    bytes32 attestationId = abi.decode(_data, (bytes32));

    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    // ensure that the attestation has not been registered yet
    if (registeredAttestations[attestationId]) revert AlreadyRegistered();

    // register the attestation so it cannot be called again with the same one
    registeredAttestations[attestationId] = true;

    // get the attestation from the EAS contract
    IEAS.Attestation memory attestation = eas.getAttestation(attestationId);

    // the schema must match
    if (attestation.schema != schema) revert InvalidSchema();

    // we check that the attestation attester is the trusted one
    if (attestation.attester != attester) revert AttesterNotTrusted();

    // we check that it was not revoked
    if (attestation.revocationTime != 0) revert AttestationRevoked();

    // one cannot register an attestation for another user
    if (attestation.recipient != _user) revert NotYourAttestation();
  }
}
