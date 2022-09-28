// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { Hasher } from "maci-contracts/contracts/crypto/Hasher.sol";

contract Factory {
    address public hasherAddress;

  function deploy(bytes32 salt) public payable returns (address) {
    Hasher hasher = new Hasher{salt: salt}();
    
    hasherAddress = address(hasher);

    return hasherAddress;
  }
}
