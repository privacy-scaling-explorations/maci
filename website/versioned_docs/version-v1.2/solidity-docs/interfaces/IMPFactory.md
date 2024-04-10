# IMessageProcessorFactory

MessageProcessorFactory interface

### deploy

```solidity
function deploy(address _verifier, address _vkRegistry, address _poll, address _owner) external returns (address)
```

Deploy a new MessageProcessor contract and return the address.

#### Parameters

| Name         | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| \_verifier   | address | Verifier contract                      |
| \_vkRegistry | address | VkRegistry contract                    |
| \_poll       | address | Poll contract                          |
| \_owner      | address | Owner of the MessageProcessor contract |

#### Return Values

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| [0]  | address | The deployed MessageProcessor contract |
