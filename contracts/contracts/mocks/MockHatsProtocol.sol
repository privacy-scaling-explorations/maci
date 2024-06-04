// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockHatsProtocol
/// @notice A mock contract to test the HatsProtocolSingle gatekeeper
contract MockHatsProtocol {
  function isWearerOfHat(address account, uint256 hat) external pure returns (bool) {
    if (hat == 1 || hat == 2) {
      return true;
    }
    return false;
  }
}
