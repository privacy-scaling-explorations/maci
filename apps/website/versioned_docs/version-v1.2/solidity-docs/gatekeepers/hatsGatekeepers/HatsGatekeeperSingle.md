# HatsGatekeeperSingle

A gatekeeper contract which allows users to sign up to MACI
only if they are wearing a specified hat

### criterionHat

```solidity
uint256 criterionHat
```

The hat that users must wear to be eligible to register

### constructor

```solidity
constructor(address _hats, uint256 _criterionHat) public payable
```

Deploy an instance of HatsGatekeeperSingle

#### Parameters

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_hats         | address | The Hats Protocol contract |
| \_criterionHat | uint256 | The required hat           |

### register

```solidity
function register(address _user, bytes) public
```

Registers the user

#### Parameters

| Name   | Type    | Description             |
| ------ | ------- | ----------------------- |
| \_user | address | The address of the user |
|        | bytes   |                         |
