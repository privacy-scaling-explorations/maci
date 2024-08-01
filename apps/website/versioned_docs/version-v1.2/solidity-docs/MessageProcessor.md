# MessageProcessor

_MessageProcessor is used to process messages published by signup users.
It will process message by batch due to large size of messages.
After it finishes processing, the sbCommitment will be used for Tally and Subsidy contracts._

### NoMoreMessages

```solidity
error NoMoreMessages()
```

custom errors

### StateAqNotMerged

```solidity
error StateAqNotMerged()
```

### MessageAqNotMerged

```solidity
error MessageAqNotMerged()
```

### InvalidProcessMessageProof

```solidity
error InvalidProcessMessageProof()
```

### VkNotSet

```solidity
error VkNotSet()
```

### MaxVoteOptionsTooLarge

```solidity
error MaxVoteOptionsTooLarge()
```

### NumSignUpsTooLarge

```solidity
error NumSignUpsTooLarge()
```

### CurrentMessageBatchIndexTooLarge

```solidity
error CurrentMessageBatchIndexTooLarge()
```

### BatchEndIndexTooLarge

```solidity
error BatchEndIndexTooLarge()
```

### TREE_ARITY

```solidity
uint256 TREE_ARITY
```

### processingComplete

```solidity
bool processingComplete
```

Get the result of whether there are unprocessed messages left

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### numBatchesProcessed

```solidity
uint256 numBatchesProcessed
```

The number of batches processed

### currentMessageBatchIndex

```solidity
uint256 currentMessageBatchIndex
```

The current message batch index. When the coordinator runs
processMessages(), this action relates to messages
currentMessageBatchIndex to currentMessageBatchIndex + messageBatchSize.

### sbCommitment

```solidity
uint256 sbCommitment
```

Get the commitment to the state and ballot roots

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### poll

```solidity
contract IPoll poll
```

### verifier

```solidity
contract IVerifier verifier
```

### vkRegistry

```solidity
contract IVkRegistry vkRegistry
```

### constructor

```solidity
constructor(address _verifier, address _vkRegistry, address _poll) public payable
```

Create a new instance

#### Parameters

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| \_verifier   | address | The Verifier contract address   |
| \_vkRegistry | address | The VkRegistry contract address |
| \_poll       | address | The Poll contract address       |

### processMessages

```solidity
function processMessages(uint256 _newSbCommitment, uint256[8] _proof) external
```

Update the Poll's currentSbCommitment if the proof is valid.

#### Parameters

| Name              | Type       | Description                                                                    |
| ----------------- | ---------- | ------------------------------------------------------------------------------ |
| \_newSbCommitment | uint256    | The new state root and ballot root commitment after all messages are processed |
| \_proof           | uint256[8] | The zk-SNARK proof                                                             |

### verifyProcessProof

```solidity
function verifyProcessProof(uint256 _currentMessageBatchIndex, uint256 _messageRoot, uint256 _currentSbCommitment, uint256 _newSbCommitment, uint8 _messageTreeSubDepth, uint8 _messageTreeDepth, uint8 _voteOptionTreeDepth, uint256[8] _proof) internal view returns (bool isValid)
```

Verify the proof for processMessage

_used to update the sbCommitment_

#### Parameters

| Name                       | Type       | Description                                             |
| -------------------------- | ---------- | ------------------------------------------------------- |
| \_currentMessageBatchIndex | uint256    | The batch index of current message batch                |
| \_messageRoot              | uint256    | The message tree root                                   |
| \_currentSbCommitment      | uint256    | The current sbCommitment (state and ballot)             |
| \_newSbCommitment          | uint256    | The new sbCommitment after we update this message batch |
| \_messageTreeSubDepth      | uint8      | The message tree subdepth                               |
| \_messageTreeDepth         | uint8      | The message tree depth                                  |
| \_voteOptionTreeDepth      | uint8      | The vote option tree depth                              |
| \_proof                    | uint256[8] | The zk-SNARK proof                                      |

#### Return Values

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| isValid | bool | Whether the proof is valid |

### genProcessMessagesPublicInputHash

```solidity
function genProcessMessagesPublicInputHash(uint256 _currentMessageBatchIndex, uint256 _messageRoot, uint256 _numSignUps, uint256 _numMessages, uint256 _currentSbCommitment, uint256 _newSbCommitment, uint8 _messageTreeSubDepth, uint8 _voteOptionTreeDepth) public view returns (uint256 inputHash)
```

Returns the SHA256 hash of the packed values (see
genProcessMessagesPackedVals), the hash of the coordinator's public key,
the message root, and the commitment to the current state root and
ballot root. By passing the SHA256 hash of these values to the circuit
as a single public input and the preimage as private inputs, we reduce
its verification gas cost though the number of constraints will be
higher and proving time will be longer.

#### Parameters

| Name                       | Type    | Description                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| \_currentMessageBatchIndex | uint256 | The batch index of current message batch                |
| \_messageRoot              | uint256 |                                                         |
| \_numSignUps               | uint256 | The number of users that signup                         |
| \_numMessages              | uint256 | The number of messages                                  |
| \_currentSbCommitment      | uint256 | The current sbCommitment (state and ballot root)        |
| \_newSbCommitment          | uint256 | The new sbCommitment after we update this message batch |
| \_messageTreeSubDepth      | uint8   | The message tree subdepth                               |
| \_voteOptionTreeDepth      | uint8   |                                                         |

#### Return Values

| Name      | Type    | Description                                  |
| --------- | ------- | -------------------------------------------- |
| inputHash | uint256 | Returns the SHA256 hash of the packed values |

### genProcessMessagesPackedVals

```solidity
function genProcessMessagesPackedVals(uint256 _currentMessageBatchIndex, uint256 _numSignUps, uint256 _numMessages, uint8 _messageTreeSubDepth, uint8 _voteOptionTreeDepth) public pure returns (uint256 result)
```

One of the inputs to the ProcessMessages circuit is a 250-bit
representation of four 50-bit values. This function generates this
250-bit value, which consists of the maximum number of vote options, the
number of signups, the current message batch index, and the end index of
the current batch.

#### Parameters

| Name                       | Type    | Description                          |
| -------------------------- | ------- | ------------------------------------ |
| \_currentMessageBatchIndex | uint256 | batch index of current message batch |
| \_numSignUps               | uint256 | number of users that signup          |
| \_numMessages              | uint256 | number of messages                   |
| \_messageTreeSubDepth      | uint8   | message tree subdepth                |
| \_voteOptionTreeDepth      | uint8   | vote option tree depth               |

#### Return Values

| Name   | Type    | Description      |
| ------ | ------- | ---------------- |
| result | uint256 | The packed value |

### updateMessageProcessingData

```solidity
function updateMessageProcessingData(uint256 _newSbCommitment, uint256 _currentMessageBatchIndex, bool _processingComplete) internal
```

update message processing state variables

#### Parameters

| Name                       | Type    | Description                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| \_newSbCommitment          | uint256 | sbCommitment to be updated                              |
| \_currentMessageBatchIndex | uint256 | currentMessageBatchIndex to be updated                  |
| \_processingComplete       | bool    | update flag that indicate processing is finished or not |
