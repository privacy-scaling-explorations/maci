// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "../SignUpGatekeeper.sol";

import { ZupassGroth16Verifier } from "./ZupassGroth16Verifier.sol";

/// @title ZupassGatekeeper
/// @notice This contract allows to gatekeep MACI signups
/// by requiring new voters to own a certain Zupass event ticket
contract ZupassGatekeeper is SignUpGatekeeper, Ownable(msg.sender) {
  /// @notice the Zupass event UUID converted to bigint
  uint256 public immutable validEventId;

  /// @notice the Zupass event signer converted to bigint
  uint256 public immutable validSigner1;
  uint256 public immutable validSigner2;

  /// @notice the ZupassGroth16Verifier contract address
  ZupassGroth16Verifier public immutable verifier;

  /// @notice the reference to the MACI contract
  address public maci;

  /// @notice a mapping of ticket IDs to whether they have been used
  mapping(uint256 => bool) public registeredTickets;

  /// @notice custom errors
  error AlreadyRegistered();
  error InvalidProof();
  error InvalidEventId();
  error InvalidSigners();
  error InvalidWatermark();
  error OnlyMACI();
  error ZeroAddress();

  /// @notice Creates a new ZupassGatekeeper
  /// @param _validEventId Zupass event UUID converted to bigint
  /// @param _validSigner1 Zupass event signer[0] converted to bigint
  /// @param _validSigner2 Zupass event signer[1] converted to bigint
  /// @param _verifier The ZupassGroth16Verifier contract address
  constructor(uint256 _validEventId, uint256 _validSigner1, uint256 _validSigner2, address _verifier) payable {
    validEventId = _validEventId;
    validSigner1 = _validSigner1;
    validSigner2 = _validSigner2;
    verifier = ZupassGroth16Verifier(_verifier);
  }

  /// @notice Adds an uninitialised MACI instance to allow for token signups
  /// @param _maci The MACI contract interface to be stored
  function setMaciInstance(address _maci) public override onlyOwner {
    if (_maci == address(0)) revert ZeroAddress();
    maci = _maci;
  }

  /// @notice Registers the user only if they have the Zupass event ticket
  /// @param _user The user's Ethereum address.
  /// @param _data The ABI-encoded proof and public signals.
  function register(address _user, bytes memory _data) public override {
    if (maci != msg.sender) revert OnlyMACI();

    // Decode the given _data bytes
    (uint256[2] memory _pA, uint256[2][2] memory _pB, uint256[2] memory _pC, uint256[38] memory _pubSignals) = abi
      .decode(_data, (uint256[2], uint256[2][2], uint256[2], uint256[38]));

    // Ticket ID is stored at index 0
    uint256 ticketId = _pubSignals[0];
    if (registeredTickets[ticketId]) revert AlreadyRegistered();

    registeredTickets[ticketId] = true;

    // Verify proof
    if (!verifier.verifyProof(_pA, _pB, _pC, _pubSignals)) revert InvalidProof();

    // Event id is stored at index 1
    if (_pubSignals[1] != validEventId) revert InvalidEventId();

    // Signers are stored at index 13 and 14
    if (_pubSignals[13] != validSigner1 || _pubSignals[14] != validSigner2) revert InvalidSigners();

    // Watermark is stored at index 37
    // user address converted to bigint is used as the watermark
    if (_pubSignals[37] != uint256(uint160(_user))) revert InvalidWatermark();
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function getTrait() public pure override returns (string memory) {
    return "Zupass";
  }
}
