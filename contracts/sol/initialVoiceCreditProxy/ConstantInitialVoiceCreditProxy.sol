// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import { InitialVoiceCreditProxy } from './InitialVoiceCreditProxy.sol';

contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {

    uint256 internal balance;

    constructor(uint256 _balance) public {
        balance = _balance;
    }

    function getVoiceCredits(address, bytes memory) override public view returns (uint256) {
        return balance;
    }
}
