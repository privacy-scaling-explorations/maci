---
title: Poll Smart Contract
description: MACI Poll Contract
sidebar_label: Poll
sidebar_position: 2
---

This contract allows users to submit their votes.

The main functions of the contract are as follows:

- `joinPoll` - This function allows users to join the poll by adding new leaf to the poll state tree. Users submit a poll-specific public key, a nullifier derived from their MACI private key, and a ZK proof that proves correctness of the nullifier computation and inclusion of the original MACI public key in MACI state tree.
- `publishMessage` - This function allows anyone to publish a message, and it accepts the message object as well as an ephemeral public key. This key together with the coordinator public key will be used to generate a shared ECDH key that will encrypt the message.
  The function will check that the voting deadline has not passed, as well as the max number of messages was not reached. If everything is correct, the message chain hash is updated as $hash(currentChainHash, newMessageHash)$. If the new message order number is greater than the batch size for message processing, the message batch chain hash is also logged.
- `publisMessageBatch` - This function allows to submit a batch of messages, and it accepts an array of messages with their corresponding public keys used in the encryption step. It will call the `publishMessage` function for each message in the array.

## JoinPoll

The `joinPoll` function looks as follows:

```js
function joinPoll(
    uint256 _nullifier,
    PubKey memory _pubKey,
    uint256 _newVoiceCreditBalance,
    uint256 _stateRootIndex,
    uint256[8] memory _proof
  ) external {
    // Whether the user has already joined
    if (pollNullifier[_nullifier]) {
      revert UserAlreadyJoined();
    }

    // Verify user's proof
    if (!verifyPollProof(_nullifier, _newVoiceCreditBalance, _stateRootIndex, _pubKey, _proof)) {
      revert InvalidPollProof();
    }

    // Store user in the pollStateTree
    uint256 timestamp = block.timestamp;
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, _newVoiceCreditBalance, timestamp));
    InternalLazyIMT._insert(pollStateTree, stateLeaf);

    // Set nullifier for user's private key
    pollNullifier[_nullifier] = true;

    uint256 pollStateIndex = pollStateTree.numberOfLeaves - 1;
    emit PollJoined(_pubKey.x, _pubKey.y, _newVoiceCreditBalance, timestamp, _nullifier, pollStateIndex);
  }
```

## PublishMessage

The `publishMessage` function looks as follows:

```js
function publishMessage(Message memory _message, PubKey calldata _encPubKey) public virtual isWithinVotingDeadline {
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

## MergeMaciState

After a Poll's voting period ends, the coordinator's job is to store the main state root, as well as some more information on the Poll contract using `mergeMaciState` and, if needed, pad last message hash batch using `padLastBatch`:

```js
function mergeMaciState() public isAfterVotingDeadline {
    // This function can only be called once per Poll after the voting
    // deadline
    if (stateMerged) revert StateAlreadyMerged();

    // set merged to true so it cannot be called again
    stateMerged = true;

    mergedStateRoot = extContracts.maci.getStateTreeRoot();

    // Set currentSbCommitment
    uint256[3] memory sb;
    sb[0] = mergedStateRoot;
    sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
    sb[2] = uint256(0);

    currentSbCommitment = hash3(sb);

    // get number of signups and cache in a var for later use
    uint256 _numSignups = extContracts.maci.numSignUps();
    numSignups = _numSignups;

    // dynamically determine the actual depth of the state tree
    uint8 depth = 1;
    while (uint40(2) ** uint40(depth) < _numSignups) {
      depth++;
    }

    actualStateTreeDepth = depth;

    emit MergeMaciState(mergedStateRoot, numSignups);
  }
```

```js
function padLastBatch() external isAfterVotingDeadline isNotPadded {
    if (numMessages % messageBatchSize != 0) {
      batchHashes.push(chainHash);
    }
    isBatchHashesPadded = true;
  }
```

The function will store the state root from the MACI contract, create a commitment by hashing this merkle root, an empty ballot root stored in the `emptyBallotRoots` mapping, and a zero as salt. The commitment will be stored in the `currentSbCommitment` variable. Finally, it will store the total number of signups, and calculate the actual depth of the state tree. This information will be used when processing messages and tally to ensure proof validity.

The `emptyBallotRoots` mapping is used to store the empty ballot roots for each vote option tree depth. For instance, if the vote option tree depth is 5, a build script will generate the following values (this assumes that the state tree depth is 10):

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
