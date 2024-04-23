# MACI

A contract which allows users to sign up, and deploy new polls

### stateTreeDepth

```solidity
uint8 stateTreeDepth
```

The state tree depth is fixed. As such it should be as large as feasible
so that there can be as many users as possible. i.e. 5 \*\* 10 = 9765625
this should also match the parameter of the circom circuits.

### STATE_TREE_SUBDEPTH

```solidity
uint8 STATE_TREE_SUBDEPTH
```

IMPORTANT: remember to change the ballot tree depth
in contracts/ts/genEmptyBallotRootsContract.ts file
if we change the state tree depth!

### TREE_ARITY

```solidity
uint8 TREE_ARITY
```

### BLANK_STATE_LEAF_HASH

```solidity
uint256 BLANK_STATE_LEAF_HASH
```

The hash of a blank state leaf

### nextPollId

```solidity
uint256 nextPollId
```

Each poll has an incrementing ID

### polls

```solidity
mapping(uint256 => address) polls
```

A mapping of poll IDs to Poll contracts.

### subtreesMerged

```solidity
bool subtreesMerged
```

Whether the subtrees have been merged (can merge root before new signup)

### numSignUps

```solidity
uint256 numSignUps
```

The number of signups

### topupCredit

```solidity
contract TopupCredit topupCredit
```

ERC20 contract that hold topup credits

### pollFactory

```solidity
contract IPollFactory pollFactory
```

Factory contract that deploy a Poll contract

### messageProcessorFactory

```solidity
contract IMessageProcessorFactory messageProcessorFactory
```

Factory contract that deploy a MessageProcessor contract

### tallyFactory

```solidity
contract ITallySubsidyFactory tallyFactory
```

Factory contract that deploy a Tally contract

### subsidyFactory

```solidity
contract ITallySubsidyFactory subsidyFactory
```

Factory contract that deploy a Subsidy contract

### stateAq

```solidity
contract AccQueue stateAq
```

The state AccQueue. Represents a mapping between each user's public key
and their voice credit balance.

### signUpGatekeeper

```solidity
contract SignUpGatekeeper signUpGatekeeper
```

Address of the SignUpGatekeeper, a contract which determines whether a
user may sign up to vote

### initialVoiceCreditProxy

```solidity
contract InitialVoiceCreditProxy initialVoiceCreditProxy
```

The contract which provides the values of the initial voice credit
balance per user

### PollContracts

```solidity
struct PollContracts {
  address poll;
  address messageProcessor;
  address tally;
  address subsidy;
}
```

### SignUp

```solidity
event SignUp(uint256 _stateIndex, uint256 _userPubKeyX, uint256 _userPubKeyY, uint256 _voiceCreditBalance, uint256 _timestamp)
```

### DeployPoll

```solidity
event DeployPoll(uint256 _pollId, uint256 _coordinatorPubKeyX, uint256 _coordinatorPubKeyY, struct MACI.PollContracts pollAddr)
```

### onlyPoll

```solidity
modifier onlyPoll(uint256 _pollId)
```

Only allow a Poll contract to call the modified function.

### CallerMustBePoll

```solidity
error CallerMustBePoll(address _caller)
```

custom errors

### PoseidonHashLibrariesNotLinked

```solidity
error PoseidonHashLibrariesNotLinked()
```

### TooManySignups

```solidity
error TooManySignups()
```

### MaciPubKeyLargerThanSnarkFieldSize

```solidity
error MaciPubKeyLargerThanSnarkFieldSize()
```

### PreviousPollNotCompleted

```solidity
error PreviousPollNotCompleted(uint256 pollId)
```

### PollDoesNotExist

```solidity
error PollDoesNotExist(uint256 pollId)
```

### SignupTemporaryBlocked

```solidity
error SignupTemporaryBlocked()
```

### constructor

```solidity
constructor(contract IPollFactory _pollFactory, contract IMessageProcessorFactory _messageProcessorFactory, contract ITallySubsidyFactory _tallyFactory, contract ITallySubsidyFactory _subsidyFactory, contract SignUpGatekeeper _signUpGatekeeper, contract InitialVoiceCreditProxy _initialVoiceCreditProxy, contract TopupCredit _topupCredit, uint8 _stateTreeDepth) public payable
```

Create a new instance of the MACI contract.

#### Parameters

