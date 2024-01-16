---
title: MACI Smart Contracts
description: MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting
sidebar_label: Smart Contracts
sidebar_position: 6
---

# Smart Contracts

MACI is composed of multiple smart contracts, which together with the zk-SNARK circuits, can be used to carry out on-chain voting.

The main contracts are presented and explained below.

## MACI.sol

`MACI.sol` is the core contract of the project, as it provides the base layer for user signups and Polls to be created.

The constructor shown below accepts three arguments, a `PollFactory` contract, a `SignUpGatekeeper` contract, and an `InitialVoiceCreditProxy` contract.

```javascript
constructor(
    PollFactory _pollFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    TopupCredit _topupCredit,
    uint8 _stateTreeDepth
) {
    // Deploy the state AccQueue
    stateAq = new AccQueueQuinaryBlankSl(STATE_TREE_SUBDEPTH);
    stateAq.enqueue(BLANK_STATE_LEAF_HASH);

    pollFactory = _pollFactory;
    topupCredit = _topupCredit;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;

    // Verify linked poseidon libraries
    require(
        hash2([uint256(1), uint256(1)]) != 0,
        "MACI: poseidon hash libraries not linked"
    );
}
```

Upon deployment, the contract will deploy a new `AccQueueQuinaryBlankSl` contract using the `STATE_TREE_SUBDEPTH`. By default, this is defined as `uint8 internal constant STATE_TREE_SUBDEPTH = 2;`.

Should this be changed, it will be necessary to amend the `contracts/ts/genEmptyBallotRootsContract.ts` file to reflect the change. The first action on this deployed contract, is to enqueue (add) an empty hash (defined as `6769006970205099520508948723718471724660867171122235270773600567925038008762`).

After this, the contracts will be stored to state, the current time taken and then the contract will perform a simple sanity check to ensure that the Poseidon hash libraries were linked successfully.

Next, we have the `signUp` function, which allows users to `signUp` using a `SignUpGatekeeper` contract. This contract can use any mean necessary to gatekeep access to MACI's polls. For instance, only wallets with access to a specific ERC721 token can be allowed to sign up. Please note that this function can only be called after the contract is initialized (thanks to the `afterInit` modifier).

This function does the following:

- checks that the maximum number of signups have not been reached. As of now, this will be $5 ** 10 - 1$ due to circuit limitations.
- checks that the provided public key is within the allowed boundaries
- increases the number of signups
- registers the user using the sign up gatekeeper contract. It is important that whichever gatekeeper is used, it reverts if an user tries to sign up twice.
- calls the voice credit proxy to retrieve the number of allocated voice credits for the calling account
- hashes the voice credits alongside the calling address and the current time
- enqueues this hashed data into the `stateAq` contract

```javascript
function signUp(
    PubKey memory _pubKey,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
) public afterInit {
    // The circuits only support up to (5 ** 10 - 1) signups
    require(
        numSignUps < STATE_TREE_ARITY**stateTreeDepth,
        "MACI: maximum number of signups reached"
    );

    require(
        _pubKey.x < SNARK_SCALAR_FIELD && _pubKey.y < SNARK_SCALAR_FIELD,
        "MACI: _pubKey values should be less than the snark scalar field"
    );

    // Increment the number of signups
    numSignUps++;

    // Register the user via the sign-up gatekeeper. This function should
    // throw if the user has already registered or if ineligible to do so.
    signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(
        msg.sender,
        _initialVoiceCreditProxyData
    );

    uint256 timestamp = block.timestamp;
    // Create a state leaf and enqueue it.
    uint256 stateLeaf = hashStateLeaf(
        StateLeaf(_pubKey, voiceCreditBalance, timestamp)
    );
    uint256 stateIndex = stateAq.enqueue(stateLeaf);

    emit SignUp(stateIndex, _pubKey, voiceCreditBalance, timestamp);
}
```

Once everything has been setup, polls can be deployed using the `deployPoll` function. This function is not protected by access control, therefore any user can deploy one. It should be noted however, that previous poll should have been closed out first, and this can only be done by the owner of the contract, which is the `MACI` contract itself.

