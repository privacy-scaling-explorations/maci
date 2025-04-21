// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Factory } from "@excubiae/contracts/contracts/proxy/Factory.sol";

import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { Poll } from "./Poll.sol";
import { IPollFactory } from "./interfaces/IPollFactory.sol";

/// @title PollFactory
/// @notice A factory contract which deploys Poll contracts. It allows the MACI contract
/// size to stay within the limit set by EIP-170.
contract PollFactory is Factory, Params, DomainObjs, IPollFactory {
  /// @notice Initializes the factory with the Poll implementation.
  constructor() Factory(address(new Poll())) {}

  /// @inheritdoc IPollFactory
  function deploy(DeployPollArgs calldata _args) public virtual returns (address pollAddress) {
    bytes memory data = abi.encode(
      _args.startDate,
      _args.endDate,
      _args.treeDepths,
      _args.messageBatchSize,
      _args.coordinatorPublicKey,
      _args.extContracts,
      _args.emptyBallotRoot,
      _args.pollId,
      _args.relayers,
      _args.voteOptions
    );
    address clone = super._deploy(data);

    Poll(clone).initialize();

    pollAddress = clone;
  }
}
