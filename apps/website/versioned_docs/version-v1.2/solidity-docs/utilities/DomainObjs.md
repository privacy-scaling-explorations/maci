# DomainObjs

An utility contract that holds
a number of domain objects and functions

### MESSAGE_DATA_LENGTH

```solidity
uint8 MESSAGE_DATA_LENGTH
```

the length of a MACI message

### Message

```solidity
struct Message {
  uint256 msgType;
  uint256[10] data;
}
```

### PubKey

```solidity
struct PubKey {
  uint256 x;
  uint256 y;
}
```

### StateLeaf

```solidity
struct StateLeaf {
  struct DomainObjs.PubKey pubKey;
  uint256 voiceCreditBalance;
  uint256 timestamp;
}
```
