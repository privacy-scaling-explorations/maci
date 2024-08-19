---
title: MACI Smart Contracts
description: MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting
sidebar_label: Smart Contracts
sidebar_position: 8
---

# Smart Contracts

MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting.

The main contracts are presented and explained below.

![contracts](/img/contracts.svg)

## MACI.sol

`MACI.sol` is the core contract of the project, as it provides the base layer for user signups and Polls to be created.

The constructor shown below accepts several arguments:

- `PollFactory` address
- `MessageProcessorFactory` address
- `TallyFactory` address
- `SubsidyFactory` address
- `SignUpGatekeeper` address
- `InitialVoiceCreditProxy` address
- `TopupCredit` address
- The depth of the state tree

```javascript
constructor(
    IPollFactory _pollFactory,
    IMessageProcessorFactory _messageProcessorFactory,
    ITallySubsidyFactory _tallyFactory,
    ITallySubsidyFactory _subsidyFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    TopupCredit _topupCredit,
    uint8 _stateTreeDepth
) payable {
    // Deploy the state AccQueue
    stateAq = new AccQueueQuinaryBlankSl(STATE_TREE_SUBDEPTH);
    stateAq.enqueue(BLANK_STATE_LEAF_HASH);

    // because we add a blank leaf we need to count one signup
    // so we don't allow max + 1
    unchecked {
        numSignUps++;
    }

    pollFactory = _pollFactory;
    messageProcessorFactory = _messageProcessorFactory;
    tallyFactory = _tallyFactory;
    subsidyFactory = _subsidyFactory;
    topupCredit = _topupCredit;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;

    // Verify linked poseidon libraries
    if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
}

```

Upon deployment, the contract will deploy a new `AccQueueQuinaryBlankSl` contract using the `STATE_TREE_SUBDEPTH`. By default, this is defined as `uint8 internal constant STATE_TREE_SUBDEPTH = 2;`.

Should this be changed, it will be necessary to amend the `contracts/ts/genEmptyBallotRootsContract.ts` file to reflect the change. The first action on this deployed contract, is to enqueue (add) an empty hash (defined as `6769006970205099520508948723718471724660867171122235270773600567925038008762`).

After this, the contracts will be stored to state, and then the contract will perform a simple sanity check to ensure that the Poseidon hash libraries were linked successfully.

Next, we have the `signUp` function, which allows users to `signUp`, as long as they pass the conditions set in the `SignUpGatekeeper` contract. This contract can use any mean necessary to gatekeep access to MACI's polls. For instance, only wallets with a specific ERC721 token can be allowed to sign up.

This function does the following:

- checks that the maximum number of signups has not been reached. As of now, this will be $5 ** 10 - 1$ due to circuit limitations.
- ensure the subtrees have not been merged already, to prevent a DoS on the coordinator full tree merge
- checks that the provided public key is a valid baby-jubjub point
- increases signups counter
- registers the user using the sign up gatekeeper contract. It is important that whichever gatekeeper is used, this reverts if a user tries to sign up twice or the conditions are not met (i.e returning false is not enough)
- calls the voice credit proxy to retrieve the number of allocated voice credits allocated to this voter
- hashes the voice credits alongside the user's MACI public key and the current time
- enqueues this hashed data into the `stateAq` contract

```javascript
function signUp(
    PubKey memory _pubKey,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
) public virtual {
    // prevent new signups until we merge the roots (possible DoS)
    if (subtreesMerged) revert SignupTemporaryBlocked();

    // ensure we do not have more signups than what the circuits support
    if (numSignUps >= uint256(TREE_ARITY) ** uint256(stateTreeDepth)) revert TooManySignups();

    if (_pubKey.x >= SNARK_SCALAR_FIELD || _pubKey.y >= SNARK_SCALAR_FIELD) {
      revert MaciPubKeyLargerThanSnarkFieldSize();
    }

    // Increment the number of signups
    // cannot overflow with realistic STATE_TREE_DEPTH
    // values as numSignUps < 5 ** STATE_TREE_DEPTH -1
    unchecked {
      numSignUps++;
    }

    // Register the user via the sign-up gatekeeper. This function should
    // throw if the user has already registered or if ineligible to do so.
    signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(msg.sender, _initialVoiceCreditProxyData);

    uint256 timestamp = block.timestamp;
    // Create a state leaf and enqueue it.
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, timestamp));
    uint256 stateIndex = stateAq.enqueue(stateLeaf);

    emit SignUp(stateIndex, _pubKey.x, _pubKey.y, voiceCreditBalance, timestamp);
}
```

