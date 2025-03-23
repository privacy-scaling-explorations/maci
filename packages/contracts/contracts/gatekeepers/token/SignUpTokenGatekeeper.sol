// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BasePolicy } from "@excubiae/contracts/policy/BasePolicy.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title SignUpTokenGatekeeper
/// @notice This contract allows to gatekeep MACI signups
/// by requiring new voters to own a certain ERC721 token
contract SignUpTokenGatekeeper is BasePolicy {
  /// @notice a mapping of tokenIds to whether they have been used to sign up
  mapping(uint256 => bool) public registeredTokenIds;

  /// @notice custom errors
  error AlreadyRegistered();

  /// @notice creates a new SignUpTokenGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Registers the user if they own the token with the token ID encoded in
  /// _data. Throws if the user does not own the token or if the token has
  /// already been used to sign up.
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The ABI-encoded tokenId as a uint256.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // Decode the given _data bytes into a uint256 which is the token ID
    uint256 tokenId = abi.decode(_evidence, (uint256));

    // Check if the token has already been used
    if (registeredTokenIds[tokenId]) {
      revert AlreadyRegistered();
    }

    // Mark the token as already used
    registeredTokenIds[tokenId] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "Token";
  }
}
