// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TopupCredit is ERC20, Ownable {
    uint8 private _decimals = 1;
    // keep the maximum amount less than 2**126 < sqrt(field_size)
    // to avoid overflow
    uint256 MAXIMUM_AIRDROP_AMOUNT = 100000 * 10**_decimals;

    constructor() ERC20("TopupCredit", "TopupCredit") {
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function airdropTo(address account, uint256 amount) public {
        require(amount < MAXIMUM_AIRDROP_AMOUNT);
        _mint(account, amount);
    }

    function airdrop(uint256 amount) public {
        require(amount < MAXIMUM_AIRDROP_AMOUNT, "amount exceed maximum limit");
        _mint(msg.sender, amount);
    }
}
