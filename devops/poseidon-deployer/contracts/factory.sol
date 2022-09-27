// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { Hasher } from "maci-contracts/contracts/crypto/Hasher.sol";

contract Factory {
    address hasherAddress;

  function deploy(bytes32 salt) public payable returns (address) {
    Hasher hasher = new Hasher{salt: salt}();
    
    hasherAddress = address(hasher);

    return hasherAddress;
  }

  function getAddress() public view returns (address) {
    require(hasherAddress != address(0));
    return hasherAddress;
  }
}

// $406163bf6df7edcc10e12addfdcd868bc3$ -> contracts/poseidon.sol:PoseidonT2
// $31947708d3d9c0b5c1fde66bab6d40b88d$ -> contracts/poseidon.sol:PoseidonT3
// $5e1cbf57a8ea91121ea6e06551a5ef5670$ -> contracts/poseidon.sol:PoseidonT4
// $88fd6d55f008e69366559296e950a0398a$ -> contracts/poseidon.sol:PoseidonT5
// $a927afca7e0dba6a8370cdb8daeb503d64$ -> contracts/poseidon.sol:PoseidonT6
