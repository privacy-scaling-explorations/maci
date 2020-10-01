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

contract QuadVoteTallyVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(6201126409121387702613338156019779776838690894800799656126098892745674965462),uint256(4301135958713954753331072016418799191623027519582752704994811069076845274356));
        vk.beta2 = Pairing.G2Point([uint256(16949737766895429563689330553558387053367626241299128864985367102421009398229),uint256(14495368202242554069769090910619812261061373838210726828622863579136157404444)], [uint256(999813450994811923348973387943873511794375280570208706943165981390040230585),uint256(10988825414648929757619459222317085491444345884094435902989821049225228213709)]);
        vk.gamma2 = Pairing.G2Point([uint256(17630205327372357800702353029966267783976645381789676873783648007016857980639),uint256(10569108455762224016236817225819631047404240838520654531769059196838616358822)], [uint256(1335412151733546508273577357078239703291543145568371185138587205925054669756),uint256(20501475528306278448753003700319988554277427599130178314683419102298857486008)]);
        vk.delta2 = Pairing.G2Point([uint256(8160799812814611010442661486174785619755419054776821869625888236444276976712),uint256(12938567756132087973506277103391912445348183107884438446687076236912362608224)], [uint256(13448031701595993789582289470172848146848406094973476066051975695770316490577),uint256(16010501962566358748513734789276437876439533904215093848019179276365444032603)]);
        vk.IC[0] = Pairing.G1Point(uint256(2786034787793337793280351003261598259107722671473154390817598383906056860741),uint256(3754679461509612508812480583957668827612039391446825657360926216002919557763));
        vk.IC[1] = Pairing.G1Point(uint256(6628786500730172883513789431569905074763864933505795065221276181872892087459),uint256(10529546525749165695652315917926652350235805540909806626860180822514646864949));
        vk.IC[2] = Pairing.G1Point(uint256(20312071156111676078532775525927114780619507091929238238072807174206755922315),uint256(20513179452638584108245675595229534735529965079644518055081238878956645312947));
        vk.IC[3] = Pairing.G1Point(uint256(19126512277094876550772265284104777552353542112636957042963259857998417808868),uint256(16759304281528805998970022810879671305372598348496189041633114914941888060652));
        vk.IC[4] = Pairing.G1Point(uint256(21568915272037580305432004500700729500297851717584987778473536603946288985595),uint256(1357626648725615973171877347748043182307955162650221001606774278092151192826));
        vk.IC[5] = Pairing.G1Point(uint256(16615813534410701649518390997218023054628903428846186202933868320594625160514),uint256(13013206784068537195616471484958047480277803085129434511882992479888017981017));
        vk.IC[6] = Pairing.G1Point(uint256(17503929630336926265900547034500679246588006085107744804935401862542223379863),uint256(2717868533480170173572997397054588789882343674829056618500661002397552356027));
        vk.IC[7] = Pairing.G1Point(uint256(9720244606435230902745104566488111650767274231323869401064939961737118107163),uint256(631004247043784648446510195597425368112250275016939986387343524567513292452));
        vk.IC[8] = Pairing.G1Point(uint256(14262851961745321133242565126208514950678466592903311316391471041209903523230),uint256(3800202208160376872080894721938860098843314109086469945194075966243578381227));
        vk.IC[9] = Pairing.G1Point(uint256(18966303301733438593314624374222729232462993446714364421734932047248754767418),uint256(366947252812419646800816518227962470419246210854024873657367848556260304463));
        vk.IC[10] = Pairing.G1Point(uint256(1572715212208385059032253580156469907444717982919893402908334465971208916887),uint256(13926792405766996567425890202114689340713331686476839834237273345481881533084));

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
