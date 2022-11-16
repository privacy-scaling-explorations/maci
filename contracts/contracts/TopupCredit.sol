// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TopupCredit is ERC20, Ownable {
    uint8 private constant _decimals = 1;
    uint256 public constant MAXIMUM_AIRDROP_AMOUNT = 100000 * 10**_decimals;

    constructor() ERC20("TopupCredit", "TopupCredit") {
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function airdropTo(address account, uint256 amount) public onlyOwner {
        require(amount < MAXIMUM_AIRDROP_AMOUNT);
        _mint(account, amount);
    }

    function airdrop(uint256 amount) public onlyOwner {
        require(amount < MAXIMUM_AIRDROP_AMOUNT, "amount exceed maximum limit");
        _mint(msg.sender, amount);
    }
}
