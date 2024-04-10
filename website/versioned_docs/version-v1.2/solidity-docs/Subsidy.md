# Subsidy

This contract is used to verify that the subsidy calculations
are correct. It is also used to update the subsidy commitment if the
proof is valid.

### rbi

```solidity
uint256 rbi
```

### cbi

```solidity
uint256 cbi
```

### sbCommitment

```solidity
uint256 sbCommitment
```

### subsidyCommitment

```solidity
uint256 subsidyCommitment
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

### mp

```solidity
contract IMessageProcessor mp
```

### ProcessingNotComplete

```solidity
error ProcessingNotComplete()
```

### InvalidSubsidyProof

```solidity
error InvalidSubsidyProof()
```

### AllSubsidyCalculated

```solidity
error AllSubsidyCalculated()
```

### VkNotSet

```solidity
error VkNotSet()
```

### NumSignUpsTooLarge

```solidity
error NumSignUpsTooLarge()
```

### RbiTooLarge

```solidity
error RbiTooLarge()
```

### CbiTooLarge

```solidity
error CbiTooLarge()
```

### constructor

```solidity
constructor(address _verifier, address _vkRegistry, address _poll, address _mp) public payable
```

Create a new Subsidy contract

#### Parameters

| Name         | Type    | Description                   |
| ------------ | ------- | ----------------------------- |
| \_verifier   | address | The Verifier contract         |
| \_vkRegistry | address | The VkRegistry contract       |
| \_poll       | address | The Poll contract             |
| \_mp         | address | The MessageProcessor contract |

### updateSbCommitment

```solidity
function updateSbCommitment() public
```

Update the currentSbCommitment if the proof is valid.

_currentSbCommitment is the commitment to the state and ballot roots_

### genSubsidyPackedVals

```solidity
function genSubsidyPackedVals(uint256 _numSignUps) public view returns (uint256 result)
```

Generate the packed values for the subsidy proof

#### Parameters

| Name         | Type    | Description           |
| ------------ | ------- | --------------------- |
| \_numSignUps | uint256 | The number of signups |

#### Return Values

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| result | uint256 | The packed values |

### genSubsidyPublicInputHash

```solidity
function genSubsidyPublicInputHash(uint256 _numSignUps, uint256 _newSubsidyCommitment) public view returns (uint256 inputHash)
```

Generate the public input hash for the subsidy proof

#### Parameters

| Name                   | Type    | Description                |
| ---------------------- | ------- | -------------------------- |
| \_numSignUps           | uint256 | The number of signups      |
| \_newSubsidyCommitment | uint256 | The new subsidy commitment |

#### Return Values

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| inputHash | uint256 | The public input hash |

### updateSubsidy

```solidity
function updateSubsidy(uint256 _newSubsidyCommitment, uint256[8] _proof) external
```

Update the subsidy commitment if the proof is valid

#### Parameters

| Name                   | Type       | Description                |
| ---------------------- | ---------- | -------------------------- |
| \_newSubsidyCommitment | uint256    | The new subsidy commitment |
| \_proof                | uint256[8] | The proof                  |

### increaseSubsidyIndex

```solidity
function increaseSubsidyIndex(uint256 batchSize, uint256 numLeaves) internal
```

Increase the subsidy batch index (rbi, cbi) to next,
it will try to cbi++ if the whole batch can fit into numLeaves
otherwise it will increase row index: rbi++.
Each batch for subsidy calculation is 2 dimensional: batchSize\*batchSize

#### Parameters

| Name      | Type    | Description                                                      |
| --------- | ------- | ---------------------------------------------------------------- |
| batchSize | uint256 | the size of 1 dimensional batch over the signup users            |
| numLeaves | uint256 | total number of leaves in stateTree, i.e. number of signup users |

### verifySubsidyProof

```solidity
function verifySubsidyProof(uint256[8] _proof, uint256 _numSignUps, uint256 _newSubsidyCommitment) public view returns (bool isValid)
```

Verify the subsidy proof using the Groth16 on chain verifier

#### Parameters

| Name                   | Type       | Description                |
| ---------------------- | ---------- | -------------------------- |
| \_proof                | uint256[8] | The proof                  |
| \_numSignUps           | uint256    | The number of signups      |
| \_newSubsidyCommitment | uint256    | The new subsidy commitment |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| isValid | bool | True if the proof is valid |
