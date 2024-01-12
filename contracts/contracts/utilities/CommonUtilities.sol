// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IPoll } from "../interfaces/IPoll.sol";

/// @title CommonUtilities
/// @notice A contract that holds common utilities
/// which are to be used by multiple contracts
/// namely Subsidy, Tally and MessageProcessor
contract CommonUtilities {
  error VotingPeriodNotPassed();

  /// @notice common function for MessageProcessor, Tally and Subsidy
  /// @param _poll the poll to be checked
  function _votingPeriodOver(IPoll _poll) internal view {
    (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();
    // Require that the voting period is over
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed <= duration) {
      revert VotingPeriodNotPassed();
    }
  }
}
