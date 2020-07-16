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
        vk.alfa1 = Pairing.G1Point(uint256(12521349630973470553954873767297468201340571642499494414506619387581734181840), uint256(3170838461947372139767662645425204431251552245457057266259899467128592316097));
        vk.beta2 = Pairing.G2Point([uint256(18669673536123161508631963034676801987610983475261454671036283044095787253640), uint256(12222938136169388543839979920379598846732173650480473560737512788719434921912)], [uint256(19302948357395671189503087629800327850886073912593967886783836308862839721074), uint256(7023840256831554773624630155284838847134653520285918525587602262052758561468)]);
        vk.gamma2 = Pairing.G2Point([uint256(21160805361872170487618308383890246236712633036810552914068247992283025076712), uint256(9854820103853092789610917534319581967245829943197007633110664666951719831830)], [uint256(1824393881590410763257262736256370851054676696264456744524237488569085500665), uint256(12003485870545101965656114940128537603196198773035987773305349700908143720048)]);
        vk.delta2 = Pairing.G2Point([uint256(18648518021835756925570967572929138147077089876884285690417715368941999779571), uint256(11287791288263574135676309081919204704071636562978182915593225086629162935161)], [uint256(12902042806095850568033197274796700663533897180385034221896315710412386836650), uint256(20532633129935224851063482445293575582173760938944427573921314957094006858014)]);
        vk.IC[0] = Pairing.G1Point(uint256(937854675515127675451502614091850089728082556119613675100665426893057230200), uint256(21665195552006599966198833573071796953553667788569522376065933351023230877790));
        vk.IC[1] = Pairing.G1Point(uint256(6818261403529974184809684978178506887042069117013507739076834723573590542137), uint256(603718763908120310023088254433635921627165760043634755246358894924593441634));
        vk.IC[2] = Pairing.G1Point(uint256(11072619222984286542348544285589878932336764493807528545906336456790025872792), uint256(21240632613975704919781717022225293774801431204497703934937947462224337846223));
        vk.IC[3] = Pairing.G1Point(uint256(21148790808583979533483857400758386689021276742791734203330741234717348262992), uint256(18214931565751257346948346544448929446262085517950905687164650257893533714247));
        vk.IC[4] = Pairing.G1Point(uint256(8902571361189626343685691980253837663912515577774156630011179897684658100900), uint256(9187972198587198655646295645974409820934172954568612972675808806942500682309));
        vk.IC[5] = Pairing.G1Point(uint256(20048998360946093848416707424797654307041220150445359801732762683921248563446), uint256(9504038799166989879973848741738763347156030523671897551962704131489173091141));
        vk.IC[6] = Pairing.G1Point(uint256(533201834526630084272630818582508205914995886330331622253102856564605407377), uint256(10224533354754092770941365143240919392371551509655412435474091585121230999685));
        vk.IC[7] = Pairing.G1Point(uint256(4087949623845273050621840545063987930524737036691489440306863439209549951725), uint256(10070467420148676603515712835545292993479897933394424839013340175266810760872));
        vk.IC[8] = Pairing.G1Point(uint256(12553358060101994239637133277880087045902811032905254586610345303212766847173), uint256(13182507073620637285633330700955976010013143246216710758034777424074748989625));
        vk.IC[9] = Pairing.G1Point(uint256(16323136128002188580596298664342111421741418249359119464129216245602478164460), uint256(5190879105116681337767851825797211137640645589976781221103085978059906560886));
        vk.IC[10] = Pairing.G1Point(uint256(11902202597297331944701673872767382785953901667647563564326649001462237527181), uint256(12545611377185322332164407134672339930033005237896952273114121206813172561642));

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
