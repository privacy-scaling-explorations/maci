# MessageProcessorFactory

A factory contract which deploys MessageProcessor contracts.

### deploy

```solidity
function deploy(address _verifier, address _vkRegistry, address _poll, address _owner) public returns (address messageProcessorAddr)
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

| Name                 | Type    | Description                            |
| -------------------- | ------- | -------------------------------------- |
| messageProcessorAddr | address | The deployed MessageProcessor contract |
