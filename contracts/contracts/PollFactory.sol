// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { IMACI } from "./interfaces/IMACI.sol";
import { AccQueue } from "./trees/AccQueue.sol";
import { AccQueueQuinaryMaci } from "./trees/AccQueueQuinaryMaci.sol";
import { TopupCredit } from "./TopupCredit.sol";
import { Params } from "./utilities/Params.sol";
import { DomainObjs } from "./utilities/DomainObjs.sol";
import { Poll } from "./Poll.sol";

/// @title PollFactory
/// @notice A factory contract which deploys Poll contracts. It allows the MACI contract
/// size to stay within the limit set by EIP-170.
contract PollFactory is Params, DomainObjs {
  // The number of children each node in the message tree has
  uint256 internal constant TREE_ARITY = 5;

  // custom error
  error InvalidMaxValues();

  /// @notice The PollFactory constructor
  // solhint-disable-next-line no-empty-blocks
  constructor() payable {}

  /// @notice Deploy a new Poll contract and AccQueue contract for messages.
  /// @param _duration The duration of the poll
  /// @param _maxValues The max values for the poll
  /// @param _treeDepths The depths of the merkle trees
  /// @param _batchSizes The batch sizes for processing
  /// @param _coordinatorPubKey The coordinator's public key
  /// @param _maci The MACI contract interface reference
  /// @param _topupCredit The TopupCredit contract
  /// @param _pollOwner The owner of the poll
  /// @return poll The deployed Poll contract
  function deploy(
    uint256 _duration,
    MaxValues calldata _maxValues,
    TreeDepths calldata _treeDepths,
    BatchSizes calldata _batchSizes,
    PubKey calldata _coordinatorPubKey,
    IMACI _maci,
    TopupCredit _topupCredit,
    address _pollOwner
  ) public returns (Poll poll) {
    /// @notice Validate _maxValues
    /// maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
    /// it will be packed as a 50-bit value along with other values as one
    /// of the inputs (aka packedVal)
    if (
      _maxValues.maxMessages > TREE_ARITY ** uint256(_treeDepths.messageTreeDepth) ||
      _maxValues.maxMessages < _batchSizes.messageBatchSize ||
      _maxValues.maxMessages % _batchSizes.messageBatchSize != 0 ||
      _maxValues.maxVoteOptions > TREE_ARITY ** uint256(_treeDepths.voteOptionTreeDepth) ||
      _maxValues.maxVoteOptions >= (2 ** 50)
    ) {
      revert InvalidMaxValues();
    }

    /// @notice deploy a new AccQueue contract to store messages
    AccQueue messageAq = new AccQueueQuinaryMaci(_treeDepths.messageTreeSubDepth);

    /// @notice the smart contracts that a Poll would interact with
    ExtContracts memory extContracts = ExtContracts({ maci: _maci, messageAq: messageAq, topupCredit: _topupCredit });

    // deploy the poll
    poll = new Poll(_duration, _maxValues, _treeDepths, _batchSizes, _coordinatorPubKey, extContracts);

    // Make the Poll contract own the messageAq contract, so only it can
    // run enqueue/merge
    messageAq.transferOwnership(address(poll));

    // init Poll
    poll.init();

    poll.transferOwnership(_pollOwner);
  }
}
