# InitialVoiceCreditProxy

This contract is the base contract for
InitialVoiceCreditProxy contracts. It allows to set a custom initial voice
credit balance for MACI's voters.

### getVoiceCredits

```solidity
function getVoiceCredits(address _user, bytes _data) public view virtual returns (uint256)
```

Returns the initial voice credit balance for a new MACI's voter

#### Parameters

| Name   | Type    | Description              |
| ------ | ------- | ------------------------ |
| \_user | address | the address of the voter |
| \_data | bytes   | additional data          |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 | the balance |
