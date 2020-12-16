// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
import { VkRegistry } from "./VkRegistry.sol";

interface IMACI {

    function stateTreeDepth() external view returns (uint8);
    function vkRegistry() external view returns (VkRegistry);

    function getStateRootSnapshot(uint256 _timestamp)
        external
        view
        returns (uint256);
}
