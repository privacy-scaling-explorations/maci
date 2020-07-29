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

contract BatchUpdateStateTreeVerifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
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
        vk.alfa1 = Pairing.G1Point(uint256(2532489854204212391311255781073796352643832459172753144095237784997917321497), uint256(16041046444988325088664356202720761310780131214358016560381822308100633384723));
        vk.beta2 = Pairing.G2Point([uint256(6875750988626742667807122578069960619234674793319383852789343329223189727333), uint256(17590333350576036621508556113526372716701109150966872507196269442377826239089)], [uint256(1291358648405697317031208240447076144931255202282231651148036121851176606188), uint256(5893093371057022195586739704995877036584396186072949160542210198838126182415)]);
        vk.gamma2 = Pairing.G2Point([uint256(981322314243601732082745869851619709326246255566486085932026474209902645373), uint256(10396049607020326803557973286007297619346460148560586140097163969927715461047)], [uint256(10545443955533320818458860943228634184510364350432435436535206841824000341793), uint256(12255118119641918509415871408343514792863938461039340765479428667398506609214)]);
        vk.delta2 = Pairing.G2Point([uint256(4562538037517460261832042362200266247943817478486928133466580628018516351411), uint256(19388506414882825822707550832725752970347003053610302049131700951704862478494)], [uint256(17980721266331148355167424186497383553318983830330731319034830054504917297809), uint256(14097413496988955250011253988543251658259576927498231529469280809786559242669)]);
        vk.IC[0] = Pairing.G1Point(uint256(2846723727178160234582653501885722029704195693055056953620477874776613527709), uint256(8087004401360303132213472566187328512715226859610617447089300193072087069789));
        vk.IC[1] = Pairing.G1Point(uint256(17343811079782423093414914545548137108948208931946281182941883550559367649969), uint256(5978886542499192175937518933968655543094728602219750285887346644708219368850));
        vk.IC[2] = Pairing.G1Point(uint256(19346324279311287388185284754081492232561123339317775779819473446559721814809), uint256(18799615883100081051463421226904256396727355757049224881315259609717167286748));
        vk.IC[3] = Pairing.G1Point(uint256(5104768322647799401019885341082079792957648285265224467858014358216454167070), uint256(19008400185392590262575386528888936389393869791289965755808561042760796620461));
        vk.IC[4] = Pairing.G1Point(uint256(4269395185064616960312027186054844270379720676786812687086168631717264303195), uint256(17037981737785562857665464968697069362568112868410469184299891158773450907282));
        vk.IC[5] = Pairing.G1Point(uint256(2022783556328892140408715578840111689754509070686446271094320838334996249554), uint256(15294516674460000122955970281941284524489521611545611069089935798335450257582));
        vk.IC[6] = Pairing.G1Point(uint256(11509052141048263390625043547165436228605546421380742060588315672511821029056), uint256(11557419556367199823224757812099301131332974439222407521453275989350477820378));
        vk.IC[7] = Pairing.G1Point(uint256(17924227648799049147653023611575221920040746963483671254360841385228052196320), uint256(653297497946283885924009813235972665626845949962319706723367860577579222421));
        vk.IC[8] = Pairing.G1Point(uint256(17222971571223933040772007353580966662787314655771486972303464823965577330044), uint256(15005330442543652554041619839419742596989803802844688926608972699675562539212));
        vk.IC[9] = Pairing.G1Point(uint256(5014037169367840020152956417524984479966701413792602027906408500342285694053), uint256(14517033753426571559706398993871386886557768916438053114997145937561413097691));
        vk.IC[10] = Pairing.G1Point(uint256(10488127655267157102882111484087145543743224530824364569620340090169440745835), uint256(8128211197296364514059725583455364424846797431890406305411679479115020940924));
        vk.IC[11] = Pairing.G1Point(uint256(13896073898032204889533834117879894913464319248169854222144554244736109943300), uint256(20654460383546903210620320475785312895554297022548451625831028181807527628127));
        vk.IC[12] = Pairing.G1Point(uint256(12900462506455741397446441859602910153985134413239202668830602229257160160672), uint256(15709279465519462996967758451338246009829497426433255022691430289638414696057));
        vk.IC[13] = Pairing.G1Point(uint256(14111932640930282158008342603678575349089649852387046727898383310894011529297), uint256(11836785957669502747640854020152874545949114934728964178686565101616398719235));
        vk.IC[14] = Pairing.G1Point(uint256(9976190781814877529959977731705360184751617767689584403934618515728896316169), uint256(19424045201330256605133429319776230582849287511499797784278688088253251715021));
        vk.IC[15] = Pairing.G1Point(uint256(14439443407810807683242122619873866690390513089262851643206955487234521655224), uint256(18143251118476521351527263344839227116261656256144986850882453047961499860770));
        vk.IC[16] = Pairing.G1Point(uint256(18478248745836228992514491075235575647500991124282833035356932025673955476481), uint256(2911748730194943709221003415912591313016726226995390738203954165294268744309));
        vk.IC[17] = Pairing.G1Point(uint256(14997485873903739578596682727739312137578494133768775149103920988750927674690), uint256(5415215585454430397250051695637958473294505893188984734056477485707393891893));
        vk.IC[18] = Pairing.G1Point(uint256(10073987706489904926293676434220028234451637765513091132615478962645646968707), uint256(14945748935525165792690515411898261376030720655838485032619642057949244721232));
        vk.IC[19] = Pairing.G1Point(uint256(17221907022016308253839211618100768994848399918576142984244932853762070191434), uint256(2640986973783261327681825810023277811056664474618451851896086391363572403235));
        vk.IC[20] = Pairing.G1Point(uint256(3876131167182901867886234636293982228718496307954458042165868218116955123234), uint256(5359362045891773211041953636485166644822192617946189555445628237963490794213));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[20] memory input
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
