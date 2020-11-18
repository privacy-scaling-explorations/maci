// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { SignUpGatekeeper } from './SignUpGatekeeper.sol';

contract FreeForAllGatekeeper is SignUpGatekeeper {

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {
    }
}
