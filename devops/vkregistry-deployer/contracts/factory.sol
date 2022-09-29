// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { VkRegistry } from "maci-contracts/contracts/VkRegistry.sol";

contract Factory {

    address public vkRegistryAddress;
    
    function deploy(bytes32 salt) public payable returns (address) {
        VkRegistry vkRegistry = new VkRegistry{salt: salt}();

        vkRegistryAddress = address(vkRegistry);

        return vkRegistryAddress;
   }
 }