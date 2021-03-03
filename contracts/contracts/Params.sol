// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

contract Params {
    // This structs help to reduce the number of parameters to the constructor
    // and avoid a stack overflow error during compilation
    struct TreeDepths {
        uint8 intStateTreeDepth;
        uint8 messageTreeSubDepth;
        uint8 messageTreeDepth;
        uint8 voteOptionTreeDepth;
    }

    struct BatchSizes {
        uint8 messageBatchSize;
        uint8 tallyBatchSize;
    }

    struct MaxValues {
        uint256 maxMessages;
        uint256 maxVoteOptions;
    }
}
