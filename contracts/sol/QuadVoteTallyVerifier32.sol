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
        vk.alpha1 = Pairing.G1Point(uint256(9788127595119201866856617003695348381494833524466400639949073585957021339037),uint256(17932521094406734810716540317777009267479808128307339657586752246845966324546));
        vk.beta2 = Pairing.G2Point([uint256(21696649512957474520766095764799013940939016236949108680242351137594278285669),uint256(9016446391367028110234589585753924330264825516230321143634114592563371307117)], [uint256(7087399056167398372761076892757707007018670953459473525927429087917826945053),uint256(9659617587389110165682052807238376129317889332523805252341223621597875480794)]);
        vk.gamma2 = Pairing.G2Point([uint256(13962369966765040668829655136924014476219060175797181969275750747389840617448),uint256(19823961448325229305204277789628974240377979114016419863625529107132599746377)], [uint256(21003505158985748144125490558991246355533878946496416497168816402925446815665),uint256(14051298214898763705311654324232715279911394037278143384416856363195856079315)]);
        vk.delta2 = Pairing.G2Point([uint256(11530440852220161646149031563657779726613020784068593716469602804710970865016),uint256(14257554911323500151026989745783771294105663833290894907603970279224038797748)], [uint256(5383887732348773780113795775564370073998899934497202895231896126994803955425),uint256(11233493274723621382210142971760402149935803222743635486876071121294805940438)]);
        vk.IC[0] = Pairing.G1Point(uint256(10331630364560579918439924807409069040574467453347970997831619467700630786260),uint256(7352703907083746684727908159265924004558758803834300636605141089397401744276));
        vk.IC[1] = Pairing.G1Point(uint256(2383454224874693764660765415618474893054453576782110395746877001592325997813),uint256(1542959527417798518589026170675817148209513312208940161838188351540305261351));
        vk.IC[2] = Pairing.G1Point(uint256(18884898847905030735430424271903368807631300921120481538677323215944429955882),uint256(7994371495659448868909256534360335828331664970438054963950762473745447828579));
        vk.IC[3] = Pairing.G1Point(uint256(12191131903986550861667269414449440505467282925229091327826064446444042925410),uint256(10287091939791432810651612894102236781556081667714076895904551125587377961104));
        vk.IC[4] = Pairing.G1Point(uint256(20501120058293061653434025117099905624068740273769213189741054505135138713238),uint256(17165567928850585462269967533098885781515290109705663694639983179304840313303));
        vk.IC[5] = Pairing.G1Point(uint256(20751307669795641184935675550765974725507672821656889501312345885830120955045),uint256(11018164791073843718441881117561339638946066654006646219940842025563325157728));
        vk.IC[6] = Pairing.G1Point(uint256(18159318129566988733741597410767431681008828827772613186940913319367318549079),uint256(12396436918085027159836905968189917573204122166878503885239851905631641956072));
        vk.IC[7] = Pairing.G1Point(uint256(13060171889041434447360216444511148806054464772702115083624471143224891275324),uint256(10094424363784529626834006689496204497794067280043536139893786658250635934309));
        vk.IC[8] = Pairing.G1Point(uint256(6854173124674957005941305536675433520123924432035620687587028033143445025531),uint256(19506224151286244452202284185755930627153417086070884411467083228467399266356));
        vk.IC[9] = Pairing.G1Point(uint256(18168338073015895229874309533757429566747399006686550780596425981177180963553),uint256(21672263069691916535914406330276563680996218330501255716766232162984703727459));
        vk.IC[10] = Pairing.G1Point(uint256(12867344578516149856332575271023915354048241534592007123391907132955424635582),uint256(1166388922196880405559962045533802218202004023209252233378224410860556005741));

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
