// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { InitialVoiceCreditProxy } from './InitialVoiceCreditProxy.sol';

contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {

    uint256 internal balance;

    constructor(uint256 _balance) { 
        balance = _balance;
    }

    function getVoiceCredits(address, bytes memory) public view override returns (uint256) {
        return balance;
    }
}
