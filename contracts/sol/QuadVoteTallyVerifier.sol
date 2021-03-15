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
        vk.alpha1 = Pairing.G1Point(uint256(8648899444399413788198627008911741329205674107616560648468610352448320448194),uint256(13442933738777473053586896237554053782096614056337415754272139495976043932819));
        vk.beta2 = Pairing.G2Point([uint256(8493449756966693183819215307402414382641731579331004775246355812931987319758),uint256(532389373474951288442332765987923767089373774695256015950914074668192851201)], [uint256(261560532315413854116196336406594442958290545793052244428524394431286145973),uint256(4271181005349158764135728850815486190780785911372303050805909254691781116447)]);
        vk.gamma2 = Pairing.G2Point([uint256(3749025762735123561459708829012755960755043476446164487399337675129691722910),uint256(13756052283747043447410558047778817962250880481944257560224696424112307902291)], [uint256(20507620993951664996523823522716015648234951362841974788866152204506864236841),uint256(8763156007997207119182451713475919829142298983609842424062511544171264931369)]);
        vk.delta2 = Pairing.G2Point([uint256(3245372255936117285561655084537476232222244106783314921640693045617154896735),uint256(14507845774803947414856839936616604630217789969539803047626146814586102589267)], [uint256(20273993302255161879634186616513271181018125298806883510736070671175888514650),uint256(16332112719171104247192042029273568482631427857451271202843106379551382224950)]);
        vk.IC[0] = Pairing.G1Point(uint256(11807774765391866539990306556057238686794838190243108041590120450371023740522),uint256(10245493114080530738891527412809322904197620526724560047298429940881496963987));
        vk.IC[1] = Pairing.G1Point(uint256(19936882525354924481842699191507681082414285417638889210189166151901800383188),uint256(21648410688910447320697971041227851012022324819258829243220894957782124119483));
        vk.IC[2] = Pairing.G1Point(uint256(5576909522662167654201458578379523559472547227926055161840222981187207198984),uint256(14366903474502796386617894418796191865172412647508656090518688633167003837632));
        vk.IC[3] = Pairing.G1Point(uint256(8456213886164454049149097151416863581199705468464080260106166111586545822623),uint256(4322749679945232136223295440225335336016707759685656472489478693663323715540));
        vk.IC[4] = Pairing.G1Point(uint256(15317203561456710459884919677400108533170920338596808280206104672041655882136),uint256(3224990800216760922656547075847468900373552286190654267692555038499837417857));
        vk.IC[5] = Pairing.G1Point(uint256(10778815461253374253345904188449010093922009342275529980611555288296262220541),uint256(2908136792987635002672090514737973763794249731237108730525879866799326394170));
        vk.IC[6] = Pairing.G1Point(uint256(11682735047785127889653256759878468480474527790051796057835500081560949930645),uint256(15352058767565713602726595697748328554953897265107694251997679165095464218372));
        vk.IC[7] = Pairing.G1Point(uint256(6681488857095697577130241339306224672285900410258132919157038136768088120962),uint256(17455197844885713293683687088625642232105118165605784606733440664015438345218));
        vk.IC[8] = Pairing.G1Point(uint256(1230721501690048760703788495674407201218608431225473214189090163060634071690),uint256(20394012065398033169276001350488428616404325656374694720945460512036087375266));
        vk.IC[9] = Pairing.G1Point(uint256(4814911746132316745689712171079194464475141314687970818763224662905018634929),uint256(14971455389481543068906691827015261182290118801516223884028573439066800546765));
        vk.IC[10] = Pairing.G1Point(uint256(19585190991813142085147518547762618307914268946244437009646534678585701677628),uint256(13857508315158272142740933379652704161060797606147236520672900526475452684070));

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
