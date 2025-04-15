// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/contracts/proxy/Factory.sol";

import { ERC20VotesInitialVoiceCreditProxy } from "./ERC20VotesInitialVoiceCreditProxy.sol";

/// @title ERC20VotesInitialVoiceCreditProxyFactory
/// @notice Factory contract for deploying minimal proxy instances of ERC20VotesInitialVoiceCreditProxy.
/// @dev Simplifies deployment of ERC20VotesInitialVoiceCreditProxy clones with appended configuration data.
contract ERC20VotesInitialVoiceCreditProxyFactory is Factory {
  /// @notice Initializes the factory with the ERC20VotesInitialVoiceCreditProxy implementation.
  constructor() Factory(address(new ERC20VotesInitialVoiceCreditProxy())) {}

  /// @notice Deploys a new ERC20VotesInitialVoiceCreditProxy clone.
  /// @param snapshotBlock the block number to be used for the initial voice credits
  /// @param token the token to be used for the initial voice credits
  /// @param factor the factor to be used for the initial voice credits
  /// @return clone the address of the new clone
  function deploy(uint256 snapshotBlock, address token, uint256 factor) public returns (address clone) {
    bytes memory data = abi.encode(snapshotBlock, token, factor);
    clone = super._deploy(data);

    ERC20VotesInitialVoiceCreditProxy(clone).initialize();
  }
}
