// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

abstract contract InitialVoiceCreditProxy {
    function getVoiceCredits(address _user, bytes memory _data) public virtual view returns (uint256) {}
}
