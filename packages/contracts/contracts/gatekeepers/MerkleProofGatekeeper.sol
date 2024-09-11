// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title MerkleProofGatekeeper
/// @notice A gatekeeper contract which allows users to sign up to MACI
/// only if they are part of the tree
contract MerkleProofGatekeeper is SignUpGatekeeper, Ownable(msg.sender) {
  // the merkle tree root
  bytes32 public immutable root;

  /// @notice the reference to the MACI contract
  address public maci;

  // a mapping of addresses that have already registered
  mapping(address => bool) public registeredAddresses;

  /// @notice custom errors
  error InvalidProof();
  error AlreadyRegistered();
  error OnlyMACI();
  error ZeroAddress();
  error InvalidRoot();

  /// @notice Deploy an instance of MerkleProofGatekeeper
  /// @param _root The tree root
  constructor(bytes32 _root) payable {
    if (_root == bytes32(0)) revert InvalidRoot();
    root = _root;
  }

  /// @notice Adds an uninitialised MACI instance to allow for token signups
  /// @param _maci The MACI contract interface to be stored
  function setMaciInstance(address _maci) public override onlyOwner {
    if (_maci == address(0)) revert ZeroAddress();
    maci = _maci;
  }

  /// @notice Register an user based on being part of the tree
  /// @dev Throw if the proof is not valid or the user has already been registered
  /// @param _user The user's Ethereum address.
  /// @param _data The proof that the user is part of the tree.
  function register(address _user, bytes memory _data) public override {
    // ensure that the caller is the MACI contract
    if (maci != msg.sender) revert OnlyMACI();

    bytes32[] memory proof = abi.decode(_data, (bytes32[]));

    // ensure that the user has not been registered yet
    if (registeredAddresses[_user]) revert AlreadyRegistered();

    // register the user so it cannot be called again with the same one
    registeredAddresses[_user] = true;

    // get the leaf
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_user))));

    // check the proof
    if (!MerkleProof.verify(proof, root, leaf)) revert InvalidProof();
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function getTrait() public pure override returns (string memory) {
    return "MerkleProof";
  }
}
