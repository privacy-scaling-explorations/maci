# SignUpToken

This contract is an ERC721 token contract which
can be used to allow users to sign up for a poll.

### constructor

```solidity
constructor() public payable
```

The constructor which calls the ERC721 constructor

### giveToken

```solidity
function giveToken(address to, uint256 curTokenId) public
```

Gives an ERC721 token to an address

#### Parameters

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| to         | address | The address to give the token to |
| curTokenId | uint256 | The token id to give             |
