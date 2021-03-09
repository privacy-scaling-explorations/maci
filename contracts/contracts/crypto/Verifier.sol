// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import { Pairing } from "./Pairing.sol";
import { SnarkConstants } from "./SnarkConstants.sol";
import { SnarkCommon } from "./SnarkCommon.sol";

abstract contract IVerifier is SnarkCommon {
    function verify(
        uint256[8] memory,
        VerifyingKey memory,
        uint256[] memory
    ) virtual public view returns (bool);
}

contract MockVerifier is IVerifier, SnarkConstants {
    bool result = true;
    function verify(
        uint256[8] memory,
        VerifyingKey memory,
        uint256[] memory
    ) override public view returns (bool) {
        return result;
    }
}

contract Verifier is IVerifier, SnarkConstants {
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }

    using Pairing for *;

    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    string constant ERROR_PROOF_Q = "VerifierE01";
    string constant ERROR_INPUT_VAL = "VerifierE02";

    /*
     * @returns Whether the proof is valid given the verifying key and public
     *          inputs
     */
    function verify(
        uint256[8] memory _proof,
        VerifyingKey memory vk,
        uint256[] memory input
    ) override public view returns (bool) {
        Proof memory proof;
        proof.a = Pairing.G1Point(_proof[0], _proof[1]);
        proof.b = Pairing.G2Point(
            [_proof[2], _proof[3]],
            [_proof[4], _proof[5]]
        );
        proof.c = Pairing.G1Point(_proof[6], _proof[7]);

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.a.x < PRIME_Q, "ERROR_PROOF_Q");
        require(proof.a.y < PRIME_Q, "ERROR_PROOF_Q");

        require(proof.b.x[0] < PRIME_Q, "ERROR_PROOF_Q");
        require(proof.b.y[0] < PRIME_Q, "ERROR_PROOF_Q");

        require(proof.b.x[1] < PRIME_Q, "ERROR_PROOF_Q");
        require(proof.b.y[1] < PRIME_Q, "ERROR_PROOF_Q");

        require(proof.c.x < PRIME_Q, "ERROR_PROOF_Q");
        require(proof.c.y < PRIME_Q, "ERROR_PROOF_Q");

        for (uint256 i = 0; i < input.length; i++) {
            // Make sure that each input is less than the snark scalar field
            require(input[i] < SNARK_SCALAR_FIELD, "ERROR_INPUT_VAL");

            vk_x = Pairing.plus(
                vk_x,
                Pairing.scalar_mul(vk.ic[i + 1], input[i])
            );
        }

        vk_x = Pairing.plus(vk_x, vk.ic[0]);

        return Pairing.pairing(
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

