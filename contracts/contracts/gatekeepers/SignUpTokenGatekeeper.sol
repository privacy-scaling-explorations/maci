// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "./SignUpGatekeeper.sol";
import { SignUpToken } from "../SignUpToken.sol";

import { MACI } from "../MACI.sol";

contract SignUpTokenGatekeeper is SignUpGatekeeper, Ownable {
  SignUpToken public token;
  MACI public maci;

  mapping(uint256 => bool) internal registeredTokenIds;

  error AlreadyRegistered();
  error NotTokenOwner();
  error OnlyMACI();

  constructor(SignUpToken _token) Ownable() {
    token = _token;
  }

  /*
   * Adds an uninitialised MACI instance to allow for token singups
   * @param _maci The MACI contract interface to be stored
   */
  function setMaciInstance(MACI _maci) public override onlyOwner {
    maci = _maci;
  }

  /*
   * Registers the user if they own the token with the token ID encoded in
   * _data. Throws if the user is does not own the token or if the token has
   * already been used to sign up.
   * @param _user The user's Ethereum address.
   * @param _data The ABI-encoded tokenId as a uint256.
   */
  function register(address _user, bytes memory _data) public override {
    if (address(maci) != msg.sender) revert OnlyMACI();
    // Decode the given _data bytes into a uint256 which is the token ID
    uint256 tokenId = abi.decode(_data, (uint256));

    // Check if the user owns the token
    bool ownsToken = token.ownerOf(tokenId) == _user;
    if (!ownsToken) revert NotTokenOwner();

    // Check if the token has already been used
    bool alreadyRegistered = registeredTokenIds[tokenId];
    if (alreadyRegistered) revert AlreadyRegistered();

    // Mark the token as already used
    registeredTokenIds[tokenId] = true;
  }
}
