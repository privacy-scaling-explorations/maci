// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";

/// @title SignUpTokenGatekeeper
/// @notice This contract allows to gatekeep MACI signups
/// by requiring new voters to own a certain ERC721 token
contract SignUpTokenGatekeeper is SignUpGatekeeper {
  /// @notice the reference to the SignUpToken contract
  ERC721 public immutable token;

  /// @notice a mapping of tokenIds to whether they have been used to sign up
  mapping(uint256 => bool) public registeredTokenIds;

  /// @notice custom errors
  error NotTokenOwner();

  /// @notice creates a new SignUpTokenGatekeeper
  /// @param _token the address of the ERC20 contract
  constructor(address _token) payable {
    token = ERC721(_token);
  }

  /// @notice Registers the user if they own the token with the token ID encoded in
  /// _data. Throws if the user does not own the token or if the token has
  /// already been used to sign up.
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The ABI-encoded tokenId as a uint256.
  function enforce(address _subject, bytes calldata _evidence) public override onlyTarget {
    // Decode the given _data bytes into a uint256 which is the token ID
    uint256 tokenId = abi.decode(_evidence, (uint256));

    // Check if the user owns the token
    bool ownsToken = token.ownerOf(tokenId) == _subject;
    if (!ownsToken) revert NotTokenOwner();

    // Check if the token has already been used
    bool alreadyRegistered = registeredTokenIds[tokenId];
    if (alreadyRegistered) revert AlreadyRegistered();

    // Mark the token as already used
    registeredTokenIds[tokenId] = true;
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "Token";
  }
}
