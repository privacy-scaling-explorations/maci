// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IMACI } from "./interfaces/IMACI.sol";
import { AccQueue } from "./trees/AccQueue.sol";
import { AccQueueQuinaryMaci } from "./trees/AccQueueQuinaryMaci.sol";
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
  function deploy(
    uint256 _duration,
    TreeDepths calldata _treeDepths,
    PubKey calldata _coordinatorPubKey,
    address _maci,
    uint256 _emptyBallotRoot
  ) public virtual returns (address pollAddr) {
    /// @notice deploy a new AccQueue contract to store messages
    AccQueue messageAq = new AccQueueQuinaryMaci(_treeDepths.messageTreeSubDepth);

    /// @notice the smart contracts that a Poll would interact with
    ExtContracts memory extContracts = ExtContracts({ maci: IMACI(_maci), messageAq: messageAq });

    // deploy the poll
    Poll poll = new Poll(_duration, _treeDepths, _coordinatorPubKey, extContracts, _emptyBallotRoot);

    // Make the Poll contract own the messageAq contract, so only it can
    // run enqueue/merge
    messageAq.transferOwnership(address(poll));

    // init Poll
    poll.init();

    pollAddr = address(poll);
  }
}
