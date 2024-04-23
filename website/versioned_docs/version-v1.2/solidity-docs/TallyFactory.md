# TallyFactory

A factory contract which deploys Tally contracts.

### deploy

```solidity
function deploy(address _verifier, address _vkRegistry, address _poll, address _messageProcessor, address _owner) public virtual returns (address tallyAddr)
```

Deploy a new Tally or Subsidy contract and return the address.

#### Parameters

| Name               | Type    | Description               |
| ------------------ | ------- | ------------------------- |
| \_verifier         | address | Verifier contract         |
| \_vkRegistry       | address | VkRegistry contract       |
| \_poll             | address | Poll contract             |
| \_messageProcessor | address | MessageProcessor contract |
| \_owner            | address | Owner of the contract     |

#### Return Values

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| tallyAddr | address | The deployed contract |
