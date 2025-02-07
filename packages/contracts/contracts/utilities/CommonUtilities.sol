// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IPoll } from "../interfaces/IPoll.sol";

/// @title CommonUtilities
/// @notice A contract that holds common utilities
/// which are to be used by multiple contracts
/// namely Tally and MessageProcessor
contract CommonUtilities {
  error VotingPeriodNotPassed();

  /// @notice common function for MessageProcessor, and Tally
  /// @param _poll the poll to be checked
  function _votingPeriodOver(IPoll _poll) internal view {
    uint256 endDate = _poll.endDate();
    // Require that the voting period is over
    if (block.timestamp < endDate) {
      revert VotingPeriodNotPassed();
    }
  }
}
