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
        vk.alpha1 = Pairing.G1Point(uint256(17133464088378687077088482264559260263983148865902404429977722280234511381298),uint256(13785688003513399409060194302143834374230384335029440050591372860926238142193));
        vk.beta2 = Pairing.G2Point([uint256(2840484440438769946495296280122215248778207395743243463056927142949692947992),uint256(17893260557868532777170757032257510671949880325894417303584532948507645228680)], [uint256(9836656668462968607190121393344221140197393090610503892255635775752104592205),uint256(12486599733786832744178685220875326743182566177554272371383407722520744824831)]);
        vk.gamma2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634),uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531),uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
        vk.delta2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634),uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531),uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
        vk.IC[0] = Pairing.G1Point(uint256(4085779722892790279652530380399718994618332191361196113208734535411492596367),uint256(19014719879984584959828821022791961916735800760328328722920154510318726465505));
        vk.IC[1] = Pairing.G1Point(uint256(11016983169670590756117310448629512162961733600164733163216263951389957883872),uint256(758779368212724469720929695196089675493225189051617356678380903270474781107));
        vk.IC[2] = Pairing.G1Point(uint256(19918004692385483207097004027470720329873187741648177797146570236024431951056),uint256(7925721489174722212227967935190502989790329388826139849931089401992376365909));
        vk.IC[3] = Pairing.G1Point(uint256(21241163936235834429632197077364965619908144740380738363083358864971377116550),uint256(9887791331451147478642090138856618012948515700787052291108458790483173920676));
        vk.IC[4] = Pairing.G1Point(uint256(21574624821432370020469600484650415618198650898124804067405324894254209312202),uint256(13009438191143613077838886903593282098967049773418891350232404459374418737854));
        vk.IC[5] = Pairing.G1Point(uint256(11695605594202103372973647435217050312025941747647136926573622609078267748044),uint256(10923722192177676168298731732081128245224945195715197782494363333451325568123));
        vk.IC[6] = Pairing.G1Point(uint256(446776434954837252778445190474219563975359494844865516636269379707696518982),uint256(6800886456014681090143828547340913598431154335210306114786449215210448327130));
        vk.IC[7] = Pairing.G1Point(uint256(6460471630979441519107620906541032577613940249419525432361017277313256157661),uint256(13336005353406174902778622887561631429961473111461437296676375385343263358845));
        vk.IC[8] = Pairing.G1Point(uint256(18666455025932313991188755016159497562626051939239799477045689962601801990156),uint256(19551230750521857602908530022035020306369474953231009882982084730132549791350));
        vk.IC[9] = Pairing.G1Point(uint256(19915588980828564241054172614693608273748614874713696074510340481712811777927),uint256(12370732158333292052261276453470262838255156512097635430746218436480236289297));
        vk.IC[10] = Pairing.G1Point(uint256(17699939185677201949378920569880185887581597771963342578723041225665828519336),uint256(15821555375602259924914132670505993163095983823707454190315128841269073294601));
        vk.IC[11] = Pairing.G1Point(uint256(16924609748665987306343442340128651993400363080121298204737164236963623723767),uint256(10080231555418625305339756125708925781548389856486407179287533671514538939697));
        vk.IC[12] = Pairing.G1Point(uint256(10266311680733799817213237546508879072690602099819427271668319996479323260669),uint256(15866483154956671306618094151704334841256395452017785323424245696872637797923));
        vk.IC[13] = Pairing.G1Point(uint256(534301698785918219742151579615911577369560111086968222774670976382993312148),uint256(3512043376267351104341764643469835988555588662174778913454570946333312946107));
        vk.IC[14] = Pairing.G1Point(uint256(1455060326284755623735283114497901552526990849545438124817493420029977026579),uint256(5472590487238695535228373838367731243734928310516931200674788795990578470473));
        vk.IC[15] = Pairing.G1Point(uint256(542845768869505052039223327037943473554993808519433327463432692688605131484),uint256(20588922644304771948779264904357873426300800909136878277807767117855422847962));
        vk.IC[16] = Pairing.G1Point(uint256(19180589188405827566583509816046865832751844522322331867554220885218040562185),uint256(14683692738669453290872955223769135411108847342215705266978737487746528282627));
        vk.IC[17] = Pairing.G1Point(uint256(5027225534235741652247471436260491553975977796076577886126117237005242032845),uint256(3357018448878982180002860721161789229802215411137731476598636936126602637770));
        vk.IC[18] = Pairing.G1Point(uint256(16145325543630993600407704099528722988732028025362435956694009890226402059120),uint256(17454811189481338874098072849443713559899931200568001610950112903534088334406));
        vk.IC[19] = Pairing.G1Point(uint256(9477367191245928001030078562330335080844615526709122809685119588782079835002),uint256(4697684285130092326893234039694174552047074196379405504766971188313018759540));
        vk.IC[20] = Pairing.G1Point(uint256(10392403230949846582736077019995243985165321941807098231715952224122215742143),uint256(18120132079248861333956236746593632111949790992766107545813281152557445973315));

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
