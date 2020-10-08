// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { AccQueue } from "./trees/AccQueue.sol";

abstract contract Polls {

    struct Poll {
        uint256 duration;
        AccQueue signUpQueue;
        AccQueue msgQueue;
    }

    // Each poll has an incrementing ID
    //uint256 internal nextPollId = 0;
    //mapping (uint256 => Poll) public polls;
}
