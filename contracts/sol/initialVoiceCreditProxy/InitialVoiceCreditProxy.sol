// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

abstract contract InitialVoiceCreditProxy {
    function getVoiceCredits(address _user, bytes memory _data) virtual public view returns (uint256) {}
}
