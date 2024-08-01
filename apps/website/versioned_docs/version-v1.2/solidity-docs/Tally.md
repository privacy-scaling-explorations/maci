# Tally

The Tally contract is used during votes tallying
and by users to verify the tally results.

### TREE_ARITY

```solidity
uint256 TREE_ARITY
```

### tallyCommitment

```solidity
uint256 tallyCommitment
```

The commitment to the tally results. Its initial value is 0, but after
the tally of each batch is proven on-chain via a zk-SNARK, it should be
updated to:

hash3(
hashLeftRight(merkle root of current results, salt0)
hashLeftRight(number of spent voice credits, salt1),
hashLeftRight(merkle root of the no. of spent voice credits per vote option, salt2)
)

Where each salt is unique and the merkle roots are of arrays of leaves
TREE_ARITY \*\* voteOptionTreeDepth long.

### tallyBatchNum

```solidity
uint256 tallyBatchNum
```

### sbCommitment

```solidity
uint256 sbCommitment
```

### verifier

```solidity
contract IVerifier verifier
```

### vkRegistry

```solidity
contract IVkRegistry vkRegistry
```

### poll

```solidity
contract IPoll poll
```

### messageProcessor

```solidity
contract IMessageProcessor messageProcessor
```

### ProcessingNotComplete

```solidity
error ProcessingNotComplete()
```

custom errors

### InvalidTallyVotesProof

```solidity
error InvalidTallyVotesProof()
```

### AllBallotsTallied

```solidity
error AllBallotsTallied()
```

### NumSignUpsTooLarge

```solidity
error NumSignUpsTooLarge()
```

### BatchStartIndexTooLarge

```solidity
error BatchStartIndexTooLarge()
```

### TallyBatchSizeTooLarge

```solidity
error TallyBatchSizeTooLarge()
```

### constructor

```solidity
constructor(address _verifier, address _vkRegistry, address _poll, address _mp) public payable
```

Create a new Tally contract

#### Parameters

| Name         | Type    | Description                   |
| ------------ | ------- | ----------------------------- |
| \_verifier   | address | The Verifier contract         |
| \_vkRegistry | address | The VkRegistry contract       |
| \_poll       | address | The Poll contract             |
| \_mp         | address | The MessageProcessor contract |

### genTallyVotesPackedVals

```solidity
function genTallyVotesPackedVals(uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize) public pure returns (uint256 result)
```

Pack the batch start index and number of signups into a 100-bit value.

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| \_numSignUps      | uint256 |             |
| \_batchStartIndex | uint256 |             |
| \_tallyBatchSize  | uint256 |             |

#### Return Values

| Name   | Type    | Description                                          |
| ------ | ------- | ---------------------------------------------------- |
| result | uint256 | an uint256 representing the 3 inputs packed together |

### isTallied

```solidity
function isTallied() public view returns (bool tallied)
```

Check if all ballots are tallied

#### Return Values

| Name    | Type | Description                     |
| ------- | ---- | ------------------------------- |
| tallied | bool | whether all ballots are tallied |

### genTallyVotesPublicInputHash

```solidity
function genTallyVotesPublicInputHash(uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize, uint256 _newTallyCommitment) public view returns (uint256 inputHash)
```

generate hash of public inputs for tally circuit

#### Parameters

| Name                 | Type    | Description |
| -------------------- | ------- | ----------- |
| \_numSignUps         | uint256 |             |
| \_batchStartIndex    | uint256 |             |
| \_tallyBatchSize     | uint256 |             |
| \_newTallyCommitment | uint256 |             |

#### Return Values

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| inputHash | uint256 | hash of public inputs |

### updateSbCommitment

```solidity
function updateSbCommitment() public
```

Update the state and ballot root commitment

### tallyVotes

```solidity
function tallyVotes(uint256 _newTallyCommitment, uint256[8] _proof) public
```

Verify the result of a tally batch

#### Parameters

| Name                 | Type       | Description                                   |
| -------------------- | ---------- | --------------------------------------------- |
| \_newTallyCommitment | uint256    | the new tally commitment to be verified       |
| \_proof              | uint256[8] | the proof generated after tallying this batch |

### verifyTallyProof

```solidity
function verifyTallyProof(uint256[8] _proof, uint256 _numSignUps, uint256 _batchStartIndex, uint256 _tallyBatchSize, uint256 _newTallyCommitment) public view returns (bool isValid)
```

