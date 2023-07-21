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
    - [deactivateKey (Poll smart contract)](#deactivatekey-poll-smart-contract)
      - [Parameters](#parameters)
      - [Response](#response-4)
    - [confirmDeactivation (MessageProcessor smart contract)](#confirmdeactivation-messageprocessor-smart-contract)
      - [Parameters](#parameters-1)
      - [Response](#response-5)
    - [mergeForDeactivation (MessageProcessor smart contract)](#mergefordeactivation-messageprocessor-smart-contract)
      - [Parameters](#parameters-2)
      - [Response](#response-6)
    - [completeDeactivation (MessageProcessor smart contract)](#completedeactivation-messageprocessor-smart-contract)
      - [Parameters](#parameters-3)
      - [Response](#response-7)
    - [generateNewKeyFromDeactivated (Poll smart contract)](#generatenewkeyfromdeactivated-poll-smart-contract)
      - [Parameters](#parameters-4)
      - [Response](#response-8)

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
node ./build/index.js generateNewKey --new-pub-key <newMaciPublicKey> --new-priv-key <newMaciPrivateKey> --old-pub-key <oldMaciPublicKey> --old-priv-key <oldMaciPrivateKey> --coord-priv-key <coordinatorPrivateKey> --state-index <stateIndex> --salt <salt> --poll-id <pollId> --from-block <fromBlock> --new-key-generation-witnessgen <pathToWitnessGenLib> --new-key-generation-zkey <pathToZkeyFile> --rapidsnark <pathToRapidSnarkLib>
```

#### Arguments

- `--new-pub-key`, `-n`: User's new MACI public key.
- `--new-priv-key`, `-npk`: Users's new serialized MACI private key.
- `--old-pub-key`, `-o`: User's old MACI public key.
- `--old-priv-key`, `-opk`: Users's old serialized MACI private key.
- `--coord-priv-key`, `-cpk`: Coordinator's serialized MACI private key.
- `--state-index`, `-i`: User's state index.
- `--salt`, `-s`: Message salt.
- `--poll-id`, `-o`: ID of the Poll.
- `--from-block`, `-fb`: The block number to start listening from.
- `--new-key-generation-witnessgen`, `-wpd`: The path to the NewKeyGenerationMessage witness generation binary.
- `--new-key-generation-zkey`, `-zpd`: The path to the NewKeyGenerationMessage .zkey file.
- `--rapidsnark`, `-r`: The path to the rapidsnark binary.

#### Response

<!-- TODO: Edit this once generateNewKey command logic is finished -->
If the operation is successful, it does not produce any visible output. Returns an exit status of 0.
If there is an error, the console warns the user. Returns an exit status of 1.

## Smart Contract Functions

### deactivateKey (Poll smart contract)

This function attempts to deactivate the user's MACI public key. For deactivation to be confirmed, the coordinator must call the `confirmKeyDeactivation` function.

```solidity
function deactivateKey(Message memory _message, PubKey memory _encPubKey) external;
```

#### Parameters

- `_message`: The encrypted message which contains a state leaf index.
- `_encPubKey`: An epheremal public key which can be combined with the coordinator's private key to generate an ECDH shared key with which to encrypt the message.

#### Response

Events emitted:

- `PublishMessage`
- `AttemptKeyDeactivation`

### confirmDeactivation (MessageProcessor smart contract)

Confirms the deactivation of the user's MACI public key. It must be called by the coordinator after the user calls the `deactivateKey` function.

```solidity
function confirmDeactivation(uint256[][] memory _batchLeaves, uint256 _batchSize, Poll poll) external onlyOwner;
```

#### Parameters

- `_batchLeaves`: Deactivated keys leaves.
- `_batchSize`: The capacity of the subroot of the deactivated keys tree.
- `poll`: Poll smart contract address.

#### Response

Events emitted:

- `DeactivateKey`

### mergeForDeactivation (MessageProcessor smart contract)

Merges the state tree and the deactivated keys tree. It is a prerequisite for `completeDeactivation` function.

```solidity
function mergeForDeactivation(uint256 _stateNumSrQueueOps, Poll poll, uint256 _pollId) external onlyOwner;
```

#### Parameters

- `_stateNumSrQueueOps`: The number of subroot queue operations to merge for the MACI state tree.
- `poll`: Poll smart contract address.
- `_pollId`: Id of the poll.

#### Response

None.

### completeDeactivation (MessageProcessor smart contract)

Completes deactivation of all MACI public keys.

```solidity
function completeDeactivation(uint256[8] memory _proof, Poll poll) external onlyOwner;
```

#### Parameters

- `_proof`: ZK proof of correct processing of deactivation messages.
- `poll`: Poll smart contract address.

#### Response

None.

### generateNewKeyFromDeactivated (Poll smart contract)

Attempts to generate new key from the deactivated one.

```solidity
function generateNewKeyFromDeactivated(Message memory _message, PubKey memory _encPubKey) external returns (uint256);
```

#### Parameters

- `_message`: Encrypted message containing the state leaf index.
- `_encPubKey`: Epheremal public key which can be combined with the coordinator's private key to generate an ECDH shared key with which to encrypt the message.

#### Response

Events emitted:

- `AttemptKeyGeneration`

Returns:

- `uint256` `newStateIndex`.
