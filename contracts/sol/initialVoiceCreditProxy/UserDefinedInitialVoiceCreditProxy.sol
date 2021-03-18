// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import { InitialVoiceCreditProxy } from './InitialVoiceCreditProxy.sol';

contract UserDefinedInitialVoiceCreditProxy is InitialVoiceCreditProxy {

    function getVoiceCredits(address, bytes memory _data) override public view returns (uint256) {
        uint256 b;
        (b) = abi.decode(_data, (uint256));
        return b;
    }
}
