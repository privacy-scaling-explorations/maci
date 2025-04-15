// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Clone } from "@excubiae/contracts/contracts/proxy/Clone.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";

import { IInitialVoiceCreditProxy } from "../interfaces/IInitialVoiceCreditProxy.sol";

/// @title ERC20VotesInitialVoiceCreditProxy
/// @notice This contract allows to set an initial voice credit balance
/// for MACI's voters based on the balance of an ERC20 token at a given block.
contract ERC20VotesInitialVoiceCreditProxy is Clone, IInitialVoiceCreditProxy {
  /// @notice the block number to be used for the initial voice credits
  uint256 public snapshotBlock;
  /// @notice the token to be used for the initial voice credits
  address public token;
  /// @notice the factor to be used for the initial voice credits
  uint256 public factor;

  /// @notice Initializes the contract.
  function _initialize() internal override {
    super._initialize();

    bytes memory data = _getAppendedBytes();
    (uint256 _snapshotBlock, address _token, uint256 _factor) = abi.decode(data, (uint256, address, uint256));

    snapshotBlock = _snapshotBlock;
    token = _token;
    factor = _factor;
  }

  /// @notice Returns the constant balance for any new MACI's voter
  /// @return balance
  function getVoiceCredits(address voter, bytes memory) public view override returns (uint256) {
    return IVotes(token).getPastVotes(voter, snapshotBlock) / factor;
  }
}
