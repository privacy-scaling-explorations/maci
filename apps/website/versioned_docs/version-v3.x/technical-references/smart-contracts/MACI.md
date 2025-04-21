---
title: MACI Smart Contract
description: MACI main smart contract
sidebar_label: MACI
sidebar_position: 1
---

:::info
Code location: [MACI.sol](https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/contracts/MACI.sol)
:::

`MACI.sol` is the core contract of the project, as it provides the base layer for user signups and Polls to be created.

The constructor shown below accepts several arguments:

- `PollFactory` address
- `MessageProcessorFactory` address
- `TallyFactory` address
- `IBasePolicy` address
- `InitialVoiceCreditProxy` address
- The depth of the state tree

```solidity
constructor(
  IPollFactory _pollFactory,
  IMessageProcessorFactory _messageProcessorFactory,
  ITallyFactory _tallyFactory,
  IBasePolicy _signUpPolicy,
  uint8 _stateTreeDepth,
  uint256[5] memory _emptyBallotRoots
) payable {
  // initialize and insert the blank leaf
  InternalLeanIMT._insert(leanIMTData, PAD_KEY_HASH);
  stateRootsOnSignUp.push(PAD_KEY_HASH);

  pollFactory = _pollFactory;
  messageProcessorFactory = _messageProcessorFactory;
  tallyFactory = _tallyFactory;
  signUpPolicy = _signUpPolicy;
  stateTreeDepth = _stateTreeDepth;
  maxSignups = uint256(STATE_TREE_ARITY) ** uint256(_stateTreeDepth);
  emptyBallotRoots = _emptyBallotRoots;

  // Verify linked poseidon libraries
  if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
}
```

Upon deployment, the contract will initialize the state tree, and insert the blank leaf hash.

After this, all of the parameters will be stored to state, and then the contract will perform a simple sanity check to ensure that the Poseidon hash libraries were linked successfully.

## SignUp

Next, we have the `signUp` function, which allows users to `signUp`, as long as they pass the conditions set in the `signUpPolicy` contract. This contract can use any mean necessary to gatekeep access to MACI's polls. For instance, only wallets with a specific ERC721 token can be allowed to sign up.

This function does the following:

- checks that the maximum number of signups has not been reached. Given a tree depth of 10, this will be $2 ** 10 - 1$.
- checks that the provided public key is a valid baby-jubjub point
- registers the user using the sign up policy contract. It is important that whichever policy is used, this reverts if a user tries to sign up twice or the conditions are not met (i.e returning false is not enough)
- hashes the public key and inserts it into the state tree.

```ts
function signUp(PublicKey memory _publicKey, bytes memory _signUpPolicyData) public virtual {
  // ensure we do not have more signups than what the circuits support
  if (leanIMTData.size >= maxSignups) revert TooManySignups();

  // ensure that the public key is on the baby jubjub curve
  if (!CurveBabyJubJub.isOnCurve(_publicKey.x, _publicKey.y)) {
    revert InvalidPubKey();
  }

  // Register the user via the sign-up policy. This function should
  // throw if the user has already registered or if ineligible to do so.
  signUpPolicy.register(msg.sender, _signUpPolicyData);

  // Hash the public key and insert it into the tree.
  uint256 pubKeyHash = hashLeftRight(_publicKey.x, _publicKey.y);
  uint256 stateRoot = InternalLeanIMT._insert(leanIMTData, pubKeyHash);

  // Store the current state tree root in the array
  stateRootsOnSignUp.push(stateRoot);

  emit SignUp(leanIMTData.size - 1, block.timestamp, _publicKey.x, _publicKey.y);
}
```

## DeployPoll

Once everything has been setup, polls can be deployed using the `deployPoll` function. Polls can be deployed concurrently, as each deployment has its own separate set of contracts and state.

```ts
function deployPoll(DeployPollArgs calldata args) public virtual returns (PollContracts memory) {
  // cache the poll to a local variable so we can increment it
  uint256 pollId = nextPollId;

  // Increment the poll ID for the next poll
  // 2 ** 256 polls available
  unchecked {
    nextPollId++;
  }

  // check coordinator key is a valid point on the curve
  if (!CurveBabyJubJub.isOnCurve(args.coordinatorPubKey.x, args.coordinatorPubKey.y)) {
    revert InvalidPubKey();
  }

  ExtContracts memory extContracts = ExtContracts({
    maci: IMACI(address(this)),
    verifier: IVerifier(args.verifier),
    vkRegistry: IVkRegistry(args.vkRegistry),
    policy: IsignUpPolicy(args.policy),
    initialVoiceCreditProxy: IInitialVoiceCreditProxy(args.initialVoiceCreditProxy)
  });

  IPollFactory.DeployPollArgs memory deployPollArgs = IPollFactory.DeployPollArgs({
    startDate: args.startDate,
    endDate: args.endDate,
    treeDepths: args.treeDepths,
    messageBatchSize: args.messageBatchSize,
    coordinatorPubKey: args.coordinatorPubKey,
    extContracts: extContracts,
    emptyBallotRoot: emptyBallotRoots[args.treeDepths.voteOptionTreeDepth - 1],
    pollId: pollId,
    relayers: args.relayers,
    voteOptions: args.voteOptions
  });

  address p = pollFactory.deploy(deployPollArgs);
  address mp = messageProcessorFactory.deploy(args.verifier, args.vkRegistry, p, msg.sender, args.mode);
  address tally = tallyFactory.deploy(args.verifier, args.vkRegistry, p, mp, msg.sender, args.mode);

  // store the addresses in a struct so they can be returned
  PollContracts memory pollAddr = PollContracts({ poll: p, messageProcessor: mp, tally: tally });

  polls[pollId] = pollAddr;

  emit DeployPoll(pollId, args.coordinatorPubKey.x, args.coordinatorPubKey.y, args.mode);

  return pollAddr;
}
```

Polls require the following information:

- `duration`: the duration of the poll
- `treeDepths`: the depth of the state tree, message tree, and vote option tree
- `coordinatorPubKey`: the public key of the poll's coordinator
- `verifier`: the address of the zk-SNARK verifier contract
- `vkRegistry`: the address of the vk registry contract
- `mode`: the mode of the poll, to set whether it supports quadratic voting or non quadratic voting
- `signUpPolicy`: the address of the sign up policy contract
- `initialVoiceCreditProxy`: the address of the initial voice credit proxy contract
- `relayers`: the addresses of the relayers for the poll (if offchain voting is enabled)
- `voteOptions`: the number of vote options for the poll

:::info
Please be advised that the number of signups in the MACI contract (number of leaves in the merkle tree holding MACI's state) considers the initial zero leaf as one signup. For this reason, when accounting for the real users signed up to MACI, you should subtract one from the value returned from the `totalSignups` function.
:::
