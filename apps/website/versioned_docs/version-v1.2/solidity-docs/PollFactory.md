# PollFactory

A factory contract which deploys Poll contracts. It allows the MACI contract
size to stay within the limit set by EIP-170.

### TREE_ARITY

```solidity
uint256 TREE_ARITY
```

### InvalidMaxValues

```solidity
error InvalidMaxValues()
```

### constructor

```solidity
constructor() public payable
```

The PollFactory constructor

### deploy

```solidity
function deploy(uint256 _duration, struct Params.MaxValues _maxValues, struct Params.TreeDepths _treeDepths, struct DomainObjs.PubKey _coordinatorPubKey, address _maci, contract TopupCredit _topupCredit, address _pollOwner) public virtual returns (address pollAddr)
```

Deploy a new Poll contract and AccQueue contract for messages.

#### Parameters

| Name                | Type                     | Description                           |
| ------------------- | ------------------------ | ------------------------------------- |
| \_duration          | uint256                  | The duration of the poll              |
| \_maxValues         | struct Params.MaxValues  | The max values for the poll           |
| \_treeDepths        | struct Params.TreeDepths | The depths of the merkle trees        |
| \_coordinatorPubKey | struct DomainObjs.PubKey | The coordinator's public key          |
| \_maci              | address                  | The MACI contract interface reference |
| \_topupCredit       | contract TopupCredit     | The TopupCredit contract              |
| \_pollOwner         | address                  | The owner of the poll                 |

#### Return Values

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| pollAddr | address | The deployed Poll contract |
