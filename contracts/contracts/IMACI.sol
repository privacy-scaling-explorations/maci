// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
import { VkRegistry } from "./VkRegistry.sol";
import { AccQueue } from "./trees/AccQueue.sol";

interface IMACI {

    function stateTreeDepth() external view returns (uint8);
    function vkRegistry() external view returns (VkRegistry);
    function getStateAqRoot() external view returns (uint256);
    function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) external;
    function mergeStateAq(uint256 _pollId) external returns (uint256);
    function numSignUps() external view returns (uint256);
    function stateAq() external view returns (AccQueue);
}
