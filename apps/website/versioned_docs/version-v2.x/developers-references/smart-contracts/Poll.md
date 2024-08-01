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

## PublishMessage

The `publishMessage` function looks as follows:

```js
function publishMessage(Message memory _message, PubKey calldata _encPubKey) public virtual isWithinVotingDeadline {
    // we check that we do not exceed the max number of messages
    if (numMessages >= maxMessages) revert TooManyMessages();

    // check if the public key is on the curve
    if (!CurveBabyJubJub.isOnCurve(_encPubKey.x, _encPubKey.y)) {
        revert InvalidPubKey();
    }

    // cannot realistically overflow
    unchecked {
        numMessages++;
    }

    uint256 messageLeaf = hashMessageAndEncPubKey(_message, _encPubKey);
    extContracts.messageAq.enqueue(messageLeaf);

    emit PublishMessage(_message, _encPubKey);
}
```

## MergeMaciState

After a Poll's voting period ends, the coordinator's job is to store the main state root, as well as some more information on the Poll contract using `mergeMaciState`:

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
    while (uint40(1 << depth) < numberOfLeaves) {
      depth++;
    }

    actualStateTreeDepth = depth;

    emit MergeMaciState(mergedStateRoot, numSignups);
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

At the same time, the coordinator can merge the message accumulator queue and generate its merkle root. This is achieved by calling the following functions:

- `mergeMessageAqSubRoots` - merges the Poll's messages tree subroot
- `mergeMessageAq` - merges the Poll's messages tree

:::info
Please be advised that the number of signups in this case includes the zero leaf. For this reason, when accounting for the real users signed up to the Poll, you should subtract one from the value stored in the Poll contract.
:::
