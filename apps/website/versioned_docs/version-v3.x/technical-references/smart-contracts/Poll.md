---
title: Poll Smart Contract
description: MACI Poll Contract
sidebar_label: Poll
sidebar_position: 2
---

:::info
Code location: [Poll.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/Poll.sol)
:::

This contract allows users to submit their votes.

The main functions of the contract are as follows:

- `publishMessage` - This function allows anyone to publish a message, and it accepts the message object as well as an ephemeral public key. This key together with the coordinator public key will be used to generate a shared ECDH key that will encrypt the message.
  Before saving the message, the function will check that the voting deadline has not passed, as well as the max number of messages was not reached.
- `publisMessageBatch` - This function allows to submit a batch of messages, and it accepts an array of messages with their corresponding public keys used in the encryption step. It will call the `publishMessage` function for each message in the array.
- `joinPoll` - This function allows a user to join a poll. It will check if the voter is allowed to join the poll based on the sign up policy, as well as allocate voice credits based on the voice credit proxy.

## JoinPoll

The `joinPoll` function looks as follows:

```ts
  /// @inheritdoc IPoll
  function joinPoll(
    uint256 _nullifier,
    PubKey calldata _pubKey,
    uint256 _stateRootIndex,
    uint256[8] calldata _proof,
    bytes memory _signUpPolicyData,
    bytes memory _initialVoiceCreditProxyData
  ) external virtual isWithinVotingDeadline {
    // Whether the user has already joined
    if (pollNullifiers[_nullifier]) {
      revert UserAlreadyJoined();
    }

    // Set nullifier for user's private key
    pollNullifiers[_nullifier] = true;

    // Verify user's proof
    if (!verifyJoiningPollProof(_nullifier, _stateRootIndex, _pubKey, _proof)) {
      revert InvalidPollProof();
    }

    // Check if the user is eligible to join the poll
    extContracts.policy.enforce(msg.sender, _signUpPolicyData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = extContracts.initialVoiceCreditProxy.getVoiceCredits(
      msg.sender,
      _initialVoiceCreditProxyData
    );

    // Store user in the pollStateTree
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, block.timestamp));

    uint256 stateRoot = InternalLazyIMT._insert(pollStateTree, stateLeaf);

    // Store the current state tree root in the array
    pollStateRootsOnJoin.push(stateRoot);

    uint256 pollStateIndex = pollStateTree.numberOfLeaves - 1;
    emit PollJoined(_pubKey.x, _pubKey.y, voiceCreditBalance, block.timestamp, _nullifier, pollStateIndex);
  }
```

## PublishMessage

The `publishMessage` function looks as follows:

```ts
function publishMessage(Message calldata _message, PubKey calldata _encPubKey) public virtual isOpenForVoting {
  // check if the public key is on the curve
  if (!CurveBabyJubJub.isOnCurve(_encPubKey.x, _encPubKey.y)) {
    revert InvalidPubKey();
  }

  // cannot realistically overflow
  unchecked {
    numMessages++;
  }

  // compute current message hash
  uint256 messageHash = hashMessageAndEncPubKey(_message, _encPubKey);

  // update current message chain hash
  updateChainHash(messageHash);

  emit PublishMessage(_message, _encPubKey);
}
```

The `publishMessageBatch` function looks as follows:

```ts
function publishMessageBatch(Message[] calldata _messages, PubKey[] calldata _encPubKeys) public virtual {
  if (_messages.length != _encPubKeys.length) {
    revert InvalidBatchLength();
  }

  uint256 len = _messages.length;
  for (uint256 i = 0; i < len; ) {
    // an event will be published by this function already
    publishMessage(_messages[i], _encPubKeys[i]);

    unchecked {
      i++;
    }
  }
}
```

## MergeState

After a Poll's voting period ends, the coordinator's job is to store the main state root, as well as some more information on the Poll contract using `mergeState`:

```ts
function mergeState() public isAfterVotingDeadline {
  // This function can only be called once per Poll after the voting
  // deadline
  if (stateMerged) revert StateAlreadyMerged();

  // set merged to true so it cannot be called again
  stateMerged = true;

  uint256 _mergedStateRoot = InternalLazyIMT._root(pollStateTree);
  mergedStateRoot = _mergedStateRoot;

  // Set currentSbCommitment
  uint256[3] memory sb;
  sb[0] = _mergedStateRoot;
  sb[1] = emptyBallotRoot;
  sb[2] = uint256(0);

  currentSbCommitment = hash3(sb);

  // get number of joined users and cache in a var for later use
  uint256 _numSignups = pollStateTree.numberOfLeaves;
  numSignups = _numSignups;

  // dynamically determine the actual depth of the state tree
  uint8 depth = 1;
  while (uint40(1 << depth) < _numSignups) {
    depth++;
  }

  actualStateTreeDepth = depth;

  emit MergeState(mergedStateRoot, numSignups);
}
```

The function will store the state root from the MACI contract, create a commitment by hashing this merkle root, an empty ballot root stored in the `emptyBallotRoot` variable, and a zero as salt. The commitment will be stored in the `currentSbCommitment` variable. Finally, it will store the total number of signups, and calculate the actual depth of the state tree. This information will be used when processing messages and tally to ensure proof validity.

The `emptyBallotRoot` value is used to store the empty ballot root for the configured vote option tree depth. For instance, if the vote option tree depth is 5, a build script will generate the following values (this assumes that the state tree depth is 10):

```javascript
emptyBallotRoots[0] = uint256(16015576667038038422103932363190100635991292382181099511410843174865570503661);
emptyBallotRoots[1] = uint256(166510078825589460025300915201657086611944528317298994959376081297530246971);
emptyBallotRoots[2] = uint256(10057734083972610459557695472359628128485394923403014377687504571662791937025);
emptyBallotRoots[3] = uint256(4904828619307091008204672239231377290495002626534171783829482835985709082773);
emptyBallotRoots[4] = uint256(18694062287284245784028624966421731916526814537891066525886866373016385890569);
```

:::info
Please be advised that the number of signups in this case includes the zero leaf. For this reason, when accounting for the real users signed up to the Poll, you should subtract one from the value stored in the Poll contract.
:::
