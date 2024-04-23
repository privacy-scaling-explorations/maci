# SignUpTokenGatekeeper

This contract allows to gatekeep MACI signups
by requiring new voters to own a certain ERC721 token

### token

```solidity
contract SignUpToken token
```

the reference to the SignUpToken contract

### maci

```solidity
address maci
```

the reference to the MACI contract

### registeredTokenIds

```solidity
mapping(uint256 => bool) registeredTokenIds
```

a mapping of tokenIds to whether they have been used to sign up

### AlreadyRegistered

```solidity
error AlreadyRegistered()
```

custom errors

### NotTokenOwner

```solidity
error NotTokenOwner()
```

### OnlyMACI

```solidity
error OnlyMACI()
```

### constructor

```solidity
constructor(contract SignUpToken _token) public payable
```

creates a new SignUpTokenGatekeeper

#### Parameters

| Name    | Type                 | Description                             |
| ------- | -------------------- | --------------------------------------- |
| \_token | contract SignUpToken | the address of the SignUpToken contract |

### setMaciInstance

```solidity
function setMaciInstance(address _maci) public
```

Adds an uninitialised MACI instance to allow for token signups

#### Parameters

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| \_maci | address | The MACI contract interface to be stored |

### register

```solidity
function register(address _user, bytes _data) public
```

Registers the user if they own the token with the token ID encoded in
\_data. Throws if the user does not own the token or if the token has
already been used to sign up.

#### Parameters

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| \_user | address | The user's Ethereum address.          |
| \_data | bytes   | The ABI-encoded tokenId as a uint256. |