Once everything has been setup, polls can be deployed using the `deployPoll` function. It should be noted that currently, after the first poll is deployed, in order to deploy a new one, the state tree must have been merged (and this can be triggered by Poll contracts using `Poll.mergeMaciStateAqSubRoots` and `Poll.mergeMaciStateAq`)

```javascript
function deployPoll(
  uint256 _duration,
  TreeDepths memory _treeDepths,
  PubKey memory _coordinatorPubKey,
  address _verifier,
  address _vkRegistry,
  bool useSubsidy
) public virtual onlyOwner returns (PollContracts memory pollAddr) {
  // cache the poll to a local variable so we can increment it
  uint256 pollId = nextPollId;

  // Increment the poll ID for the next poll
  // 2 ** 256 polls available
  unchecked {
    nextPollId++;
  }

  if (pollId > 0) {
    if (!stateAq.treeMerged()) revert PreviousPollNotCompleted(pollId);
  }

  MaxValues memory maxValues = MaxValues({
    maxMessages: uint256(TREE_ARITY) ** _treeDepths.messageTreeDepth,
    maxVoteOptions: uint256(TREE_ARITY) ** _treeDepths.voteOptionTreeDepth
  });

  address _owner = owner();

  address p = pollFactory.deploy(
    _duration,
    maxValues,
    _treeDepths,
    _coordinatorPubKey,
    address(this),
    topupCredit,
    _owner
  );

  address mp = messageProcessorFactory.deploy(_verifier, _vkRegistry, p, _owner);
  address tally = tallyFactory.deploy(_verifier, _vkRegistry, p, mp, _owner);

  address subsidy;
  if (useSubsidy) {
    subsidy = subsidyFactory.deploy(_verifier, _vkRegistry, p, mp, _owner);
  }

  polls[pollId] = p;

  // store the addresses in a struct so they can be returned
  pollAddr = PollContracts({ poll: p, messageProcessor: mp, tally: tally, subsidy: subsidy });

  emit DeployPoll(pollId, _coordinatorPubKey.x, _coordinatorPubKey.y, pollAddr);
}
```

