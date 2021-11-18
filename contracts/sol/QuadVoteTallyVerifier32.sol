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

contract QuadVoteTallyVerifier32 {

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
        vk.alpha1 = Pairing.G1Point(uint256(17011105005769813052099943611587644612110719447935994420281026491909880236876),uint256(5681183984661055311106029336923991071909536090510333470585999886198503967955));
        vk.beta2 = Pairing.G2Point([uint256(837555860150857225134050612032228192643441667518704592806312979038523684560),uint256(18007433254550606675080378178940410573873644960760056479830113934943557843821)], [uint256(9225066126113062216623345641077988459848763483921323504332354277764731488648),uint256(13887638588018668987709467907943307605037987243309140246031973099835545447583)]);
        vk.gamma2 = Pairing.G2Point([uint256(15825830424469441288521769952509481859751830904204509910664842096943753848495),uint256(10956265480212127926653068526729516790969206190135992567289654302602236069377)], [uint256(7578268135377412689480468313931103553942397450174061089639565140849060687446),uint256(10081243828902235910833795047713012789027882293365979711813888641598578918593)]);
        vk.delta2 = Pairing.G2Point([uint256(4928881115467438990126995197041778573679379149455812209637519991617500008453),uint256(14273314072574685568325101996617189267802701264235070712411110794986702215017)], [uint256(20669034709774162245736629441600090850389398379327048330000893515542320343484),uint256(2785273726495373907118444247405126771557275823641701325666338667954305842393)]);
        vk.IC[0] = Pairing.G1Point(uint256(1685806791920273528699583270011131341872866081684827990821538945167938479406),uint256(7871161236056767651846321692157004203438452489289427052606804509718257328575));
        vk.IC[1] = Pairing.G1Point(uint256(7701482213264631469691063460004144680728856055083558772815548849388924017548),uint256(6805183659964045850405813244649316673462532039521894746577869135463346188255));
        vk.IC[2] = Pairing.G1Point(uint256(3751838858127642039826485065419847214645165158774217855399891538007848866246),uint256(11314088934321085540741251991830441414116925733711285645053769031928258175483));
        vk.IC[3] = Pairing.G1Point(uint256(20548850379918668454573291459289600986890664022067431016912657832230483150388),uint256(10923797662920784664235767772256002422182075077107096859234023919441119747190));
        vk.IC[4] = Pairing.G1Point(uint256(6917532076294815137054961484942046759587469186586205694598778671838332356686),uint256(4436754069186687031352902840285194652549887071438624198988517470236377086902));
        vk.IC[5] = Pairing.G1Point(uint256(6621060472837001009888642964244530477253709830943970686653389197724255439323),uint256(1707944000149980294117764523640754394488823855803408161681856424063595541546));
        vk.IC[6] = Pairing.G1Point(uint256(17817310459531077603814771149289065727592252576864552147599504823844910117065),uint256(11434131849364421311105145788539172654867998548797729318354612842664028539559));
        vk.IC[7] = Pairing.G1Point(uint256(477766892840945803865099639984092350908693362020760703122626189201704022397),uint256(5397266291632988624167947326351956225927875592821110414365219990345073788364));
        vk.IC[8] = Pairing.G1Point(uint256(18410911830719066770143712720328501929934563362993089483689123105762884655729),uint256(20760342909400258201369159266665369862754426493886537943423558221600130546169));
        vk.IC[9] = Pairing.G1Point(uint256(13706814929948279464202328728177903536683231603536795733503221854396449820553),uint256(20362682513737686461469106812945973830948242876476917805735758349769072954645));
        vk.IC[10] = Pairing.G1Point(uint256(5712520097481180546938184804210403028255274429480902483674085337000746003846),uint256(716429118399563373668086228166264354383701009769057130810979905779513835799));

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
