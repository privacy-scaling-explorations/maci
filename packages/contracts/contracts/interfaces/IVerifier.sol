// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SnarkCommon } from "../crypto/SnarkCommon.sol";

/// @title IVerifier
/// @notice an interface for a Groth16 verifier contract
interface IVerifier {
  /// @notice Verify a zk-SNARK proof
  /// @param _proof The proof
  /// @param verifyingKey The verifying key
  /// @param inputs The public inputs to the circuit
  /// @return Whether the proof is valid given the verifying key and public
  ///          input. Note that this function only supports one public input.
  ///          Refer to the Semaphore source code for a verifier that supports
  ///          multiple public inputs.
  function verify(
    uint256[8] memory _proof,
    SnarkCommon.VerifyingKey memory verifyingKey,
    uint256[] memory inputs
  ) external view returns (bool);
}
