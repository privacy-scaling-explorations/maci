// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Policy } from "@excubiae/contracts/policy/Policy.sol";
import { IBasePolicy } from "@excubiae/contracts/interfaces/IBasePolicy.sol";

/// @title SignUpGatekeeper
/// @notice A gatekeeper contract which allows users to sign up for a poll.
abstract contract SignUpGatekeeper is Policy, IBasePolicy {
  /// @notice custom errors
  error AlreadyRegistered();
}
