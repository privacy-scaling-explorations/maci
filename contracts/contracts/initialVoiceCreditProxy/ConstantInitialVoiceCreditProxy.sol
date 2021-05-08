// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

abstract contract InitialVoiceCreditProxy {
    function getVoiceCredits(address _user, bytes memory _data) public virtual view returns (uint256) {}
}

contract ConstantInitialVoiceCreditProxy is InitialVoiceCreditProxy {

    uint256 internal balance;

    constructor(uint256 _balance) {
        balance = _balance;
    }

    function getVoiceCredits(address, bytes memory) public override view returns (uint256) {
        return balance;
    }
}