```javascript
function deployPoll(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey
) public onlyOwner returns (address pollAddr) {
    uint256 pollId = nextPollId;

    // Increment the poll ID for the next poll
    nextPollId++;

    if (pollId > 0) {
        require(
            stateAq.treeMerged(),
            "MACI: previous poll must be completed before using a new instance"
        );
    }

    // The message batch size and the tally batch size
    BatchSizes memory batchSizes = BatchSizes(
        MESSAGE_TREE_ARITY**uint8(_treeDepths.messageTreeSubDepth),
        STATE_TREE_ARITY**uint8(_treeDepths.intStateTreeDepth),
        STATE_TREE_ARITY**uint8(_treeDepths.intStateTreeDepth)
    );

    Poll p = pollFactory.deploy(
        _duration,
        _maxValues,
        _treeDepths,
        batchSizes,
        _coordinatorPubKey,
        vkRegistry,
        this,
        topupCredit,
        owner()
    );

    polls[pollId] = p;

    emit DeployPoll(pollId, address(p), _coordinatorPubKey);
}
```

## Poll.sol

This contract allows users to vote on a Poll.

The main functions of the contract are as follows:

- `topup` - This function accepts two parameters, a `stateIndex`, and an `amount`. It can only be called before the voting deadline.
  After checking whether the deadline has passed or not, it will validate that the contract has not reached the maximum number of messages, if the checks passes, it will increase the number of messages by 1.
  It will then try to transfer the amount of `topUpCredit` tokens.
  Finally, it will create a new Message object that will be hashed and enqueued in the `messageAq` contract. This messageAq contract is reserved for this one poll only and will only contain its messages.
- `publishMessage` - This function allows anyone to publish a message, and it accepts the message object as well as an ephemeral public key. This key together with the coordinator public key will be used to generate a shared ECDH key that will encrypt the message.
  Before saving the message, the function will check that the voting deadline has not passed, as well as the max number of messages was not reached.

The `mergeMaciStateAqSubRoots` function can be called by the contract admin after the voting deadline and looks like the following:

```javascript
function mergeMaciStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId)
    public
    onlyOwner
    isAfterVotingDeadline
    {
        // This function can only be called once per Poll
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        if (!extContracts.maci.stateAq().subTreesMerged()) {
            extContracts.maci.mergeStateAqSubRoots(_numSrQueueOps, _pollId);
        }

        emit MergeMaciStateAqSubRoots(_numSrQueueOps);
    }
```

If the subtrees have not been merged on the MACI contract's `stateAq`, then it will merge it by calling `mergeStateAqSubroots`. It accepts two parameters:

- `_numSrQueueOps` - the number of operations required
- `_pollId` - the id of the poll

The next function, is presented below:

```javascript
function mergeMaciStateAq(uint256 _pollId)
        public
        onlyOwner
        isAfterVotingDeadline
    {
        // This function can only be called once per Poll after the voting
        // deadline
        require(!stateAqMerged, ERROR_STATE_AQ_ALREADY_MERGED);

        stateAqMerged = true;

        require(
            extContracts.maci.stateAq().subTreesMerged(),
            ERROR_STATE_AQ_SUBTREES_NEED_MERGE
        );

        mergedStateRoot = extContracts.maci.mergeStateAq(_pollId);

        // Set currentSbCommitment
        uint256[3] memory sb;
        sb[0] = mergedStateRoot;
        sb[1] = emptyBallotRoots[treeDepths.voteOptionTreeDepth - 1];
        sb[2] = uint256(0);

        currentSbCommitment = hash3(sb);
        emit MergeMaciStateAq(mergedStateRoot);
    }
```

This function only accepts one parameter, and can be called by the owner only, and after the voting deadline. The parameter is the pollId for which we want to perform the operation. This function can only be called once per poll, and it will check that the sub trees have been merged on MACI's AccQueue contract. Finally it will merge the whole AccQueue to generate the state root, and store the current commitment comprised of:

the Poseidon hash of the merkle root, an empty ballot root stored in the emptyBallotRoots mapping (shown below), and a zero.

