# ElGamal MACI API Specification

This API documentation describes the new additions to the MACI project for public key generation and deactivation. These changes include new console commands on the CLI side and new functions in Solidity smart contracts.

## Table of Contents

- [ElGamal MACI API Specification](#elgamal-maci-api-specification)
  - [Table of Contents](#table-of-contents)
  - [CLI Commands](#cli-commands)
    - [Deactivate Key](#deactivate-key)
      - [Usage](#usage)
      - [Arguments](#arguments)
      - [Response](#response)
    - [Confirm Deactivation](#confirm-deactivation)
      - [Usage](#usage-1)
      - [Arguments](#arguments-1)
      - [Response](#response-1)
    - [Complete Deactivation](#complete-deactivation)
      - [Usage](#usage-2)
      - [Arguments](#arguments-2)
      - [Response](#response-2)
    - [Generate New Key](#generate-new-key)
      - [Usage](#usage-3)
      - [Arguments](#arguments-3)
      - [Response](#response-3)
  - [Smart Contract Functions](#smart-contract-functions)
    - [deactivateKey](#deactivatekey)
      - [Parameters](#parameters)
    - [confirmDeactivation](#confirmdeactivation)
      - [Parameters](#parameters-1)
      - [Return Values](#return-values)
    - [generateNewKey](#generatenewkey)
      - [Parameters](#parameters-2)

<!-- SC function list
  - deactivateKey
  - confirmDeactivation
  - mergeForDeactivation (not sure if needed)
  - completeDeactivation (MP contract)
  - getProcessDeactivationVkBySig (not sure if needed)
  - generateNewKey (for now document just parameters)
  - -->

<!-- TODO: Clean up parameters in CLI/SC commands - required, non-required, never used, etc. - they should be consistent with command usage -->
## CLI Commands

### Deactivate Key

The `deactivateKey` command is the first step in deactivation of a user's public key. It is initiated by the user.

#### Usage

```sh
node ./build/index.js deactivateKey --privkey <maciPrivateKey> --state-index <userStateIndex> --nonce <nonce> --salt <salt> --poll-id <pollId>
```

#### Arguments

- `--privkey`, `-sk`: User's serialized MACI private key.
- `--state-index`, `-i`: User's state index.
- `--nonce`, `-n`: Message nonce.
- `--salt`, `-s`: Message salt.
- `--poll-id`, `-o`: ID of the Poll.

#### Response

If the operation is successful, the console logs transaction hash and ephemeral private key. Returns an exit status of 0.
<!-- TODO: Check if exit statuses in deactivateKey command (and other commands) need to be fixed; e.g. line 157 in deactivateKey -->
If there is an error, the console warns the user. Returns an exit status of 1.

### Confirm Deactivation

The `confirmDeactivation` command processes user's deactivation messages. It is initiated by the coordinator.

#### Usage

```sh
node ./build/index.js confirmDeactivation --poll-id <pollId> --privkey <maciPrivateKey> --from-block <fromBlock> --batch-size <batchSize>
```

#### Arguments

- `--poll-id`, `-pi`: ID of the Poll.
- `--privkey`, `-sk`: Coordinator's serialized MACI private key.
- `--from-block`, `-fb`: The block number to start listening from.
- `--batch-size`, `-bs`: The capacity of the subroot of the deactivated keys tree to be merged. Default: 1.

#### Response

If the operation is successful, it does not produce any visible output. Returns an exit status of 0.
If there is an error, the console warns the user. Returns an exit status of 1.

### Complete Deactivation

The `completeDeactivation` command generates and submits proof of processing user's deactivation messages. It is initiated by the coordinator.

#### Usage

```sh
node ./build/index.js completeDeactivation --poll-id <pollId> --privkey <maciPrivateKey> --state-num-sr-queue-ops <stNumSrQueueOps> --deactivated-keys-num-sr-queue-ops <deactKeyNumSrQueueOps> --from-block <fromBlock> --process-deactivation-witnessgen <pathToWitnessGenLib> --process-deactivation-zkey <pathToZkeyFile> --rapidsnark <pathToRapidSnarkLib>
```

#### Arguments

- `--poll-id`, `-pi`: ID of the Poll.
- `--privkey`, `-sk`: Coordinator's serialized MACI private key.
- `--state-num-sr-queue-ops`, `-snsq`: The number of subroot queue operations to merge for the MACI state tree.
- `--deactivated-keys-num-sr-queue-ops`, `-dnsq`: The number of subroot queue operations to merge for the deactivated keys tree.
- `--from-block`, `-fb`: The block number to start listening from.
- `--process-deactivation-witnessgen`, `-wpd`: The path to the ProcessDeactivationMessages witness generation binary.
- `--process-deactivation-zkey`, `-zpd`: The path to the ProcessDeactivationMessages .zkey file.
- `--rapidsnark`, `-r`: The path to the rapidsnark binary.

#### Response

If the operation is successful, it does not produce any visible output. Returns an exit status of 0.
If there is an error, the console warns the user. Returns an exit status of 1.

### Generate New Key

The `generateNewKey` command is used to generate a new key based on the previously-deactivated one. It is initiated by the user.

#### Usage

```sh
node ./build/index.js generateNewKey --oldPrivkey <oldMaciPrivateKey> --newPrivkey <newMaciPrivateKey> --state-index <stateIndex> --salt <salt> --poll-id <pollId> --from-block <fromBlock> --new-key-generation-witnessgen <pathToWitnessGenLib> --new-key-generation-zkey <pathToZkeyFile> --rapidsnark <pathToRapidSnarkLib>
```

#### Arguments

- `--oldPrivkey`, `-opk`: Users's old serialized MACI private key.
- `--newPrivkey`, `-npk`: Users's new serialized MACI private key.
- `--state-index`, `-i`: User's state index.
- `--salt`, `-s`: Message salt.
- `--poll-id`, `-o`: ID of the Poll.
- `--from-block`, `-fb`: The block number to start listening from.
- `--new-key-generation-witnessgen`, `-wpd`: The path to the NewKeyGenerationMessage witness generation binary.
- `--process-deactivation-zkey`, `-zpd`: The path to the NewKeyGenerationMessage .zkey file.
- `--rapidsnark`, `-r`: The path to the rapidsnark binary.

#### Response

<!-- TODO: Edit this once generateNewKey command logic is finished -->
If the operation is successful, it does not produce any visible output. Returns an exit status of 0.
If there is an error, the console warns the user. Returns an exit status of 1.

## Smart Contract Functions

### deactivateKey

This function attempts to deactivate the User's MACI public key. For deactivation to be confirmed, the Coordinator must call the `confirmKeyDeactivation` function.

```solidity
function deactivateKey(Message memory _message, bytes32 _messageHash, bytes memory _signature) external;
```

#### Parameters

- `_message`: The encrypted message which contains a state leaf index.
- `_messageHash`: The keccak256 hash of the \_message to be used for signature verification.
- `_signature`: The ECDSA signature of User who attempts to deactivate the MACI public key.

### confirmDeactivation

This function confirms the deactivation of a User's MACI public key. It must be called by the Coordinator after the User calls the `deactivateKey` function.

```solidity
function confirmDeactivation(PubKey memory _usersPubKey, Message memory _elGamalEncryptedMessage) external returns(uint256 leafIndex);
```

#### Parameters

- `_usersPubKey`: The MACI public key to be deactivated.
- `_elGamalEncryptedMessage`: The El Gamal encrypted message.

#### Return Values

- `leafIndex`: The index of the leaf in the deactivated keys tree.

### generateNewKey

This method generates a new key based on the current one after verifying the zero-knowledge proof.

```solidity
function generateNewKey(bytes memory _zkProof, Message memory _encryptedMessage) external;
```

#### Parameters

- `_zkProof`: The zero-knowledge proof required for the key generation process.
- `_encryptedMessage`: The encrypted message to submit during the key generation process.
