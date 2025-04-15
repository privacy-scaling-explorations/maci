// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/contracts/proxy/Factory.sol";

import { ConstantInitialVoiceCreditProxy } from "./ConstantInitialVoiceCreditProxy.sol";

/// @title ConstantInitialVoiceCreditProxyFactory
/// @notice Factory contract for deploying minimal proxy instances of ConstantInitialVoiceCreditProxy.
/// @dev Simplifies deployment of ConstantInitialVoiceCreditProxy clones with appended configuration data.
contract ConstantInitialVoiceCreditProxyFactory is Factory {
  /// @notice Initializes the factory with the ConstantInitialVoiceCreditProxy implementation.
  constructor() Factory(address(new ConstantInitialVoiceCreditProxy())) {}

  /// @notice Deploys a new ConstantInitialVoiceCreditProxy clone.
  /// @param balance the balance to be returned by getVoiceCredits
  /// @return clone the address of the new clone
  function deploy(uint256 balance) public returns (address clone) {
    bytes memory data = abi.encode(balance);
    clone = super._deploy(data);

    ConstantInitialVoiceCreditProxy(clone).initialize();
  }
}
