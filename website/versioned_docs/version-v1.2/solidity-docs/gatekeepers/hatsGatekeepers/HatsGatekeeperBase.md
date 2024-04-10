# HatsGatekeeperBase

Abstract contract containing the base elements of a Hats Gatekeeper contract

### OnlyMACI

```solidity
error OnlyMACI()
```

### NotWearingCriterionHat

```solidity
error NotWearingCriterionHat()
```

### AlreadyRegistered

```solidity
error AlreadyRegistered()
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### hats

```solidity
contract IHats hats
```

The Hats Protocol contract address

### maci

```solidity
address maci
```

the reference to the MACI contract

### registered

```solidity
mapping(address => bool) registered
```

Tracks registered users

### constructor

```solidity
constructor(address _hats) internal payable
```

Deploy an instance of HatsGatekeeper

#### Parameters

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| \_hats | address | The Hats Protocol contract |

### setMaciInstance

```solidity
function setMaciInstance(address _maci) public
```

Allows to set the MACI contract

#### Parameters

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| \_maci | address | The MACI contract interface to be stored |
