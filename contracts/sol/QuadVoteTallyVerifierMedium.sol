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

contract QuadVoteTallyVerifierMedium {

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
        vk.alpha1 = Pairing.G1Point(uint256(15668367359666487349956976337806463523171205704826485209150250189147450074807),uint256(19043946042539007123594317681150754209257374429455260818397711352967500729439));
        vk.beta2 = Pairing.G2Point([uint256(10823188238321750898289099230350163905655579528677312573828344952599147861225),uint256(14836850053029638730753994928900566048774749829526849675454892002989560060195)], [uint256(13194281519828193448733348698270227613302343081282513595589855750922537309665),uint256(2921756309551276608413581197978808478724316164929338394930581369362942000915)]);
        vk.gamma2 = Pairing.G2Point([uint256(4753950504109211120483843242563175718738351858916278993364543465784018373415),uint256(266400957615238353205008364266119873874953476422314160131938075310390953948)], [uint256(609463648135317500591865767457401597004549595710271207706928051118964626688),uint256(16014298077843604933335910161439514152155276169136778077090267012059528626171)]);
        vk.delta2 = Pairing.G2Point([uint256(16380446651877115406555402210106778891017476582135242177985748314478236689576),uint256(13819413045600593435954547267811370318806746433278137630969422175253710651583)], [uint256(5299749850500873587458762616748971596634843968519007808747891812062626129242),uint256(7918732832782859549882168411245992722945765487705939584482685910572172416689)]);
        vk.IC[0] = Pairing.G1Point(uint256(2656532246779923850903732728248000738528934363549425075965783449098794497025),uint256(290165091350792407847442215131937096651128481600866503816261565720834699816));
        vk.IC[1] = Pairing.G1Point(uint256(15976953844380414159781756623879578090743283280051533289846485328570328791415),uint256(17082012021861433683214675308324526833493749389154579123782372467353285662946));
        vk.IC[2] = Pairing.G1Point(uint256(4717167956526893609331707886336157990847900187610083204251485330124394371264),uint256(1770244794012501989082389154985789200345777356838195505029442087320710727127));
        vk.IC[3] = Pairing.G1Point(uint256(3810215868794410306967145012263642347845900975891294187389077890648386073042),uint256(14902150396545939173864617967232620169627783078047310010752455364869698883601));
        vk.IC[4] = Pairing.G1Point(uint256(6597507226492512160253934421801748003123536110328285348961650331794416544956),uint256(15293139070457423848854800012627002165323614150098226301210290722367122363729));
        vk.IC[5] = Pairing.G1Point(uint256(7353646787301299769863634923288403819149732194688769222700695735945284364963),uint256(18938382654516697323771346900382273113110308476350477896593548791608838972813));
        vk.IC[6] = Pairing.G1Point(uint256(1890878737697798332638180234037530613389425356499374149286680407911249134492),uint256(13345810757457099439538921834995262167557665362343817648813578204507567096170));
        vk.IC[7] = Pairing.G1Point(uint256(6984595549485408586919862452992348541157467770000591619654479254899409069949),uint256(15081559983958326499793798444396607784073100642100689366838774829994615923550));
        vk.IC[8] = Pairing.G1Point(uint256(20884401010138828893508749933660675438827551746572382326343461196047143780271),uint256(19673188942793656123259050880140062909359891635987637396691728710021745948374));
        vk.IC[9] = Pairing.G1Point(uint256(11275820844934944445187668994437550425982695724766115403759293184439222548532),uint256(7908021499307057573785685553435736816698049965014654717429920356447185263633));
        vk.IC[10] = Pairing.G1Point(uint256(18593546483415239143070479282939251710751533775262095147082157845459697872823),uint256(1828737985474606348160645174374616585222716319437140229001477523016866625491));

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
