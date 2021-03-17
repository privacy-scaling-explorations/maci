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

contract BatchUpdateStateTreeVerifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[17] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(13983593281282975389375791600323373527441244360322132546773735575828975505991),uint256(7965998577292700092560564124859538281184038253086454044070889379747705037808));
        vk.beta2 = Pairing.G2Point([uint256(14354228421516286597248911013925536282145350291012474128014127383538129425304),uint256(5680304983559371545539051675358861378193230928319553999905380428130288149883)], [uint256(13280375621576065945511245104440881076945074919621401803290369738584454045026),uint256(21479235566843232355485745190251930279401991201587281703529877281266967134963)]);
        vk.gamma2 = Pairing.G2Point([uint256(12918407100471246025496373606194038578235153825793121848234060957642811376585),uint256(12950743524020988380444378300770242859059643841528426719177380416217804356638)], [uint256(13004714184164590546383735521438752134882299547279906380377730365239514900550),uint256(10404619507060731744979818586211924016419847506830557586458905845078474256681)]);
        vk.delta2 = Pairing.G2Point([uint256(7656470571945809955000833542822647336746778380048398736393246178388269262428),uint256(13826836975298269492293379859883062891511792644463448114738431900403826819118)], [uint256(11240348447639922604361199623062382012156376390937311402131102447037858380313),uint256(7499553986777824232014195733962161759134093171549990384805085327981234625425)]);
        vk.IC[0] = Pairing.G1Point(uint256(17248828528866474281988003843183812445217330017679007755872747040447320630856),uint256(14837092260425784592141382196241186414291103337864195557854756305873069794840));
        vk.IC[1] = Pairing.G1Point(uint256(85767783704964981050406933378295333499137055868373557749314009528908125396),uint256(572093031528810942061587253491078324118751013233799514797508018129411350256));
        vk.IC[2] = Pairing.G1Point(uint256(20607910118252770388405013166794186250037239555412269130847298153399262773233),uint256(14635311961781091046011751192372177140043814897157141060970105665272524974601));
        vk.IC[3] = Pairing.G1Point(uint256(5800190442549809325483017924880733252860502832305236837294930490526596781575),uint256(19758818049063272529665349937057858845121202922417794674764989162225270319546));
        vk.IC[4] = Pairing.G1Point(uint256(3461123234186004129065736111634319718576464008897533209657280416059323090910),uint256(17581062679281407340778578167218483655894312648526745283561149283513507330718));
        vk.IC[5] = Pairing.G1Point(uint256(15042615227216858621541204209669014390720042585049691702208236872902217014737),uint256(2166037276670572608449894335267184027494573777825301664694806714674789804111));
        vk.IC[6] = Pairing.G1Point(uint256(15695039475287020909524559698986157699465746726184496077685771041042975178098),uint256(13880378520313405839845381193675871186558040543021246501427331936972002857416));
        vk.IC[7] = Pairing.G1Point(uint256(6453882956462079666918571098987695136070910758932631134547457523491937453751),uint256(13502848097087516870760146070158086051314164101395989120054274606850814436425));
        vk.IC[8] = Pairing.G1Point(uint256(8026330141682563405416491651472727903041442357396193548064873876034472029832),uint256(14671526328623145174606114372246200151905024257093228221055154689814867968742));
        vk.IC[9] = Pairing.G1Point(uint256(21274983506403334477998783417579139188210932845869586193367917843563102378574),uint256(9812191535137475347739314568973180579234947588650596437752086651599957235747));
        vk.IC[10] = Pairing.G1Point(uint256(10124400728681339597609097209430851228938860224078053733655414582644298677339),uint256(18488095563286993211957363935068250915763295277445470790686672767654308157936));
        vk.IC[11] = Pairing.G1Point(uint256(19951984486032134423188593697515647410993929162829300851850830952898023252558),uint256(2354187941127492613397252356078419422528513707989412251013452979794538546374));
        vk.IC[12] = Pairing.G1Point(uint256(20457955559236191535399967002438922907845392276944766788084071590683346813597),uint256(215902589813488360595270492714165756001556663937885591736782201161605732770));
        vk.IC[13] = Pairing.G1Point(uint256(21854215227860035088504625763647781696580756089372198844675903148406264687122),uint256(13754997606936609179415204491430167965583080391382408528554871786066654538178));
        vk.IC[14] = Pairing.G1Point(uint256(15689275492750522345138506461965256951314347448759895359947569795995872839697),uint256(1975139714786195305786740067529648415043839521399133631628353745832453356424));
        vk.IC[15] = Pairing.G1Point(uint256(1582213535952192427465584070111209280127727170450336926846808236885526698537),uint256(9942613315659076065697451261043541129219583443584649880410266154129672241485));
        vk.IC[16] = Pairing.G1Point(uint256(11569507343362053446407566790055503369010649556301713134562455927835011404647),uint256(7268544478750391435957209217954479575365200349853989622429544273501865963284));

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
        for (uint256 i = 0; i < 16; i++) {
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
