// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import { Pairing } from "./Pairing.sol";
import { SnarkConstants } from "./SnarkConstants.sol";
import { SnarkCommon } from "./SnarkCommon.sol";

contract Verifier is SnarkConstants, SnarkCommon {

    using Pairing for *;

    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    /*
     * @returns Whether the proof is valid given the verifying key and public
     *          inputs
     */
    function verify(
        Proof memory proof,
        VerifyingKey memory vk,
        uint256[] memory input
    ) public view returns (bool) {
        //Proof memory proof;
        //proof.a = Pairing.G1Point(a[0], a[1]);
        //proof.b = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        //proof.c = Pairing.G1Point(c[0], c[1]);

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.a.x < PRIME_Q, "verifier-aX-gte-prime-q");
        require(proof.a.y < PRIME_Q, "verifier-aY-gte-prime-q");

        require(proof.b.x[0] < PRIME_Q, "verifier-bX0-gte-prime-q");
        require(proof.b.y[0] < PRIME_Q, "verifier-bY0-gte-prime-q");

        require(proof.b.x[1] < PRIME_Q, "verifier-bX1-gte-prime-q");
        require(proof.b.y[1] < PRIME_Q, "verifier-bY1-gte-prime-q");

        require(proof.c.x < PRIME_Q, "verifier-cX-gte-prime-q");
        require(proof.c.y < PRIME_Q, "verifier-cY-gte-prime-q");

        // Make sure that every input is less than the snark scalar field
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.ic[i + 1], input[i]));
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