:::info
Please be advised that the number of signups in the MACI contract (number of leaves in the merkle tree holding MACI's state) considers the initial zero leaf as one signup. For this reason, when accounting for the real users signed up to MACI, you should subtract one from the value returned from the `numSignUps` function.
:::

## Poll.sol

This contract allows users to submit their votes.

The main functions of the contract are as follows:

- `topup` - This function accepts two parameters, a `stateIndex`, and an `amount`. It can only be called before the voting deadline.
  After checking whether the deadline has passed or not, it will validate that the contract has not reached the maximum number of messages, if the checks passes, it will increase the number of messages by 1.
  It will then try to transfer the amount of `topUpCredit` tokens.
  Finally, it will create a new Message object that will be hashed and enqueued in the `messageAq` contract. This messageAq contract is reserved for this one poll only and will only contain its messages.
- `publishMessage` - This function allows anyone to publish a message, and it accepts the message object as well as an ephemeral public key. This key together with the coordinator public key will be used to generate a shared ECDH key that will encrypt the message.
  Before saving the message, the function will check that the voting deadline has not passed, as well as the max number of messages was not reached.
- `publisMessageBatch` - This function allows to submit a batch of messages, and it accepts an array of messages with their corresponding public keys used in the encryption step. It will call the `publishMessage` function for each message in the array.

The `mergeMaciStateAqSubRoots` function can be called by the contract admin after the voting deadline and looks like the following:

```javascript
function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public onlyOwner isAfterVotingDeadline {
  // This function cannot be called after the stateAq was merged
  if (stateAqMerged) revert StateAqAlreadyMerged();

  // merge subroots
  extContracts.maci.mergeStateAqSubRoots(_numSrQueueOps, _pollId);

  emit MergeMaciStateAqSubRoots(_numSrQueueOps);
}
```

If the subtrees have not been merged on the MACI contract's `stateAq`, then it will merge it by calling `mergeStateAqSubroots`. It accepts two parameters:

- `_numSrQueueOps` - the number of operations required
- `_pollId` - the id of the poll

After merging the subroots, a coordinator's job is to merge the main state root, using `mergeMaciStateAq`:

```javascript
function mergeMaciStateAq(uint256 _pollId) public onlyOwner isAfterVotingDeadline {
  // This function can only be called once per Poll after the voting
  // deadline
  if (stateAqMerged) revert StateAqAlreadyMerged();

  // set merged to true so it cannot be called again
  stateAqMerged = true;

  // the subtrees must have been merged first
  if (!extContracts.maci.stateAq().subTreesMerged()) revert StateAqSubtreesNeedMerge();

  mergedStateRoot = extContracts.maci.mergeStateAq(_pollId);

  // Set currentSbCommitment
  uint256[3] memory sb;
  sb[0] = mergedStateRoot;
  sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
  sb[2] = uint256(0);

  currentSbCommitment = hash3(sb);

  numSignups = extContracts.maci.numSignUps();
  emit MergeMaciStateAq(mergedStateRoot, numSignups);
}
```

This function only accepts one parameter, and can be called by the owner only, after the voting deadline. The parameter is the pollId for which we want to perform the operation. This function can only be called once per poll, and it will check that the sub trees have been merged on MACI's AccQueue contract. Finally it will merge the whole AccQueue to generate the state root, and store the current commitment comprised of:

the Poseidon hash of the merkle root, an empty ballot root stored in the emptyBallotRoots mapping (shown below), and a zero.

```javascript
emptyBallotRoots[0] = uint256(6579820437991406069687396372962263845395426835385368878767605633903648955255);
emptyBallotRoots[1] = uint256(9105453741665960449792281626882014222103501499246287334255160659262747058842);
emptyBallotRoots[2] = uint256(14830222164980158319423900821611648302565544940504586015002280367515043751869);
emptyBallotRoots[3] = uint256(12031563002271722465187541954825013132282571927669361737331626664787916495335);
emptyBallotRoots[4] = uint256(5204612805325639173251450278876337947880680931527922506745154187077640790699);
```

It will also store the number of signups at this current block, as well as the merkle root of the state tree.

Now, the coordinator can also perform similar operations to merge the message tree.

- `mergeMessageAqSubRoots` - merges the Poll's messages tree subroot
- `mergeMessageAq` - merges the Poll's messages tree

## PollFactory.sol

`PollFactory` is a smart contract that is used to deploy new Polls. This is used by MACI inside the `deployPoll` function.

```ts
function deploy(
  uint256 _duration,
  MaxValues calldata _maxValues,
  TreeDepths calldata _treeDepths,
  PubKey calldata _coordinatorPubKey,
  address _maci,
  TopupCredit _topupCredit,
  address _pollOwner
) public virtual returns (address pollAddr) {
  /// @notice Validate _maxValues
  /// maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
  /// it will be packed as a 50-bit value along with other values as one
  /// of the inputs (aka packedVal)
  if (_maxValues.maxVoteOptions >= (2 ** 50)) {
    revert InvalidMaxValues();
  }

  /// @notice deploy a new AccQueue contract to store messages
  AccQueue messageAq = new AccQueueQuinaryMaci(_treeDepths.messageTreeSubDepth);

  /// @notice the smart contracts that a Poll would interact with
  ExtContracts memory extContracts = ExtContracts({
    maci: IMACI(_maci),
    messageAq: messageAq,
    topupCredit: _topupCredit
  });

  // deploy the poll
  Poll poll = new Poll(_duration, _maxValues, _treeDepths, _coordinatorPubKey, extContracts);

  // Make the Poll contract own the messageAq contract, so only it can
  // run enqueue/merge
  messageAq.transferOwnership(address(poll));

  // init Poll
  poll.init();

  poll.transferOwnership(_pollOwner);

  pollAddr = address(poll);
}
```

Upon deployment, the following will happen:

- ownership of the `messageAq` contract is transferred to the deployed poll contract
- ownership of the new `Poll` contract is transferred to the poll owner, which in `MACI` is set as the owner of `MACI`.

## MessageProcessor

This contract is used to prepare parameters for the zk-SNARK circuits as well as for verifying proofs. It should be deployed alongside `MACI` and ownership assigned to the coordinator.
It will process messages in batches, and after all batches have been processed, the `sbCommitment` can then be used for the `Tally` and `Subsidy` contracts.

## Tally

:::info
The `Tally` contract is present also in a non quadratic voting fashion, and is slightly smaller due to not having the `verifyPerVOSpentVoiceCredits` function. This is not required because with normal (non quadratic) voting, each vote by a user is not the square root of the voice credits spent.  
:::

The `Tally` contract is used by the coordinator to submit commitments to the tally results via the `tallyVotes` function. This is done in batches and the final commitment can be used by the users to verify the validity of the results.

Below are the functions which users can use to verify the results:

- `verifySpentVoiceCredits`
- `verifyPerVOSpentVoiceCredits`
- `verifyTallyResult`

## Subsidy (optional)

The subsidy contract can be used by the coordinator to post proofs of valid subsidy calculations, as well as users to verify that the subsidy calculations were performed correctly.

## SignUpToken (optional)

This contract can be used by the `SignUpGateKeeper` to determine whether a user is allowed to register. The default contract provided with MACI is a simple ERC721 token. Coordinators can use this contract to mint a token for each of the participants in the voting process, and gatekeep access to a round by using a `SignUpTokenGatekeeper` contract.

## SignUpGatekeeper

MACI requires a signup gatekeeper to ensure that only designed users register. It is up to MACI's deployer how they wish to allow sign-ups, therefore they can implement their own GateKeeper. The repository comes with different options:

- `FreeForAllGatekeeper` - This allows anyone to signup on MACI.
- `SignUpTokenGatekeeper` - This makes use of a ERC721 token to gatekeep the signup function.
- `EASGatekeeper` - This allows gatekeeping signups to only users who have a specific EAS attestation.

An abstract contract to inherit from is also provided, with two function signatures as shown below:

```ts
abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
```

The MACI contract will need to call the `SignUpGatekeeper.register` function inside the `MACI.signUp` function.

## VoiceCreditProxy

The VoiceCreditProxy contract is used to assign voice credits to users. Whichever implementation should the MACI deployers use, this must implement a view function that returns the balance for a user, such as the one below:

```javascript
function getVoiceCredits(address _user, bytes memory _data) public virtual view returns (uint256) {}
```

The repository comes with a simple implementation called `InitialVoiceCreditProxy` which assigns a fixed amount of voice credits to each user.

## Hasher

This contract exposes methods to hash different number of parameters with the Poseidon hash function.

## VkRegistry

The VkRegistry is a contract that holds the verifying keys for the zk-SNARK circuits. It holds three different sets of keys:

- `processVks` - The keys for the processMessages circuit
- `tallyVks` - The keys for the tallyVotes circuit
- `subsidyVk` - The keys for the subsidy circuit

Each circuit will have a signature which is its compile-time constants represented as a uint256.

## Params

A contract holding three structs:

```c
/// @notice A struct holding the depths of the merkle trees
struct TreeDepths {
  uint8 intStateTreeDepth;
  uint8 messageTreeSubDepth;
  uint8 messageTreeDepth;
  uint8 voteOptionTreeDepth;
}

/// @notice A struct holding the max values for the poll
struct MaxValues {
  uint256 maxMessages;
  uint256 maxVoteOptions;
}

/// @notice A struct holding the external contracts
/// that are to be passed to a Poll contract on
/// deployment
struct ExtContracts {
  IMACI maci;
  AccQueue messageAq;
  TopupCredit topupCredit;
}
```

Struct parameters are used to avoid stack too deep errors in the other contracts.

## AccQueue

The AccQueue contract represents a Merkle Tree where each leaf insertion only updates a subtree. To obtain the main tree root, the subtrees must be merged together by the contract owner. This requires at least two operations, a `mergeSubRoots` and a `merge`.

The contract can be initialized to work as a traditional Merkle Tree (2 leaves per node) or a Quinary Tree (5 leaves per node). This can be achieved by passing either two or five as parameter to the constructor (`_hashLength`). Any other values should not be accepted.

Below are presented the most important functions of the smart contract:

- `enqueue` - Allows to add a leaf to the queue for the current subtree. Only one parameter is accepted and that is the leaf to insert.
- `insertSubTree` - Admin only function which allows to insert a full subtree (batch enqueue)
- `mergeSubRoots` - Allows the contract owner to merge all of the subtrees to form the shortest possible tree. The argument `_numSrQueueOps` can be used to perform the operation in multiple transactions (as this might trigger the block gas limit).
- `merge` - Allows the contract admin to form a main tree with the desired depth. The depth must fit all of the leaves.

## EmptyBallotRoots

This contract contains the roots of Ballot trees of five leaf configurations.

```javascript
emptyBallotRoots[0] = uint256(6579820437991406069687396372962263845395426835385368878767605633903648955255);
emptyBallotRoots[1] = uint256(9105453741665960449792281626882014222103501499246287334255160659262747058842);
emptyBallotRoots[2] = uint256(14830222164980158319423900821611648302565544940504586015002280367515043751869);
emptyBallotRoots[3] = uint256(12031563002271722465187541954825013132282571927669361737331626664787916495335);
emptyBallotRoots[4] = uint256(5204612805325639173251450278876337947880680931527922506745154187077640790699);
```
