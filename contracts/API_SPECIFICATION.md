# MACI API Specification

This API documentation describes the new additions to the MACI project for public key generation and deactivation. These changes include new console commands on the CLI side and new functions in Solidity smart contracts.

## Table of Contents

- [CLI Commands](#cli-commands)
  - [Deactivate Key](#deactivate-key)
  - [Generate New Key](#generate-new-key)
- [Smart Contract Functions](#smart-contract-functions)
  - [deactivateKey](#deactivatekey)
  - [confirmDeactivation](#confirmdeactivation)
  - [generateNewKey](#generatenewkey)

## CLI Commands

### Deactivate Key

The `deactivateKey` command is used to deactivate a user's public key.

#### Usage

```sh
node ./build/index.js deactivateKey --pubkey <publicKey> --contract <maciContractAddress>
```

#### Arguments

- `--pubkey`, `-p`: The public key to deactivate.
- `--contract`, `-x`: The address of the MACI contract.

### Generate New Key

The `generateNewKey` command is used to generate a new key based on the current one.

#### Usage

```sh
node ./build/index.js generateNewKey --proof <zkProof> --message <encryptedMessage>
```

#### Arguments

- `--proof`: The zero-knowledge proof required for the key generation process.
- `--message`: The encrypted message to submit during the key generation process.

## Smart Contract Functions

### deactivateKey

This function attempts to deactivate User's MACI public key. For deactivation to be confirmed, the Coordinator must call the `confirmKeyDeactivation` function.

```solidity
function deactivateKey(Message memory _message, bytes32 _messageHash, bytes memory _signature) external returns (uint256 leafIndex);
```

#### Parameters

- `_message`: The encrypted message which contains state leaf index.
- `_messageHash`: The keccak256 hash of the \_message to be used for signature verification.
- `_signature`: The ECDSA signature of User who attempts to deactivate MACI public key.

#### Return Values

- `leafIndex`: The index of the leaf in the deactivated keys tree.

### confirmDeactivation

This function confirms the deactivation of a User's MACI public key. It must be called by Coordinator after User calls the `deactivateKey` function.

```solidity
function confirmDeactivation(PubKey memory _usersPubKey, Message memory _elGamalEncryptedMessage) external;
```

#### Parameters

- `_usersPubKey`: The MACI public key to be deactivated.
- `_elGamalEncryptedMessage`: The El Gamal encrypted message.

### generateNewKey

This method generates a new key based on the current one after verifying the zero-knowledge proof.

```solidity
function generateNewKey(bytes memory _zkProof, Message memory _encryptedMessage) external;
```

#### Parameters

- `_zkProof`: The zero-knowledge proof required for the key generation process.
- `_encryptedMessage`: The encrypted message to submit during the key generation process.
