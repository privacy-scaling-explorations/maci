// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import { Params } from "./Params.sol";
import { SnarkCommon } from "./crypto/SnarkCommon.sol";
import { DomainObjs } from "./DomainObjs.sol";
import { AccQueue } from "./trees/AccQueue.sol";

abstract contract Polls is Params, DomainObjs {
    struct Poll {
        // The coordinator's public key
        MaciPubKey coordinatorPubKey;

        // The duration of the polling period, in seconds
        uint256 duration;

        // The verifying key signature for the message processing circuit
        uint256 processVkSig;

        // The verifying key signature for the tally circuit
        uint256 tallyVkSig;

        // The message queue
        AccQueue messageAq;

        TreeDepths treeDepths;
        BatchSizes batchSizes;
        MaxValues maxValues;
    }
}