```javascript
emptyBallotRoots[0] = uint256(6579820437991406069687396372962263845395426835385368878767605633903648955255);
emptyBallotRoots[1] = uint256(9105453741665960449792281626882014222103501499246287334255160659262747058842);
emptyBallotRoots[2] = uint256(14830222164980158319423900821611648302565544940504586015002280367515043751869);
emptyBallotRoots[3] = uint256(12031563002271722465187541954825013132282571927669361737331626664787916495335);
emptyBallotRoots[4] = uint256(5204612805325639173251450278876337947880680931527922506745154187077640790699);
```

In order for the `processMessages` circuit to access the message root, the following two functions need to be called (only by the owner):

- `mergeMessageAqSubRoots` - merges the Poll's messages tree subroot
- `mergeMessageAq` - merges the Poll's messages tree

## PollFactory.sol

`PollFactory` is a smart contract that is used to deploy new Polls. This is used by MACI inside the `deployPoll` function. It only contains two functions:

- `deploy` - owner only function which allows to deploy a new Poll, also deploys a messageAq

The arguments required to deploy a new Poll are the following:

```javascript
uint256 _duration,
MaxValues memory _maxValues,
TreeDepths memory _treeDepths,
BatchSizes memory _batchSizes,
PubKey memory _coordinatorPubKey,
VkRegistry _vkRegistry,
IMACI _maci,
TopupCredit _topupCredit,
address _pollOwner
```

Upon deployment, the ownership of the messageAq contract will be transferred to the deployed poll, as well as the ownership of the new Poll contract be transferred to the poll owner, which in MACI is set as the owner of MACI.

## MessageProcessor

This contract is used to prepare parameters for the zk-SNARK circuits as well as for verifying proofs. It should be deployed alongside MACI and ownership assigned to the coordinator.
It will process messages in batches, to increase performance and stay within the block gas limit.
After it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts.

## Tally

The Tally contract is used during votes tallying and by users to verify the tally results.

## Subsidy

This contract is used to verify that the subsidy calculations are correct. It is also used to update the subsidy commitment if the proof is valid.

## SignUpToken

This contract should be used by the SignUpGateKeeper to determine whether a user is allowed to register. The default contract provided with MACI is a simple ERC721 token. Coordinators can use this contract to mint a token for each of the participants in the voting process.

## SignUpGatekeeper

MACI requires a signup gatekeeper to ensure that only designed users register. It is up to MACI's deployer how they wish to allow sign-ups, therefore they can implement their own GateKeeper. The repository comes with two presets:

- `FreeForAllSignUpGatekeeper` - This allows anyone to signup on MACI.
- `SignUpTokenGatekeeper` - This makes use of a ERC721 token to gatekeep the signup function.

An abstract contract to inherit from is also provided, with two function signatures as shown below:

```javascript
abstract contract SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public virtual {}
    function register(address _user, bytes memory _data) public virtual {}
}
```

The MACI contract will need to call `register` inside the `signUp` function.

## VoiceCreditProxy

The VoiceCreditProxy contract is used to assign voice credits to users. Whichever implementation should the MACI deployers use, this must implement a view function that returns the balance for a user, such as the one below:

```javascript
function getVoiceCredits(address _user, bytes memory _data) public virtual view returns (uint256) {}
```

## Hasher

This contract exposes methods to hash different number of parameters with the Poseidon hash.

## VkRegistry

The VkRegistry is a contract that holds the verifying keys for the zk-SNARK circuits. It holds three different sets of keys:

- `processVks` - The keys for the processMessages circuit
- `tallyVks` - The keys for the tallyVotes circuit
- `subsidyVk` - The keys for the subsidy circuit

Each circuit will have a signature which is its compile-time constants represented as a uint256.

## Params

A contract holding three structs:

```go
struct TreeDepths {
    uint8 intStateTreeDepth;
    uint8 messageTreeSubDepth;
    uint8 messageTreeDepth;
    uint8 voteOptionTreeDepth;
}

struct BatchSizes {
    uint24 messageBatchSize;
    uint24 tallyBatchSize;
    uint24 subsidyBatchSize;
}

struct MaxValues {
    uint256 maxMessages;
    uint256 maxVoteOptions;
}
```

These are stored separately to avoid a stack overlow error during compilation of the contracts using them.

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
