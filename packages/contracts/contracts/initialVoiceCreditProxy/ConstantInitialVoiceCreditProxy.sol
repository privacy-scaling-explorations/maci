// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Clone } from "@excubiae/contracts/contracts/proxy/Clone.sol";

import { IInitialVoiceCreditProxy } from "../interfaces/IInitialVoiceCreditProxy.sol";

/// @title ConstantInitialVoiceCreditProxy
/// @notice This contract allows to set a constant initial voice credit balance
/// for MACI's voters.
contract ConstantInitialVoiceCreditProxy is Clone, IInitialVoiceCreditProxy {
  /// @notice the balance to be returned by getVoiceCredits
  uint256 internal balance;

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    uint256 _balance = abi.decode(data, (uint256));

    balance = _balance;
  }

  /// @notice Returns the constant balance for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address, bytes memory) public view override returns (uint256) {
    return balance;
  }
}
