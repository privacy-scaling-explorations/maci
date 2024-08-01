# CommonUtilities

A contract that holds common utilities
which are to be used by multiple contracts
namely Subsidy, Tally and MessageProcessor

### VotingPeriodNotPassed

```solidity
error VotingPeriodNotPassed()
```

### \_votingPeriodOver

```solidity
function _votingPeriodOver(contract IPoll _poll) internal view
```

common function for MessageProcessor, Tally and Subsidy

#### Parameters

| Name   | Type           | Description            |
| ------ | -------------- | ---------------------- |
| \_poll | contract IPoll | the poll to be checked |
