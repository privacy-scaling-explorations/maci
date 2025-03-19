// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/proxy/Factory.sol";

import { ZupassChecker } from "./ZupassChecker.sol";

/// @title ZupassCheckerFactory
/// @notice Factory contract for deploying minimal proxy instances of ZupassChecker.
/// @dev Simplifies deployment of ZupassChecker clones with appended configuration data.
contract ZupassCheckerFactory is Factory {
  /// @notice Initializes the factory with the ZupassChecker implementation.
  constructor() Factory(address(new ZupassChecker())) {}

  /// @notice Deploys a new ZupassChecker clone.
  /// @param eventId Zupass event UUID converted to bigint
  /// @param signer1 Zupass event signer[0] converted to bigint
  /// @param signer2 Zupass event signer[1] converted to bigint
  /// @param verifier The ZupassGroth16Verifier contract address
  function deploy(uint256 eventId, uint256 signer1, uint256 signer2, address verifier) public {
    bytes memory data = abi.encode(eventId, signer1, signer2, verifier);
    address clone = super._deploy(data);

    ZupassChecker(clone).initialize();
  }
}
