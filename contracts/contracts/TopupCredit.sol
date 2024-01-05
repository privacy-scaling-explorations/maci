// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TopupCredit
/// @notice A contract representing a token used to topup a MACI's voter
/// credits
contract TopupCredit is ERC20, Ownable {
  uint8 public constant DECIMALS = 1;
  uint256 public constant MAXIMUM_AIRDROP_AMOUNT = 100000 * 10 ** DECIMALS;

  /// @notice custom errors
  error ExceedLimit();

  /// @notice create  a new TopupCredit token
  constructor() payable ERC20("TopupCredit", "TopupCredit") {}

  /// @notice mint tokens to an account
  /// @param account the account to mint tokens to
  /// @param amount the amount of tokens to mint
  function airdropTo(address account, uint256 amount) public onlyOwner {
    if (amount >= MAXIMUM_AIRDROP_AMOUNT) {
      revert ExceedLimit();
    }

    _mint(account, amount);
  }

  /// @notice mint tokens to the contract owner
  /// @param amount the amount of tokens to mint
  function airdrop(uint256 amount) public onlyOwner {
    if (amount >= MAXIMUM_AIRDROP_AMOUNT) {
      revert ExceedLimit();
    }

    _mint(msg.sender, amount);
  }
}
