// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IEAS } from "../interfaces/IEAS.sol";

/// @title MockEAS
/// @notice A mock contract to test the EASGatekeeper
contract MockEAS is IEAS {
  address public immutable attester;
  bytes32 public immutable schema;
  address public immutable recipient;

  /// @param _attester The address of the attester
  /// @param _schema The schema of the attestation
  /// @param _recipient The recipient of the attestation
  constructor(address _attester, bytes32 _schema, address _recipient) {
    attester = _attester;
    schema = _schema;
    recipient = _recipient;
  }

  /// @inheritdoc IEAS
  function getAttestation(bytes32 attestationId) external view override returns (Attestation memory) {
    // revoked
    if (attestationId == 0x0000000000000000000000000000000000000000000000000000000000000001) {
      return
        Attestation({
          uid: "0x000000000000000000000000000001",
          schema: schema,
          time: 0,
          expirationTime: 0,
          revocationTime: 1,
          refUID: "0x000000000000000000000000000001",
          recipient: recipient,
          attester: attester,
          revocable: true,
          data: ""
        });
      // invalid schema
    } else if (attestationId == 0x0000000000000000000000000000000000000000000000000000000000000002) {
      return
        Attestation({
          uid: "0x000000000000000000000000000001",
          schema: "0x000000000000000000000000000001",
          time: 0,
          expirationTime: 0,
          revocationTime: 0,
          refUID: "0x000000000000000000000000000001",
          recipient: recipient,
          attester: attester,
          revocable: false,
          data: ""
        });
      // invalid recipient
    } else if (attestationId == 0x0000000000000000000000000000000000000000000000000000000000000003) {
      return
        Attestation({
          uid: "0x000000000000000000000000000001",
          schema: schema,
          time: 0,
          expirationTime: 0,
          revocationTime: 0,
          refUID: "0x000000000000000000000000000001",
          recipient: address(0),
          attester: attester,
          revocable: false,
          data: ""
        });
      // invalid attester
    } else if (attestationId == 0x0000000000000000000000000000000000000000000000000000000000000004) {
      return
        Attestation({
          uid: "0x000000000000000000000000000001",
          schema: schema,
          time: 0,
          expirationTime: 0,
          revocationTime: 0,
          refUID: "0x000000000000000000000000000001",
          recipient: recipient,
          attester: address(0),
          revocable: false,
          data: ""
        });
      // valid
    } else {
      return
        Attestation({
          uid: "0x000000000000000000000000000001",
          schema: schema,
          time: 0,
          expirationTime: 0,
          revocationTime: 0,
          refUID: "0x000000000000000000000000000001",
          recipient: recipient,
          attester: attester,
          revocable: false,
          data: ""
        });
    }
  }
}