| Name                      | Type                              | Description                          |
| ------------------------- | --------------------------------- | ------------------------------------ |
| \_pollFactory             | contract IPollFactory             | The PollFactory contract             |
| \_messageProcessorFactory | contract IMessageProcessorFactory | The MessageProcessorFactory contract |
| \_tallyFactory            | contract ITallySubsidyFactory     | The TallyFactory contract            |
| \_subsidyFactory          | contract ITallySubsidyFactory     | The SubsidyFactory contract          |
| \_signUpGatekeeper        | contract SignUpGatekeeper         | The SignUpGatekeeper contract        |
| \_initialVoiceCreditProxy | contract InitialVoiceCreditProxy  | The InitialVoiceCreditProxy contract |
| \_topupCredit             | contract TopupCredit              | The TopupCredit contract             |
| \_stateTreeDepth          | uint8                             | The depth of the state tree          |

### signUp

```solidity
function signUp(struct DomainObjs.PubKey _pubKey, bytes _signUpGatekeeperData, bytes _initialVoiceCreditProxyData) public virtual
```

Allows any eligible user sign up. The sign-up gatekeeper should prevent
double sign-ups or ineligible users from doing so. This function will
only succeed if the sign-up deadline has not passed. It also enqueues a
fresh state leaf into the state AccQueue.

#### Parameters

| Name                          | Type                     | Description                                                                                                                                                                 |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_pubKey                      | struct DomainObjs.PubKey | The user's desired public key.                                                                                                                                              |
| \_signUpGatekeeperData        | bytes                    | Data to pass to the sign-up gatekeeper's register() function. For instance, the POAPGatekeeper or SignUpTokenGatekeeper requires this value to be the ABI-encoded token ID. |
| \_initialVoiceCreditProxyData | bytes                    | Data to pass to the InitialVoiceCreditProxy, which allows it to determine how many voice credits this user should have.                                                     |

### deployPoll

```solidity
function deployPoll(uint256 _duration, struct Params.TreeDepths _treeDepths, struct DomainObjs.PubKey _coordinatorPubKey, address _verifier, address _vkRegistry, bool useSubsidy) public virtual returns (struct MACI.PollContracts pollAddr)
```

Deploy a new Poll contract.

#### Parameters

| Name                | Type                     | Description                                     |
| ------------------- | ------------------------ | ----------------------------------------------- |
| \_duration          | uint256                  | How long should the Poll last for               |
| \_treeDepths        | struct Params.TreeDepths | The depth of the Merkle trees                   |
| \_coordinatorPubKey | struct DomainObjs.PubKey | The coordinator's public key                    |
| \_verifier          | address                  | The Verifier Contract                           |
| \_vkRegistry        | address                  | The VkRegistry Contract                         |
| useSubsidy          | bool                     | If true, the Poll will use the Subsidy contract |

#### Return Values

| Name     | Type                      | Description                 |
| -------- | ------------------------- | --------------------------- |
| pollAddr | struct MACI.PollContracts | a new Poll contract address |

### mergeStateAqSubRoots

```solidity
function mergeStateAqSubRoots(uint256 _numSrQueueOps, uint256 _pollId) public
```

Allow Poll contracts to merge the state subroots

#### Parameters

| Name            | Type    | Description               |
| --------------- | ------- | ------------------------- |
| \_numSrQueueOps | uint256 | Number of operations      |
| \_pollId        | uint256 | The ID of the active Poll |

### mergeStateAq

```solidity
function mergeStateAq(uint256 _pollId) public returns (uint256 root)
```

Allow Poll contracts to merge the state root

#### Parameters

| Name     | Type    | Description        |
| -------- | ------- | ------------------ |
| \_pollId | uint256 | The active Poll ID |

#### Return Values

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| root | uint256 | The calculated Merkle root |

### getStateAqRoot

```solidity
function getStateAqRoot() public view returns (uint256 root)
```

Return the main root of the StateAq contract

#### Return Values

| Name | Type    | Description     |
| ---- | ------- | --------------- |
| root | uint256 | The Merkle root |

### getPoll

```solidity
function getPoll(uint256 _pollId) public view returns (address poll)
```

Get the Poll details

#### Parameters

| Name     | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| \_pollId | uint256 | The identifier of the Poll to retrieve |

#### Return Values

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| poll | address | The Poll contract object |
