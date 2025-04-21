// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Pairing } from "./Pairing.sol";
import { SnarkConstants } from "./SnarkConstants.sol";
import { SnarkCommon } from "./SnarkCommon.sol";
import { IVerifier } from "../interfaces/IVerifier.sol";

/// @title Verifier
/// @notice a Groth16 verifier contract
contract Verifier is IVerifier, SnarkConstants, SnarkCommon {
  struct Proof {
    Pairing.G1Point a;
    Pairing.G2Point b;
    Pairing.G1Point c;
  }

  using Pairing for *;

  uint256 public constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

  /// @notice custom errors
  error InvalidProofQ();
  error InvalidInputVal();

  /// @notice Verify a zk-SNARK proof
  /// @param _proof The proof
  /// @param verifyingKey The verifying key
  /// @param inputs The public inputs to the circuit
  /// @return isValid Whether the proof is valid given the verifying key and public
  ///          input. Note that this function only supports one public input.
  ///          Refer to the Semaphore source code for a verifier that supports
  ///          multiple public inputs.
  function verify(
    uint256[8] memory _proof,
    VerifyingKey memory verifyingKey,
    uint256[] calldata inputs
  ) public view override returns (bool isValid) {
    Proof memory proof;
    proof.a = Pairing.G1Point(_proof[0], _proof[1]);
    proof.b = Pairing.G2Point([_proof[2], _proof[3]], [_proof[4], _proof[5]]);
    proof.c = Pairing.G1Point(_proof[6], _proof[7]);

    // Make sure that proof.A, B, and C are each less than the prime q
    checkPoint(proof.a.x);
    checkPoint(proof.a.y);
    checkPoint(proof.b.x[0]);
    checkPoint(proof.b.y[0]);
    checkPoint(proof.b.x[1]);
    checkPoint(proof.b.y[1]);
    checkPoint(proof.c.x);
    checkPoint(proof.c.y);

    // Compute the linear combination verifying key X
    Pairing.G1Point memory x = Pairing.G1Point(0, 0);

    uint256 inputsLength = inputs.length;

    for (uint256 i = 0; i < inputsLength; ) {
      uint256 input = inputs[i];

      // Make sure that the input is less than the snark scalar field
      if (input >= SNARK_SCALAR_FIELD) {
        revert InvalidInputVal();
      }

      x = Pairing.plus(x, Pairing.scalarMul(verifyingKey.ic[i + 1], input));

      unchecked {
        i++;
      }
    }

    x = Pairing.plus(x, verifyingKey.ic[0]);

    isValid = Pairing.pairing(
      Pairing.negate(proof.a),
      proof.b,
      verifyingKey.alpha1,
      verifyingKey.beta2,
      x,
      verifyingKey.gamma2,
      proof.c,
      verifyingKey.delta2
    );
  }

  function checkPoint(uint256 point) internal pure {
    if (point >= PRIME_Q) {
      revert InvalidProofQ();
    }
  }
}
