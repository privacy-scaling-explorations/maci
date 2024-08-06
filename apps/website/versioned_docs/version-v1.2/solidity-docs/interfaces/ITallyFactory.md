# ITallyFactory

TallyFactory interface

### deploy

```solidity
function deploy(address _verifier, address _vkRegistry, address _poll, address _messageProcessor, address _owner, bool _isQv) external returns (address)
```

Deploy a new Tally contract and return the address.

#### Parameters

| Name               | Type    | Description                  |
| ------------------ | ------- | ---------------------------- |
| \_verifier         | address | Verifier contract            |
| \_vkRegistry       | address | VkRegistry contract          |
| \_poll             | address | Poll contract                |
| \_messageProcessor | address | MessageProcessor contract    |
| \_owner            | address | Owner of the contract        |
| \_isQv             | bool    | Whether to support QV or not |

#### Return Values

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | address | The deployed contract |
