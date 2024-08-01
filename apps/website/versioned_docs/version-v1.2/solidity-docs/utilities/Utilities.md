# Utilities

An utility contract that can be used to:

- hash a state leaf
- pad and hash a MACI message
- hash a MACI message and an encryption public key

### InvalidMessage

```solidity
error InvalidMessage()
```

custom errors

### hashStateLeaf

```solidity
function hashStateLeaf(struct DomainObjs.StateLeaf _stateLeaf) public pure returns (uint256 ciphertext)
```

An utility function used to hash a state leaf

#### Parameters

| Name        | Type                        | Description                 |
| ----------- | --------------------------- | --------------------------- |
| \_stateLeaf | struct DomainObjs.StateLeaf | the state leaf to be hashed |

#### Return Values

| Name       | Type    | Description                |
| ---------- | ------- | -------------------------- |
| ciphertext | uint256 | The hash of the state leaf |

### padAndHashMessage

```solidity
function padAndHashMessage(uint256[2] dataToPad, uint256 msgType) public pure returns (struct DomainObjs.Message message, struct DomainObjs.PubKey padKey, uint256 msgHash)
```

An utility function used to pad and hash a MACI message

#### Parameters

| Name      | Type       | Description             |
| --------- | ---------- | ----------------------- |
| dataToPad | uint256[2] | the data to be padded   |
| msgType   | uint256    | the type of the message |

#### Return Values

| Name    | Type                      | Description                                       |
| ------- | ------------------------- | ------------------------------------------------- |
| message | struct DomainObjs.Message | The padded message                                |
| padKey  | struct DomainObjs.PubKey  | The padding public key                            |
| msgHash | uint256                   | The hash of the padded message and encryption key |

### hashMessageAndEncPubKey

```solidity
function hashMessageAndEncPubKey(struct DomainObjs.Message _message, struct DomainObjs.PubKey _encPubKey) public pure returns (uint256 msgHash)
```

An utility function used to hash a MACI message and an encryption public key

#### Parameters

| Name        | Type                      | Description                            |
| ----------- | ------------------------- | -------------------------------------- |
| \_message   | struct DomainObjs.Message | the message to be hashed               |
| \_encPubKey | struct DomainObjs.PubKey  | the encryption public key to be hashed |

#### Return Values

| Name    | Type    | Description                                           |
| ------- | ------- | ----------------------------------------------------- |
| msgHash | uint256 | The hash of the message and the encryption public key |
