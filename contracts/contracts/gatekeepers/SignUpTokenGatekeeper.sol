// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from './SignUpGatekeeper.sol';
import { SignUpToken } from '../SignUpToken.sol';

import { MACI } from '../MACI.sol';

contract SignUpTokenGatekeeper is SignUpGatekeeper, Ownable {

    SignUpToken public token;
    MACI public maci;

    mapping (uint256 => bool) internal registeredTokenIds;

    constructor(SignUpToken _token) Ownable() {
        token = _token;
    }

    /*
     * Adds an uninitialised MACI instance to allow for token singups
     * @param _maci The MACI contract interface to be stored
     */
    function setMaciInstance(MACI _maci) public onlyOwner override {
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
        require(address(maci) == msg.sender, "SignUpTokenGatekeeper: only specified MACI instance can call this function");
        // Decode the given _data bytes into a uint256 which is the token ID
        uint256 tokenId = abi.decode(_data, (uint256));

        // Check if the user owns the token
        bool ownsToken = token.ownerOf(tokenId) == _user;
        require(ownsToken == true, "SignUpTokenGatekeeper: this user does not own the token");

        // Check if the token has already been used
        bool alreadyRegistered = registeredTokenIds[tokenId];
        require(alreadyRegistered == false, "SignUpTokenGatekeeper: this token has already been used to sign up");

        // Mark the token as already used
        registeredTokenIds[tokenId] = true;
    }
}
