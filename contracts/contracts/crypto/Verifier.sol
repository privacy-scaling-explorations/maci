// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Pairing } from "./Pairing.sol";
import { SnarkConstants } from "./SnarkConstants.sol";
import { SnarkCommon } from "./SnarkCommon.sol";

/// @title IVerifier
/// @notice an interface for a Groth16 verifier contract
abstract contract IVerifier is SnarkCommon {
  /// @notice Verify a zk-SNARK proof
  function verify(uint256[8] memory, VerifyingKey memory, uint256) public view virtual returns (bool);
}

/// @title MockVerifier
/// @notice a MockVerifier to be used for testing
contract MockVerifier is IVerifier, SnarkConstants {
  /// @notice Verify a zk-SNARK proof (test only return always true)
  /// @param proof The proof
  /// @param vk The verifying key
  /// @param input The public inputs to the circuit
  /// @return result Whether the proof is valid given the verifying key and public
  function verify(
    uint256[8] memory proof,
    VerifyingKey memory vk,
    uint256 input
  ) public view override returns (bool result) {
    result = true;
  }
}

/// @title Verifier
/// @notice a Groth16 verifier contract
contract Verifier is IVerifier, SnarkConstants {
  struct Proof {
    Pairing.G1Point a;
    Pairing.G2Point b;
    Pairing.G1Point c;
  }

  using Pairing for *;

  uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
  string constant ERROR_PROOF_Q = "VE1";
  string constant ERROR_INPUT_VAL = "VE2";

  /// @notice Verify a zk-SNARK proof
  /// @param _proof The proof
  /// @param vk The verifying key
  /// @param input The public inputs to the circuit
  /// @return isValid Whether the proof is valid given the verifying key and public
  ///          input. Note that this function only supports one public input.
  ///          Refer to the Semaphore source code for a verifier that supports
  ///          multiple public inputs.
  function verify(
    uint256[8] memory _proof,
    VerifyingKey memory vk,
    uint256 input
  ) public view override returns (bool isValid) {
    Proof memory proof;
    proof.a = Pairing.G1Point(_proof[0], _proof[1]);
    proof.b = Pairing.G2Point([_proof[2], _proof[3]], [_proof[4], _proof[5]]);
    proof.c = Pairing.G1Point(_proof[6], _proof[7]);

    // Make sure that proof.A, B, and C are each less than the prime q
    require(proof.a.x < PRIME_Q, ERROR_PROOF_Q);
    require(proof.a.y < PRIME_Q, ERROR_PROOF_Q);

    require(proof.b.x[0] < PRIME_Q, ERROR_PROOF_Q);
    require(proof.b.y[0] < PRIME_Q, ERROR_PROOF_Q);

    require(proof.b.x[1] < PRIME_Q, ERROR_PROOF_Q);
    require(proof.b.y[1] < PRIME_Q, ERROR_PROOF_Q);

    require(proof.c.x < PRIME_Q, ERROR_PROOF_Q);
    require(proof.c.y < PRIME_Q, ERROR_PROOF_Q);

    // Make sure that the input is less than the snark scalar field
    require(input < SNARK_SCALAR_FIELD, ERROR_INPUT_VAL);

    // Compute the linear combination vk_x
    Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

    vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.ic[1], input));

    vk_x = Pairing.plus(vk_x, vk.ic[0]);

    isValid = Pairing.pairing(
      Pairing.negate(proof.a),
      proof.b,
      vk.alpha1,
      vk.beta2,
      vk_x,
      vk.gamma2,
      proof.c,
      vk.delta2
    );
  }
}
