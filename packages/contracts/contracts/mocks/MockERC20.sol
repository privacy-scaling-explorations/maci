// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice A mock ERC20 contract that mints 100,000,000,000,000 tokens to the deployer
contract MockERC20 is ERC20 {
  constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    _mint(msg.sender, 100e18);
  }
}
