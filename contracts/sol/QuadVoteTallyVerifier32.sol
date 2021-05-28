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
        vk.alpha1 = Pairing.G1Point(uint256(12721793455225566966149599894069525456902491017633220986381673835401731992202),uint256(20014379151816094772593545867589519037820858926114057871852974244585357826511));
        vk.beta2 = Pairing.G2Point([uint256(13923099736752546235332067084008262790653740544423898440024980802199602194380),uint256(15619844756906464814012390808186375648808632080106549315220551380784101085855)], [uint256(3921893994365584478179329893230466782304242491971726080417981670295869166578),uint256(5520462741257456526472171742983896077951481614213395056040335289990181220661)]);
        vk.gamma2 = Pairing.G2Point([uint256(9139237771193910929777505662356020974338742409789523955839270160505049362053),uint256(9865956729561738296034779167546712104715492707532426195449917420989378224407)], [uint256(4732898707434778676136744898776181300846376123644331978529903134085914812186),uint256(610958376608214652481006896342488387305966287992689022798718057024540327852)]);
        vk.delta2 = Pairing.G2Point([uint256(2385605914272248624917309491704089097799224876543142404147348394549897423127),uint256(16830853972410123540443106845160380879325310517534559655472235708016103171809)], [uint256(12454015220713556042003632884388328430691802356473496220214478412585563466360),uint256(7385869780186450190353798928060993966308694860471469607342191859433989850505)]);
        vk.IC[0] = Pairing.G1Point(uint256(7138177942332042143619462578590699661201641028453574917866235919958792739511),uint256(6443668303673722997048594955385664929576107986642378115831245040841676796761));
        vk.IC[1] = Pairing.G1Point(uint256(16956560576454748159646717142288914685497669030171871312556629907482930912471),uint256(18417097621402107121908598190231501051262710778557081010873946649084006368791));
        vk.IC[2] = Pairing.G1Point(uint256(20681885493451318290726325625772304195575356907097788160706339232478193050837),uint256(13708304329149138059476327709599072730581096472602368586353840750807965350159));
        vk.IC[3] = Pairing.G1Point(uint256(11247088470491056041262109135005981738171166270130191572628449705320463118010),uint256(19368921929672027678817726563439711760900715291009636148735434389214866702315));
        vk.IC[4] = Pairing.G1Point(uint256(19722276930381005969200127073586782630950965216437266073423693601429431890717),uint256(11108457173986314837385900464819347902600323808210186855955318349638990090005));
        vk.IC[5] = Pairing.G1Point(uint256(17113286812594684823472250764335064284511190573460680848673242326342044870223),uint256(4922590713692829450317298237362904358014152007845801812010805939586607287957));
        vk.IC[6] = Pairing.G1Point(uint256(5552008308508131401004031769057970817453830939284731095411600220903640159032),uint256(7431432139086728586548152989981754476605459049185047183092951904691683753405));
        vk.IC[7] = Pairing.G1Point(uint256(21407031751194933313844691216586639122432039478931917793829861681866783733844),uint256(4352280549630218137674094952046496271143000747653382299819716803805280275290));
        vk.IC[8] = Pairing.G1Point(uint256(4683378469485609955413818617768864252683455243408864776630516930732154023484),uint256(21341617618866393940773678566038613922456366220974895473667769534635429052948));
        vk.IC[9] = Pairing.G1Point(uint256(1656362201869262926298585970142367088528404021292798499693073093803268040102),uint256(1771728279460842040678863726980525193076727721478911046419446240876144293485));
        vk.IC[10] = Pairing.G1Point(uint256(14775419168343551878998559521881312379512902050196767897615448125576952892276),uint256(8375725170046120937001614497000308992454588860058142098690002200213203088483));

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
