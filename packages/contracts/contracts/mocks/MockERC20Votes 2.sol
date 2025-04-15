// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20Votes
/// @notice A mock ERC20Votes contract
contract MockERC20Votes is ERC20 {
  uint256 public votes;

  constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    _mint(msg.sender, 100e18);
  }

  /// @notice Change the votes for the contract
  /// @dev This function is only for testing purposes
  /// @param _votes The new votes for the contract
  function changeVotes(uint256 _votes) external {
    votes = _votes;
  }

  /// @notice Get the past votes for an account
  /// @return The past votes for the account
  function getPastVotes(address, uint256) public view returns (uint256) {
    return votes;
  }
}
