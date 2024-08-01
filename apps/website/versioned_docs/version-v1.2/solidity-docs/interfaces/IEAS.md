# IEAS

An interface to the EAS contract.

### Attestation

```solidity
struct Attestation {
  bytes32 uid;
  bytes32 schema;
  uint64 time;
  uint64 expirationTime;
  uint64 revocationTime;
  bytes32 refUID;
  address recipient;
  address attester;
  bool revocable;
  bytes data;
}
```

### getAttestation

```solidity
function getAttestation(bytes32 uid) external view returns (struct IEAS.Attestation)
```

Get an attestation by its unique identifier.

#### Parameters

| Name | Type    | Description                               |
| ---- | ------- | ----------------------------------------- |
| uid  | bytes32 | The unique identifier of the attestation. |

#### Return Values

| Name | Type                    | Description                  |
| ---- | ----------------------- | ---------------------------- |
| [0]  | struct IEAS.Attestation | attestation The attestation. |
