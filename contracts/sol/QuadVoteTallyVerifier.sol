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
        vk.alpha1 = Pairing.G1Point(uint256(14216287881879509955119505536929459697793683622667025798083000888686461834052),uint256(332120953190077355134602924109276230998224143532847888194419326012438498912));
        vk.beta2 = Pairing.G2Point([uint256(4511429458803201181783029900534314961277343087060333654808213424914177408206),uint256(8541425958030451249871290477591096810867396490707427413035568080984246392005)], [uint256(19993222519089976839405185311511291011554552454168837272221437031404155299733),uint256(12457266180826089925540859899274003503194041312862685098629012770377665295386)]);
        vk.gamma2 = Pairing.G2Point([uint256(1190771696595911091537184314693596313648594864331437817999992352415082482841),uint256(10223526108451237388237663206877650771584610044759037816582579036980441803296)], [uint256(15790332184760871242084130772498876233915024028990659906107032480820239746679),uint256(55969445696379916609080908221943764186742954516837818718352223332591563047)]);
        vk.delta2 = Pairing.G2Point([uint256(21066725761948469979150005246857947182233962918014596349067046368660921366464),uint256(11852037306746711468014827937914970104634517478121288644560217384327496073408)], [uint256(7499726161260452964243306972759820472636090116247175399891973487086368730000),uint256(1201730664625423100071613159185829444857929894221138066710125052850074519170)]);
        vk.IC[0] = Pairing.G1Point(uint256(19767736707302815866147256804700115578095446159929891701471538458020322057139),uint256(9347842093632613675338670752208547742624993514828164862657918918606903891854));
        vk.IC[1] = Pairing.G1Point(uint256(728772727639842143638426350686304846602845883999350952132525179402986632955),uint256(917682458836093575898378784338857754948993528856191063843244343653041153908));
        vk.IC[2] = Pairing.G1Point(uint256(7792075825945601427558931897372496482565289101679895470426683826365176520825),uint256(7782489942953155380010149008942398052137937921043057763896872231165403572665));
        vk.IC[3] = Pairing.G1Point(uint256(2948535355906564620801417753081000531986038521650421782812907050059511594457),uint256(12083594754961445792815717450289731013769842428413258667911518072521792831186));
        vk.IC[4] = Pairing.G1Point(uint256(20060661805735387569076995845628875155500283380744422687505965224837363639865),uint256(14695591992253267227173445821726396308626331064305281148354487437710180594386));
        vk.IC[5] = Pairing.G1Point(uint256(15795884905018148614049799999885569029693643455331050298423076231937212517377),uint256(12241210030269773013167426995870396865472947123860163394474131117579866199195));
        vk.IC[6] = Pairing.G1Point(uint256(5042660846270833159590882663727220084967270720766670338204710632730266153842),uint256(20763217383841718682596794919457880742096541507932060594227550637025517858429));
        vk.IC[7] = Pairing.G1Point(uint256(21735940960118084739291414483887993146619358342285482501421756574604865884759),uint256(5444962117871745682767578431228917628167166365354474325353864141242855119639));
        vk.IC[8] = Pairing.G1Point(uint256(9843048984467351458350403313468672160323386194812204817850456957456722015972),uint256(20783823309046570157396643100764106096241357392528949852347575690912854422602));
        vk.IC[9] = Pairing.G1Point(uint256(19290811677206172499449293006716251280943858437750785123264474657483784992459),uint256(8224592647743052848119524355627621467855221383751330509261950834557824681856));
        vk.IC[10] = Pairing.G1Point(uint256(20170087676079721499115372049897923105943091700575817603805844110793832615711),uint256(2761264858590150971871086267066789188609941753056007945655159740756598770494));

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
