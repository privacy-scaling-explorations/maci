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
- `SignUpGatekeeper` address
- `InitialVoiceCreditProxy` address
- The depth of the state tree

```javascript
constructor(
    IPollFactory _pollFactory,
    IMessageProcessorFactory _messageProcessorFactory,
    ITallyFactory _tallyFactory,
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    uint8 _stateTreeDepth
) payable {
    // initialize and insert the blank leaf
    InternalLazyIMT._init(lazyIMTData, _stateTreeDepth);
    InternalLazyIMT._insert(lazyIMTData, BLANK_STATE_LEAF_HASH);

    pollFactory = _pollFactory;
    messageProcessorFactory = _messageProcessorFactory;
    tallyFactory = _tallyFactory;
    signUpGatekeeper = _signUpGatekeeper;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
    stateTreeDepth = _stateTreeDepth;

    // Verify linked poseidon libraries
    if (hash2([uint256(1), uint256(1)]) == 0) revert PoseidonHashLibrariesNotLinked();
}

```

Upon deployment, the contract will initialize the state tree, and insert the blank leaf hash.

After this, all of the parameters will be stored to state, and then the contract will perform a simple sanity check to ensure that the Poseidon hash libraries were linked successfully.

## SignUp

Next, we have the `signUp` function, which allows users to `signUp`, as long as they pass the conditions set in the `SignUpGatekeeper` contract. This contract can use any mean necessary to gatekeep access to MACI's polls. For instance, only wallets with a specific ERC721 token can be allowed to sign up.

This function does the following:

- checks that the maximum number of signups has not been reached. Given a tree depth of 10, this will be $2 ** 10 - 1$.
- checks that the provided public key is a valid baby-jubjub point
- registers the user using the sign up gatekeeper contract. It is important that whichever gatekeeper is used, this reverts if a user tries to sign up twice or the conditions are not met (i.e returning false is not enough)
- calls the voice credit proxy to retrieve the number of allocated voice credits allocated to this voter
- hashes the voice credits alongside the user's MACI public key and the current time
- insert this hashed data into the state tree.

```javascript
function signUp(
    PubKey memory _pubKey,
    bytes memory _signUpGatekeeperData,
    bytes memory _initialVoiceCreditProxyData
) public virtual {
    // ensure we do not have more signups than what the circuits support
    if (lazyIMTData.numberOfLeaves >= maxSignups) revert TooManySignups();

    // ensure that the public key is on the baby jubjub curve
    if (!CurveBabyJubJub.isOnCurve(_pubKey.x, _pubKey.y)) {
      revert InvalidPubKey();
    }

    // Register the user via the sign-up gatekeeper. This function should
    // throw if the user has already registered or if ineligible to do so.
    signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

    // Get the user's voice credit balance.
    uint256 voiceCreditBalance = initialVoiceCreditProxy.getVoiceCredits(msg.sender, _initialVoiceCreditProxyData);

    uint256 timestamp = block.timestamp;

    // Create a state leaf and insert it into the tree.
    uint256 stateLeaf = hashStateLeaf(StateLeaf(_pubKey, voiceCreditBalance, timestamp));
    InternalLazyIMT._insert(lazyIMTData, stateLeaf);

    emit SignUp(lazyIMTData.numberOfLeaves - 1, _pubKey.x, _pubKey.y, voiceCreditBalance, timestamp);
}
```

## DeployPoll

Once everything has been setup, polls can be deployed using the `deployPoll` function. Polls can be deployed concurrently, as each deployment has its own separate set of contracts and state.

```javascript
function deployPoll(
    uint256 _duration,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey,
    address _verifier,
    address _vkRegistry,
    Mode _mode
  ) public virtual returns (PollContracts memory pollAddr) {
    // cache the poll to a local variable so we can increment it
    uint256 pollId = nextPollId;

    // Increment the poll ID for the next poll
    // 2 ** 256 polls available
    unchecked {
      nextPollId++;
    }

    // check coordinator key is a valid point on the curve
    if (!CurveBabyJubJub.isOnCurve(_coordinatorPubKey.x, _coordinatorPubKey.y)) {
      revert InvalidPubKey();
    }

    // the owner of the message processor and tally contract will be the msg.sender
    address _msgSender = msg.sender;

    address p = pollFactory.deploy(_duration, _treeDepths, _coordinatorPubKey, address(this));

    address mp = messageProcessorFactory.deploy(_verifier, _vkRegistry, p, _msgSender, _mode);
    address tally = tallyFactory.deploy(_verifier, _vkRegistry, p, mp, _msgSender, _mode);

    polls[pollId] = p;

    // store the addresses in a struct so they can be returned
    pollAddr = PollContracts({ poll: p, messageProcessor: mp, tally: tally });

    emit DeployPoll(pollId, _coordinatorPubKey.x, _coordinatorPubKey.y, pollAddr);
  }
```

Polls require the following information:

- `duration`: the duration of the poll
- `treeDepths`: the depth of the state tree, message tree, and vote option tree
- `coordinatorPubKey`: the public key of the poll's coordinator
- `verifier`: the address of the zk-SNARK verifier contract
- `vkRegistry`: the address of the vk registry contract
- `mode`: the mode of the poll, to set whether it supports quadratic voting or non quadratic voting

:::info
Please be advised that the number of signups in the MACI contract (number of leaves in the merkle tree holding MACI's state) considers the initial zero leaf as one signup. For this reason, when accounting for the real users signed up to MACI, you should subtract one from the value returned from the `numSignUps` function.
:::
