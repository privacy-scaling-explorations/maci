// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BasePolicy } from "@excubiae/contracts/policy/BasePolicy.sol";

/// @title SignUpGatekeeper
/// @notice A gatekeeper contract which allows users to sign up for a poll.
abstract contract SignUpGatekeeper is BasePolicy {
  /// @notice custom errors
  error AlreadyRegistered();
}
