// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { VkRegistry } from "maci-contracts/contracts/VkRegistry.sol";

contract Factory {

    address public vkRegistryAddress;
    
    function deploy(bytes32 salt, address _owner) public payable {
        VkRegistry vkRegistry = new VkRegistry{salt: salt}(_owner);

        vkRegistryAddress = address(vkRegistry);
   }
 }