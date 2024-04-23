# SignUpGatekeeper

A gatekeeper contract which allows users to sign up for a poll.

### setMaciInstance

```solidity
function setMaciInstance(address _maci) public virtual
```

Allows to set the MACI contract

### register

```solidity
function register(address _user, bytes _data) public virtual
```

Registers the user

#### Parameters

| Name   | Type    | Description             |
| ------ | ------- | ----------------------- |
| \_user | address | The address of the user |
| \_data | bytes   | additional data         |
