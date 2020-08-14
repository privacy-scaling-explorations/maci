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

pragma solidity ^0.5.0;

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
            success := staticcall(sub(gas, 2000), 6, input, 0xc0, r, 0x60)
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
            success := staticcall(sub(gas, 2000), 7, input, 0x80, r, 0x60)
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
            success := staticcall(sub(gas, 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
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
        Pairing.G1Point alfa1;
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
        vk.alfa1 = Pairing.G1Point(uint256(6867546767802364698168930461171340046469847872113570945398778058851910826739), uint256(11915785745090382608775767202235078732138177148159113322196871499233863769069));
        vk.beta2 = Pairing.G2Point([uint256(12559818780634581856439941297002599181832050289421136473031487237103775054183), uint256(10325560498609504442318210056523076234538700420679674735572799497132275583070)], [uint256(13863625119747779026238481221368821788766290019398061577150222762835254108489), uint256(9211051081060369317368155747280812950563356604749714974375706474840725462672)]);
        vk.gamma2 = Pairing.G2Point([uint256(13172852363318795788644211638830756224188176583146464286060448832269022846743), uint256(6989026616708940415899384770534217838259992899760286382490279665922634170888)], [uint256(7824195721970866347035943260833678633556585000551339269627684017107381840017), uint256(1332175949127316043748777916918484187703843304781009859791666678478234797328)]);
        vk.delta2 = Pairing.G2Point([uint256(14979113175416868361048477789037467908555588002935465829752935105202440737936), uint256(4167133022296014215410205477268021745499180358027357747188396507943858094981)], [uint256(14568200400820320717041104528579524267561630804212581612029104534596806506806), uint256(6299564427352172684536672234489134306254675975873169958331297001012448274814)]);
        vk.IC[0] = Pairing.G1Point(uint256(11513175627194017738209594414953854023996777039647519497423103863067897121319), uint256(16727089350076900966411923521839441262151785178368370110585547233412112055900));
        vk.IC[1] = Pairing.G1Point(uint256(11491006980526157084438869852749619940850526618818635268221060425400102727289), uint256(21123313039764863637072763978245763632711083710429887291534834499609932848683));
        vk.IC[2] = Pairing.G1Point(uint256(2442386020306566908809276453583776028576345955390116075009242079670332386314), uint256(11218598202566514234962122997963317341535729720042579107395117924847866766860));
        vk.IC[3] = Pairing.G1Point(uint256(8026137155161422121709325083822242820879012500876905902334499879901644396521), uint256(1428219805379961324149104629656856255850715661373513740406702522425910769039));
        vk.IC[4] = Pairing.G1Point(uint256(7299589531345689543193377012664811130793948802300147665306213526290563094840), uint256(21562405351591129719344422581277644697629124936554850040513930046504782376593));
        vk.IC[5] = Pairing.G1Point(uint256(20548950377264049546042797647499025542855000052735661077364780740750651224748), uint256(16180689948823685715808382277233410498031483773980342230147675789008986044762));
        vk.IC[6] = Pairing.G1Point(uint256(21404810788997571801890054507066011270654883051620622460692833631011053792058), uint256(3569848382359744555864783553534734614519931499645740473277560509377324939553));
        vk.IC[7] = Pairing.G1Point(uint256(11535878256017117655049877344231876135622716611765081930142927224884804157517), uint256(13146937422662995478093568137702700977513032538295978521378481005338067243137));
        vk.IC[8] = Pairing.G1Point(uint256(5810696577549612372768551720863443622503755520549462373009352584876552258027), uint256(11210704661835136154464508183387319723932245993688432821808615710359568496193));
        vk.IC[9] = Pairing.G1Point(uint256(11479861147863910884048539090429544326721232807482475300644626340259362784913), uint256(16835317393040091630651126096790380463038902264547146183209751358829156998854));
        vk.IC[10] = Pairing.G1Point(uint256(19324295035177805655750499021435078935053994733406229149077361000032787871060), uint256(12157442732639130657302760260331865000543341187858101564768871002392396195833));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[10] memory input
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
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        return Pairing.pairing(
            Pairing.negate(proof.A),
            proof.B,
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
