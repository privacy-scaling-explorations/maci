// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { Poll } from "./Poll.sol";
import { IPollFactory } from "./interfaces/IPollFactory.sol";

/// @title PollFactory
/// @notice A factory contract which deploys Poll contracts. It allows the MACI contract
/// size to stay within the limit set by EIP-170.
contract PollFactory is Params, DomainObjs, IPollFactory {
  /// @notice The PollFactory constructor
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @inheritdoc IPollFactory
  function deploy(DeployPollArgs calldata _args) public virtual returns (address pollAddr) {
    // deploy the poll
    Poll poll = new Poll(
      _args.startDate,
      _args.endDate,
      _args.treeDepths,
      _args.messageBatchSize,
      _args.coordinatorPubKey,
      _args.extContracts,
      _args.emptyBallotRoot,
      _args.pollId,
      _args.relayers,
      _args.voteOptions
    );

    pollAddr = address(poll);
  }
}
