# ConstantInitialVoiceCreditProxy

This contract allows to set a constant initial voice credit balance
for MACI's voters.

### balance

```solidity
uint256 balance
```

the balance to be returned by getVoiceCredits

### constructor

```solidity
constructor(uint256 _balance) public payable
```

creates a new ConstantInitialVoiceCreditProxy

#### Parameters

| Name      | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| \_balance | uint256 | the balance to be returned by getVoiceCredits |

### getVoiceCredits

```solidity
function getVoiceCredits(address, bytes) public view returns (uint256)
```

Returns the constant balance for any new MACI's voter

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 | balance     |
