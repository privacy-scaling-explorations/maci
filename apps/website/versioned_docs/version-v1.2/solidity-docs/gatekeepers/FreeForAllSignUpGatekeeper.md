# FreeForAllGatekeeper

A SignUpGatekeeper which allows anyone to sign up.

### constructor

```solidity
constructor() public payable
```

Create a new instance of FreeForAllGatekeeper

### setMaciInstance

```solidity
function setMaciInstance(address _maci) public
```

setMaciInstance does nothing in this gatekeeper

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_maci | address | The MACI contract |

### register

```solidity
function register(address _address, bytes _data) public
```

Registers the user without any restrictions.

#### Parameters

| Name      | Type    | Description             |
| --------- | ------- | ----------------------- |
| \_address | address | The address of the user |
| \_data    | bytes   | memory additional data  |
