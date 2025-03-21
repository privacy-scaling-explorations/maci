// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BaseChecker } from "@excubiae/contracts/checker/BaseChecker.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title SignUpTokenChecker
/// @notice Implements proof of membership validation using ERC721 ownership.
/// @dev Inherits from BaseChecker to extend the validation logic.
contract SignUpTokenChecker is BaseChecker {
  /// @notice the reference to the SignUpToken contract
  ERC721 public token;

  /// @notice custom errors
  error NotTokenOwner();

  /// @notice Initializes the SignUpTokenChecker with the provided ERC721 token contract address.
  /// @dev Decodes initialization parameters from appended bytes for clone deployments.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    address _token = abi.decode(data, (address));

    token = ERC721(_token);
  }

  /// @notice Throws errors if evidence and subject are not valid.
  /// @param subject Address to validate.
  /// @param evidence Encoded data used for validation.
  /// @return Boolean indicating whether the subject passes the check.
  function _check(address subject, bytes calldata evidence) internal view override returns (bool) {
    super._check(subject, evidence);

    // Decode the given _data bytes into a uint256 which is the token ID
    uint256 tokenId = abi.decode(evidence, (uint256));

    // Check if the user owns the token
    if (token.ownerOf(tokenId) != subject) {
      revert NotTokenOwner();
    }

    return true;
  }
}
