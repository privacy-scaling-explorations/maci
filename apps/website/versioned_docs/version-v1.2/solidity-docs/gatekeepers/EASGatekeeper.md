# EASGatekeeper

A gatekeeper contract which allows users to sign up to MACI
only if they've received an attestation of a specific schema from a trusted attester

### schema

```solidity
bytes32 schema
```

### attester

```solidity
address attester
```

### maci

```solidity
address maci
```

the reference to the MACI contract

### registeredAttestations

```solidity
mapping(bytes32 => bool) registeredAttestations
```

### AttestationRevoked

```solidity
error AttestationRevoked()
```

custom errors

### AlreadyRegistered

```solidity
error AlreadyRegistered()
```

### AttesterNotTrusted

```solidity
error AttesterNotTrusted()
```

### NotYourAttestation

```solidity
error NotYourAttestation()
```

### InvalidSchema

```solidity
error InvalidSchema()
```

### OnlyMACI

```solidity
error OnlyMACI()
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### constructor

```solidity
constructor(address _eas, address _attester, bytes32 _schema) public payable
```

Deploy an instance of EASGatekeeper

#### Parameters

| Name       | Type    | Description          |
| ---------- | ------- | -------------------- |
| \_eas      | address | The EAS contract     |
| \_attester | address | The trusted attester |
| \_schema   | bytes32 | The schema UID       |

### setMaciInstance

```solidity
function setMaciInstance(address _maci) public
```

Adds an uninitialised MACI instance to allow for token signups

#### Parameters

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| \_maci | address | The MACI contract interface to be stored |

### register

```solidity
function register(address _user, bytes _data) public
```

Register an user based on their attestation

_Throw if the attestation is not valid or just complete silently_

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| \_user | address | The user's Ethereum address.           |
| \_data | bytes   | The ABI-encoded schemaId as a uint256. |
