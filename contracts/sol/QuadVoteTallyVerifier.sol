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

contract QuadVoteTallyVerifier {

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
        vk.alpha1 = Pairing.G1Point(uint256(1924804965003376829878087074801349498228922839872387414991456987688569634529),uint256(1265450779131041927810382307260976207148090125395623512647583833804979573764));
        vk.beta2 = Pairing.G2Point([uint256(2138860067795712076281064417016110578832879209363207425568393586480865167997),uint256(4973658900863515458163592175803763036018558610848496351260342206570248719637)], [uint256(19196463947146170193495623377385098484933588234333164583114477250457564595485),uint256(5641082428450614942113049788501324199962740124601995463996411853409828881919)]);
        vk.gamma2 = Pairing.G2Point([uint256(6119246737829027045870094355669868798807911318298398700386944188833777162971),uint256(9011017175512163721678517159526888946643594162673319011972739224500948124835)], [uint256(5604119888518526993308171265295301657629999893608201627692430490021991544227),uint256(16249440461124992409299953585157082940993464895794750667082418802389760880695)]);
        vk.delta2 = Pairing.G2Point([uint256(7610774737369239922569881995563508563475945207391261679647702840852361270057),uint256(2645231298662635890167853949037109525260047645473621283656477225919966591337)], [uint256(14840838137612121029843740131054358484453206010820083025451783042460472099220),uint256(500281542409228559829503587117638143522921736537275733848760382658584657329)]);
        vk.IC[0] = Pairing.G1Point(uint256(14634664189421309967515874789213488241667308304212859943732866621129383961866),uint256(9092800294410472100035806853832154676981009199146321833295181429024977802452));
        vk.IC[1] = Pairing.G1Point(uint256(10995296539752893720953336813934584699164929606927920688402453827801985852655),uint256(14038018035269561738868517593578839353832081742635861818595834885869885413719));
        vk.IC[2] = Pairing.G1Point(uint256(19086025536440746284851241785708979375753906632579415813518780301060841681354),uint256(20070128789547157948673748609595359924351642870192238965567583417994035175251));
        vk.IC[3] = Pairing.G1Point(uint256(2139171160351940203573654976660531931282133727008278550810865674307998557980),uint256(9293421351990942402515383151282631080561719216399003019985322128735941598823));
        vk.IC[4] = Pairing.G1Point(uint256(17480031667276576711197771885957091470523348273649209537627758137382756907396),uint256(1032277269967216675150878464710979919708338868474848746599057633786051661511));
        vk.IC[5] = Pairing.G1Point(uint256(6203369188048291232479858727801852876489979437324510729476946467311342770415),uint256(5438804718546662708705923814775337639761104458759582523649288711005116695106));
        vk.IC[6] = Pairing.G1Point(uint256(13304640316958915829855269947324717055934449835058162139977630103821896336672),uint256(12637038912899040805376935394746972717869412602540687668437783290408859856041));
        vk.IC[7] = Pairing.G1Point(uint256(964119226703616312456937200186375000055444394914334273123386117224874058161),uint256(7627964404124396071085874858301402657906320961441120292705794094428426208821));
        vk.IC[8] = Pairing.G1Point(uint256(17096140901655992036976637831443802411534813398301186499000627930142862327408),uint256(4387998976035339391169141240933308060489840969238899051685453019156728532995));
        vk.IC[9] = Pairing.G1Point(uint256(6212904796946988191389603238087439679112762514547855201857402973410194550108),uint256(21397292934520514595322994361293814540568893437660583261541557841815513041054));
        vk.IC[10] = Pairing.G1Point(uint256(6215893961570631184567428580280140391155118948451420835382971782967762602992),uint256(3369914404543809349783459070434919978075203606675403503456376537456290322899));

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
