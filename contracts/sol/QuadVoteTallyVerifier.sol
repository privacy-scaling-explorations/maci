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
        vk.alfa1 = Pairing.G1Point(uint256(2534592141455756305707701416900478128345904697228726598490640849612895165405), uint256(16381870631660987598016572895550015154976775712643027208900403294532636164870));
        vk.beta2 = Pairing.G2Point([uint256(545891186621764423029097931951784564952491087678109973978432323165523313912), uint256(10052249165591122534723103344145508844633951135870520289875117806135992019382)], [uint256(1881679620744905779876854090450360280427554052532784391415185624031841118427), uint256(5649550860779150245893802475724526452680618333534512437130312098197281816270)]);
        vk.gamma2 = Pairing.G2Point([uint256(6550285778088543802285128511861112729550801042362256831178556411641714152476), uint256(6636923335661878936252810824337954404911182252711055514221046218716189423127)], [uint256(14013966076802418497951480964816343122833091538946310365601331532762650972045), uint256(16252209431605267003352891722113289378297368269059319996279292511989476516992)]);
        vk.delta2 = Pairing.G2Point([uint256(14986136197046967351933629755326301161692685653272933807006393726884110052819), uint256(17091130867053739905888091388243706563760307645980240289058938570459695087755)], [uint256(16983300986797828248596817673728886654626990818471589190705439172766556290953), uint256(48260357380823415064975990079917096634448960451256840784662815672743473509)]);
        vk.IC[0] = Pairing.G1Point(uint256(12736803509077609731793553689279975964771391302128891485188249423513080884468), uint256(9204326040904051031351240597707266633862042461586275363388723374817697905242));
        vk.IC[1] = Pairing.G1Point(uint256(10054454382804378867281063305281703160983033265771036366583823339754937765850), uint256(10049048681794625702548726670499993698952441188579591644931826649285077731091));
        vk.IC[2] = Pairing.G1Point(uint256(6648188498962404563279978822516839880550558450858548556775857406661322375093), uint256(12586289569285141211690806652235115044057843213224066096089751725207310376626));
        vk.IC[3] = Pairing.G1Point(uint256(4611687560679294088211911116040853038737171305231265533947256935133159855990), uint256(13356522269791940699911666032284104970700268869516654959427562192439054852383));
        vk.IC[4] = Pairing.G1Point(uint256(19856399144236164014688690473849243038305306071469648159275527199220276606377), uint256(17185595475508965942220600121969366418742416733520222381653451968575273767572));
        vk.IC[5] = Pairing.G1Point(uint256(21532035214421046262203585224581195202903832827360235411163993153470795561287), uint256(13630879820399113838885453889170603679091419241219655028598835997128194486302));
        vk.IC[6] = Pairing.G1Point(uint256(15542700199019840911443558429887257293109636309295314016292041102176817683628), uint256(7756220818750143851289499480911823332267549633224620564196671353981707670278));
        vk.IC[7] = Pairing.G1Point(uint256(16069298698271451967305801482057555711370109503792291635964469721726293912129), uint256(10376092577213387334005027947833919365678773755415019233568736298078226106095));
        vk.IC[8] = Pairing.G1Point(uint256(3579026837423551686302281239089289534560037298686291398692057083503338678213), uint256(7571382231635938176024041596932236911126004779390327855000106859346553610850));
        vk.IC[9] = Pairing.G1Point(uint256(15726862383883650214693366283056716157553464040395162249269194787565261166671), uint256(5092059936079843968555917029763649368356892990030681816972847529318931412718));
        vk.IC[10] = Pairing.G1Point(uint256(13719134026041558390165294693649773894964378291165027949890710812358510878132), uint256(5989764472570254785010506220087634723525347897976208448318292112935280440214));

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
