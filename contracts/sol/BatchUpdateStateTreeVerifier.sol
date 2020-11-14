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
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(3213735765320666696471114679845313312510308794106581413115918987612309614876),uint256(3124952171680354590554006419381144643961837911740179386684188649212767433227));
        vk.beta2 = Pairing.G2Point([uint256(5043839246295762814070246216735434948719392024912324032624872905013599950087),uint256(4785941326254878766017622027711127686937171798607686879769199932335114407049)], [uint256(18832196432887717323363361190577652661233614928943772869737101705196864361455),uint256(11260287498697255402810433279115484301147243977008471888627291804222225889450)]);
        vk.gamma2 = Pairing.G2Point([uint256(3740866750487719380503084093947848058788960788183951467761221638437516561703),uint256(11013005224819182326612870942363525752123975777537793573159379063140979011659)], [uint256(18925410314879468739076123786045696666651525604481877999636394575612314973943),uint256(2930439918446532780112806769028213092417860786350431475621561048561518032135)]);
        vk.delta2 = Pairing.G2Point([uint256(17258831354053861369140328227393825306553946006430820934408112195311733114909),uint256(2118809522683669206046528890786335741269065037582821877241176970614815741035)], [uint256(6336096674267532700983915385912175714145265518662548721311378865522520797759),uint256(15708914975017302618434600326072221520090070490728307706967842721946004543093)]);
        vk.IC[0] = Pairing.G1Point(uint256(10844617392407563081802729635083425700093341538791015102123494797634650838019),uint256(15879202055211097085778809267517668583130789490451115242484528234014083494518));
        vk.IC[1] = Pairing.G1Point(uint256(15936959943848604771058014162140857835849608059593378889119189966982596447858),uint256(19472445997865400895740830354798660064187350589479383722458912929804431983487));
        vk.IC[2] = Pairing.G1Point(uint256(16598005143925403025552027195638464520359755481289005489785949724399025297241),uint256(6537597873302810162392041167143498106777122106820216453554337242165467555893));
        vk.IC[3] = Pairing.G1Point(uint256(1369682785341663625605997149148398175420790434780167864528129879649235073912),uint256(21178270307807313580979789100436677685220497147348373838659802832687995115514));
        vk.IC[4] = Pairing.G1Point(uint256(842122663269284194609044736980367554273010679518545862834579186265510319061),uint256(12267074092991887189018506473708017781476009157811437859856142237759024137479));
        vk.IC[5] = Pairing.G1Point(uint256(17904189312373879280178694055916107505628721398455867559695025571356764464714),uint256(639177563796288672931395553061396849811143593773824243929766527902324385718));
        vk.IC[6] = Pairing.G1Point(uint256(5767663985470921377286205804267738447425989117750637541327389582786410304882),uint256(6228517461091306510416400381509810268938263568027440921739515342254568014008));
        vk.IC[7] = Pairing.G1Point(uint256(14355250045875078334113991444505539806802454503201072962103441062459802338036),uint256(17959114289933261397604054272307175410659714515970495003406992719436428986824));
        vk.IC[8] = Pairing.G1Point(uint256(10282024216861688293489767305717185817133575988454034880947403804858362789158),uint256(2186542119589282145942571442238048141377596284325775160779536530750945508719));
        vk.IC[9] = Pairing.G1Point(uint256(7664677373574768196702801331360385522878383352602972723283834012841951520070),uint256(1731867005021652550931644457335117519603163889462410520570698779075493941062));
        vk.IC[10] = Pairing.G1Point(uint256(8106426266978465988232841769246487263277180802149787514644535100817291314359),uint256(14082635869689218947584339717486023407430048437728204867896605313116931740632));
        vk.IC[11] = Pairing.G1Point(uint256(12770621871568585280814667397594454967518457796213590079171340268856091604340),uint256(14665513378115416185241910336621991193548753457816532751138407946927353859508));
        vk.IC[12] = Pairing.G1Point(uint256(14235891329916435290189239834923582373230639183785648416330671371503270645575),uint256(16939048540662459349299168242096045546003934115978353278662893115560646465451));
        vk.IC[13] = Pairing.G1Point(uint256(8342400644295460433984458373019587579575745724756306584163168762146245088009),uint256(18482139823491590253537689214230555835920405422638920339208410064676385590172));
        vk.IC[14] = Pairing.G1Point(uint256(9260482485156234594170301933093245606392954983406971598801549143691110666604),uint256(2183317444909245438768872029810690484213327409005893369766852511361747263108));
        vk.IC[15] = Pairing.G1Point(uint256(11401318625328603223501832417077001092765264731281365482648547297552249579429),uint256(13556669383365831073557132069617635616369485256619365329180339572947504931909));
        vk.IC[16] = Pairing.G1Point(uint256(4345573754268285409811721059479554132743123770035935026523890270609460722364),uint256(2586567469090308333200434145736540658024937923754797681680071702554035425877));
        vk.IC[17] = Pairing.G1Point(uint256(3209622045204577641347565673111886312917962144196463102978870761057836579586),uint256(12956119264742191519463525295726978619609909919617873846769530887511226223216));
        vk.IC[18] = Pairing.G1Point(uint256(7963699070095057885985573975398386334035375823723293469740683356384400986985),uint256(1499026842318875500226133290473329201192659209186901059395676737994065255001));
        vk.IC[19] = Pairing.G1Point(uint256(11522735309530177471026304773310250514691661196415591040807752083682798213971),uint256(6625420056675176407966998490242845339476762401250186904268112131678931286592));
        vk.IC[20] = Pairing.G1Point(uint256(15268390574020002677584379635421330566266084014721296891445671055988730743463),uint256(2334133881700628163402772671016733792359537304635341690713932837839088744967));

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
        for (uint256 i = 0; i < 20; i++) {
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