Verify the tally proof using the verifying key

#### Parameters

| Name                 | Type       | Description                                                |
| -------------------- | ---------- | ---------------------------------------------------------- |
| \_proof              | uint256[8] | the proof generated after processing all messages          |
| \_numSignUps         | uint256    | number of signups for a given poll                         |
| \_batchStartIndex    | uint256    | the number of batches multiplied by the size of the batch  |
| \_tallyBatchSize     | uint256    | batch size for the tally                                   |
| \_newTallyCommitment | uint256    | the tally commitment to be verified at a given batch index |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| isValid | bool | whether the proof is valid |

### computeMerkleRootFromPath

```solidity
function computeMerkleRootFromPath(uint8 _depth, uint256 _index, uint256 _leaf, uint256[][] _pathElements) internal pure returns (uint256 current)
```

Compute the merkle root from the path elements
and a leaf

#### Parameters

| Name           | Type        | Description                                      |
| -------------- | ----------- | ------------------------------------------------ |
| \_depth        | uint8       | the depth of the merkle tree                     |
| \_index        | uint256     | the index of the leaf                            |
| \_leaf         | uint256     | the leaf                                         |
| \_pathElements | uint256[][] | the path elements to reconstruct the merkle root |

#### Return Values

| Name    | Type    | Description     |
| ------- | ------- | --------------- |
| current | uint256 | The merkle root |

### verifySpentVoiceCredits

```solidity
function verifySpentVoiceCredits(uint256 _totalSpent, uint256 _totalSpentSalt, uint256 _resultCommitment, uint256 _perVOSpentVoiceCreditsHash) public view returns (bool isValid)
```

Verify the number of spent voice credits from the tally.json

#### Parameters

| Name                         | Type    | Description                                                                      |
| ---------------------------- | ------- | -------------------------------------------------------------------------------- |
| \_totalSpent                 | uint256 | spent field retrieved in the totalSpentVoiceCredits object                       |
| \_totalSpentSalt             | uint256 | the corresponding salt in the totalSpentVoiceCredit object                       |
| \_resultCommitment           | uint256 | hashLeftRight(merkle root of the results.tally, results.salt) in tally.json file |
| \_perVOSpentVoiceCreditsHash | uint256 | hashLeftRight(merkle root of the no spent voice credits per vote option, salt)   |

#### Return Values

| Name    | Type | Description                           |
| ------- | ---- | ------------------------------------- |
| isValid | bool | Whether the provided values are valid |

### verifyPerVOSpentVoiceCredits

```solidity
function verifyPerVOSpentVoiceCredits(uint256 _voteOptionIndex, uint256 _spent, uint256[][] _spentProof, uint256 _spentSalt, uint8 _voteOptionTreeDepth, uint256 _spentVoiceCreditsHash, uint256 _resultCommitment) public view returns (bool isValid)
```

#### Return Values

| Name    | Type | Description                         |
| ------- | ---- | ----------------------------------- |
| isValid | bool | Whether the provided proof is valid |

### verifyTallyResult

```solidity
function verifyTallyResult(uint256 _voteOptionIndex, uint256 _tallyResult, uint256[][] _tallyResultProof, uint256 _tallyResultSalt, uint8 _voteOptionTreeDepth, uint256 _spentVoiceCreditsHash, uint256 _perVOSpentVoiceCreditsHash) public view returns (bool isValid)
```

Verify the result generated from the tally.json

#### Parameters

| Name                         | Type        | Description                                                                                           |
| ---------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| \_voteOptionIndex            | uint256     | the index of the vote option to verify the correctness of the tally                                   |
| \_tallyResult                | uint256     | Flattened array of the tally                                                                          |
| \_tallyResultProof           | uint256[][] | Corresponding proof of the tally result                                                               |
| \_tallyResultSalt            | uint256     | the respective salt in the results object in the tally.json                                           |
| \_voteOptionTreeDepth        | uint8       | depth of the vote option tree                                                                         |
| \_spentVoiceCreditsHash      | uint256     | hashLeftRight(number of spent voice credits, spent salt)                                              |
| \_perVOSpentVoiceCreditsHash | uint256     | hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt) |

#### Return Values

| Name    | Type | Description                         |
| ------- | ---- | ----------------------------------- |
| isValid | bool | Whether the provided proof is valid |
