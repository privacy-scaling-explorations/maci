// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BasePolicy } from "@excubiae/contracts/policy/BasePolicy.sol";

/// @title ZupassGatekeeper
/// @notice This contract allows to gatekeep MACI signups
/// by requiring new voters to own a certain Zupass event ticket
contract ZupassGatekeeper is BasePolicy {
  /// @notice a mapping of ticket IDs to whether they have been used
  mapping(uint256 => bool) public registeredTickets;

  /// @notice custom errors
  error AlreadyRegistered();

  /// @notice Create a new instance of ZupassGatekeeper
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Registers the user only if they have the Zupass event ticket
  /// @param _subject The user's Ethereum address.
  /// @param _evidence The ABI-encoded proof and public signals.
  function _enforce(address _subject, bytes calldata _evidence) internal override {
    // Decode the given _data bytes
    (, , , uint256[38] memory pubSignals) = abi.decode(_evidence, (uint256[2], uint256[2][2], uint256[2], uint256[38]));

    // Ticket ID is stored at index 0
    uint256 ticketId = pubSignals[0];

    if (registeredTickets[ticketId]) {
      revert AlreadyRegistered();
    }

    registeredTickets[ticketId] = true;

    super._enforce(_subject, _evidence);
  }

  /// @notice Get the trait of the gatekeeper
  /// @return The type of the gatekeeper
  function trait() public pure override returns (string memory) {
    return "Zupass";
  }
}
