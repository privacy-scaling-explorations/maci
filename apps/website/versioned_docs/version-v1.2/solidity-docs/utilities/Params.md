# Params

This contracts contains a number of structures
which are to be passed as parameters to Poll contracts.
This way we can reduce the number of parameters
and avoid a stack too deep error during compilation.

### TreeDepths

```solidity
struct TreeDepths {
  uint8 intStateTreeDepth;
  uint8 messageTreeSubDepth;
  uint8 messageTreeDepth;
  uint8 voteOptionTreeDepth;
}
```

### MaxValues

```solidity
struct MaxValues {
  uint256 maxMessages;
  uint256 maxVoteOptions;
}
```

### ExtContracts

```solidity
struct ExtContracts {
  contract IMACI maci;
  contract AccQueue messageAq;
  contract TopupCredit topupCredit;
}
```
