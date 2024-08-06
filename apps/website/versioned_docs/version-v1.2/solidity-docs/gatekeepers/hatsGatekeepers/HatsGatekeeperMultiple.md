# HatsGatekeeperMultiple

A gatekeeper contract which allows users to sign up to MACI
only if they are wearing one of the specified hats

### NotCriterionHat

```solidity
error NotCriterionHat()
```

### criterionHat

```solidity
mapping(uint256 => bool) criterionHat
```

Tracks hats that users must wear to be eligible to register

### constructor

```solidity
constructor(address _hats, uint256[] _criterionHats) public payable
```

Deploy an instance of HatsGatekeeperMultiple

#### Parameters

| Name            | Type      | Description                      |
| --------------- | --------- | -------------------------------- |
| \_hats          | address   | The Hats Protocol contract       |
| \_criterionHats | uint256[] | Array of accepted criterion hats |

### register

```solidity
function register(address _user, bytes _data) public
```

Registers the user

#### Parameters

| Name   | Type    | Description             |
| ------ | ------- | ----------------------- |
| \_user | address | The address of the user |
| \_data | bytes   | additional data         |
