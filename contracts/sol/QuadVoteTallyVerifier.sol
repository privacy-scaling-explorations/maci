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
        vk.alpha1 = Pairing.G1Point(uint256(8425171110361960222235931965525816752500482888799366663396355046480032270045),uint256(6054258132922049614180197245409753087617775612779924456751096279557544173108));
        vk.beta2 = Pairing.G2Point([uint256(6002287863014189635087704038990418415033498189978692218294386754855543218479),uint256(13255350126202981913220236950081032321594593556039090805383208809520777934559)], [uint256(20389223733075605610297704800421770574505299552492051360247293376667211503562),uint256(17993531598854164943778224325822519601007139480963882961466541082896831763665)]);
        vk.gamma2 = Pairing.G2Point([uint256(15878974863634764970967702001929579661515938221208631284340880152893376114605),uint256(19960454168028036222448593657852970399827939096556668704199851624644625359442)], [uint256(6589947756448997525526241107259790265449377306440427116497747929836890567879),uint256(5262216319825032597671696729598169497434657572383940833046306153389098376858)]);
        vk.delta2 = Pairing.G2Point([uint256(3042903852233942012226775754886464546281054582994122795169605139252382941899),uint256(10131475510199451785474575231943921255165123406218714587783502686875778713964)], [uint256(7569625774642740694597862887268155819613717031202941372730618550196971843456),uint256(8441557510175233979217374652534534051633783306245748792424599719856545396112)]);
        vk.IC[0] = Pairing.G1Point(uint256(15377799570472530333946450710916208304860584628933069393949261837544666876775),uint256(9110334418727058569087301593694223105592178393529298951842137588890332191753));
        vk.IC[1] = Pairing.G1Point(uint256(2507362729905993919404678217628077221386427084493495843595743983455416692081),uint256(14820426753918102852892649883138433224533281088029852800407842984201276010379));
        vk.IC[2] = Pairing.G1Point(uint256(1517282846654337806488511611337124988020451929414856579302434350218850320482),uint256(6664541562056383195397701217859757744012534329246797916834683983013706566154));
        vk.IC[3] = Pairing.G1Point(uint256(1393541614443567158470200923473959695851814944154729159998689804750295077189),uint256(14483821757000388424066575148249830030278641407859452752878870726621621163891));
        vk.IC[4] = Pairing.G1Point(uint256(4944439880140612721786860001025405566058275143980314375178862872572268554330),uint256(1830241343299247151473378234668661701492770553310394441316833557882789293369));
        vk.IC[5] = Pairing.G1Point(uint256(10885732687281153026572808119324882568888930209142417107556205508853466233838),uint256(20779513628253881443531073056217240997984354053020397056933492223717914213391));
        vk.IC[6] = Pairing.G1Point(uint256(12941557026658364911791658892757402294966074739284364514780264244005217930901),uint256(20165747421303451258838982654834072319907988980324906177154689651031330067281));
        vk.IC[7] = Pairing.G1Point(uint256(7759244351019609205849852412061875152674908560236094024599738597217959709188),uint256(15855720577016504197655919651437280011551166958831543577315660528117415163020));
        vk.IC[8] = Pairing.G1Point(uint256(12934478924573069011661095577404239748829686031945084250397790078088092968996),uint256(21301354331768715043862887760426136839914077590923048071494684593505997175429));
        vk.IC[9] = Pairing.G1Point(uint256(15438636215207052638768462313980617191260767752435587022899045481660094129217),uint256(2967983153431597293306449103680292090089586790282853690946202941136184452398));
        vk.IC[10] = Pairing.G1Point(uint256(17754657339107655162850588758951596018609442002695372174168768053647278458170),uint256(11194393811097199600016075808647287368549899123245291029888624601974045871251));

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
