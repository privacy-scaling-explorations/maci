// SPDX-License-Identifier: MIT

// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// 2019 OKIMS

pragma solidity ^0.6.12;

library Pairing {

    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero. 
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {

        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return The sum of two points of G1
     */
    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {

        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-add-failed");
    }

    /*
     * @return The product of a point on G1 and a scalar, i.e.
     *         p == p.scalar_mul(1) and p.plus(p) == p.scalar_mul(2) for all
     *         points p.
     */
    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {

        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {

        G1Point[4] memory p1 = [a1, b1, c1, d1];
        G2Point[4] memory p2 = [a2, b2, c2, d2];

        uint256 inputSize = 24;
        uint256[] memory input = new uint256[](inputSize);

        for (uint256 i = 0; i < 4; i++) {
            uint256 j = i * 6;
            input[j + 0] = p1[i].X;
            input[j + 1] = p1[i].Y;
            input[j + 2] = p2[i].X[0];
            input[j + 3] = p2[i].X[1];
            input[j + 4] = p2[i].Y[0];
            input[j + 5] = p2[i].Y[1];
        }

        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract QuadVoteTallyVerifierMedium {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[11] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(18066990787621416029904763095322621402654456061047543539122384920198052026492),uint256(5501317602754258824990916248626818177751249799104391264861125113763981008528));
        vk.beta2 = Pairing.G2Point([uint256(10238884784820107612983715473541906233101916983634380466277851176111558904264),uint256(21546053901660309341340494675767867930443663754262933714202865868175458162374)], [uint256(4026477135769356150440172515184754261262801464424554251116136012834719101701),uint256(1474597602296675452454095217971259295407780882277270639972454751132437704075)]);
        vk.gamma2 = Pairing.G2Point([uint256(6591911684823206956557543252822322177038610675783177381134696656700085463570),uint256(16901024169521626986872289137316549539066859468024596217503823776844978132468)], [uint256(10055326941715498228711980612181806219095143558836644372122856195555148430296),uint256(15556656685999140096832707614353799776813086867497378393676972201706377337556)]);
        vk.delta2 = Pairing.G2Point([uint256(2253396631478048456279156724339243653963407025465940520540568218672522576183),uint256(8828265788431508138059257306277117300083444304447522405871015557238683553374)], [uint256(11555618576291144353806994083339692693052990865732142037305837570147639373507),uint256(15893085521453091449865509200271360736348292485147966863086612380315300824123)]);
        vk.IC[0] = Pairing.G1Point(uint256(10465189963125800717040888867498476376953944043136708988432471512303223865365),uint256(2079320979677286997264788899996205268459637881769655594446732773012141751535));
        vk.IC[1] = Pairing.G1Point(uint256(6092955963826311849031200274771499073074077861984367329037497392982579084042),uint256(7117586162369094465464698626525921778790156900902262168014532616002310761429));
        vk.IC[2] = Pairing.G1Point(uint256(19627880715217663275350169407614547328598294080160728002781965018820149404408),uint256(5675484394142355884019955983211193088404626197492111345750607252833103585500));
        vk.IC[3] = Pairing.G1Point(uint256(2816343464536186292080853903181292366824160892728128299391906976734315736499),uint256(19460228616132578493269050276583599101542937508891689791363605879833395410551));
        vk.IC[4] = Pairing.G1Point(uint256(11705677111139599888884706622071251437004076514372505414502610987483310619464),uint256(4048202983346610414537315964871688695805117347822607313210850357692346585223));
        vk.IC[5] = Pairing.G1Point(uint256(21227727495951532605804627690184696015791055018877125973110994424484771195465),uint256(1217486394995155064694944817570850673451391774671699837357550154771496839756));
        vk.IC[6] = Pairing.G1Point(uint256(10864490907918534394746597141124268308590799472732437792869958428161878920561),uint256(4321151300681022238467169357352572437981993021193897114346638657588412640715));
        vk.IC[7] = Pairing.G1Point(uint256(472997416673933937050103222298758908328280217419395649485601219684156310643),uint256(20797669346736163833965102951826166049693826835949194169855970034551463089394));
        vk.IC[8] = Pairing.G1Point(uint256(21275100066504156692052592698835208165863656190844451367520663584346529298786),uint256(12677761593984027034459967326277195592583619872789765379729224894157424820650));
        vk.IC[9] = Pairing.G1Point(uint256(18732567283199813714023556606031039902744266636245514600412860613022156910888),uint256(8813738782099985772801416413209207430698988295988943219998627858512387931347));
        vk.IC[10] = Pairing.G1Point(uint256(20852151717104819177711763806464686646953118669207778694550712106915591204040),uint256(908139107410140140611206421738645921435985501859510496483663790039273258303));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public view returns (bool) {

        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        VerifyingKey memory vk = verifyingKey();

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.A.X < PRIME_Q, "verifier-aX-gte-prime-q");
        require(proof.A.Y < PRIME_Q, "verifier-aY-gte-prime-q");

        require(proof.B.X[0] < PRIME_Q, "verifier-bX0-gte-prime-q");
        require(proof.B.Y[0] < PRIME_Q, "verifier-bY0-gte-prime-q");

        require(proof.B.X[1] < PRIME_Q, "verifier-bX1-gte-prime-q");
        require(proof.B.Y[1] < PRIME_Q, "verifier-bY1-gte-prime-q");

        require(proof.C.X < PRIME_Q, "verifier-cX-gte-prime-q");
        require(proof.C.Y < PRIME_Q, "verifier-cY-gte-prime-q");

        // Make sure that every input is less than the snark scalar field
        //for (uint256 i = 0; i < input.length; i++) {
        for (uint256 i = 0; i < 10; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        return Pairing.pairing(
            Pairing.negate(proof.A),
            proof.B,
            vk.alpha1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
