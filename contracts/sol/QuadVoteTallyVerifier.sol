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
        vk.alpha1 = Pairing.G1Point(uint256(15815781521624294237479818486809330713434938743861668626237952192906878043910),uint256(447313441315737720115820532664096470622532893012410328517703003101420643803));
        vk.beta2 = Pairing.G2Point([uint256(249232938187362829254130567054461033477158673052829033182775917228215486614),uint256(17288606150269247633889416020084427580601684239540691143373498388702591129837)], [uint256(12429131547534188786949228067961417316869082731016501179021443426249034957772),uint256(5143298687635169910728390099744540766195150527993097915526495689420778273667)]);
        vk.gamma2 = Pairing.G2Point([uint256(5466910887696243591991728679615785812612253534519442381417636904964602020020),uint256(4765376007734870515388353374910456144573290333860689354582030009245401367953)], [uint256(19535751167819440836257821851003875682113438797527193697889884630240061465483),uint256(3080137859772366385539234271920753642893315387999253240643109794541786192794)]);
        vk.delta2 = Pairing.G2Point([uint256(17333712061473210706851612529919634101568723788593112730215885967688973455039),uint256(2986405694058254014853099229597445208094300789426289085261680634520825633481)], [uint256(17907495566214045943066548985507428954634184364791991541031191052554992259353),uint256(2146617568611924877581933994082575574201241066518506179825979266375131999373)]);
        vk.IC[0] = Pairing.G1Point(uint256(16662097695630040723007648581068831521003655237057360944859027437368894678740),uint256(17876177405512144306613979465006417772111116792560648077579220378425945151960));
        vk.IC[1] = Pairing.G1Point(uint256(16702232539092462113023594182594592256911661892215763032668246974694028284298),uint256(20925175381315915604888603110281220871887120253514911228565140295814359696189));
        vk.IC[2] = Pairing.G1Point(uint256(18449031198957968838627314553938688970620401539990365765940011743178612837030),uint256(6336258576198936601206414298301082395907426362623587309140496573629993284842));
        vk.IC[3] = Pairing.G1Point(uint256(12950777752242124113286437685294044726435111393797141173659045956739038973655),uint256(14072993627330974807044107337545638663844762820327897021123393899221579207173));
        vk.IC[4] = Pairing.G1Point(uint256(1037042062272380631071458876254480581041117341525578013490290477623447838091),uint256(17745920380096149220030599545096235708796141968554549021135620009712963855310));
        vk.IC[5] = Pairing.G1Point(uint256(9400369758877977388352776212288488223235824133622176740584037234644574148994),uint256(8026828249602478779006139480987065421771544164520953621866433748309036989546));
        vk.IC[6] = Pairing.G1Point(uint256(6380002310143996741644226407316931359284072353931249423021366100666116608212),uint256(15058256582859888274891802118897043169214227952666373195004437468998884800414));
        vk.IC[7] = Pairing.G1Point(uint256(7289881677927208197628757914215096632578185694794916453434976952881118057629),uint256(102916213125869502608655285082568817078269316898633763713190977589629999175));
        vk.IC[8] = Pairing.G1Point(uint256(1638464249234956046239210676763783567282909159526714374338680678548840341585),uint256(10058794732994675413352269644421397561670239169107687190936883014162169165483));
        vk.IC[9] = Pairing.G1Point(uint256(7906770188520725692879568621755574462403785337410595262649960228438527422093),uint256(4950825185415578189038037109468993479793713076254173875690136319700007630267));
        vk.IC[10] = Pairing.G1Point(uint256(15234789229700660727916400056373105144798185319870981480681517431585416852698),uint256(6911384653784045453367337788231220343936861515043746514147387809824721956245));

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
