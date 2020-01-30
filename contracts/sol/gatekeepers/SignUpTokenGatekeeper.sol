pragma solidity ^0.5.0;

import { SignUpGatekeeper } from './SignUpGatekeeper.sol';
import { SignUpToken } from '../SignUpToken.sol';

contract SignUpTokenGatekeeper is SignUpGatekeeper {

    SignUpToken token;

    mapping (uint256 => bool) internal registeredTokenIds;

    constructor(SignUpToken _token) public {
        token = _token;
    }

    function decodeTokenId(bytes memory _data) internal returns (uint256) {

        return abi.decode(_data, (uint256));
    }

    /*
     * Registers the user if they own the token with the token ID encoded in
     * _data. Throws if the user is does not own the token or if the token has
     * already been used to sign up.
     * @param _user The user's Ethereum address.
     * @param _data The ABI-encoded tokenId as a uint256.
     */
    function register(address _user, bytes memory _data) public {
        uint256 tokenId = decodeTokenId(_data);
        
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
