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

contract BatchUpdateStateTreeVerifierSmall {

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
        vk.IC[0] = Pairing.G1Point(uint256(8446195352247155934061421385444687260579556626982462316421461932613606712489),uint256(10654614257971873328502256449561815094687287393631821708292586713872138473699));
        vk.IC[1] = Pairing.G1Point(uint256(18636857870355224968500666400490016523096600658920986576099998850178336820369),uint256(14713984334287557224392813435971229469685897077202004630732217981877485982660));
        vk.IC[2] = Pairing.G1Point(uint256(7363985696025973808344280520940408176166184372536344353467612536959813808003),uint256(18116935731431006472446811584379337339538344306614230162984767591230605919938));
        vk.IC[3] = Pairing.G1Point(uint256(7193400398073845651532696564162137658595185337011314655457359432006248865377),uint256(3535758745657670504713537837968876482765698881278569651366603758678781594417));
        vk.IC[4] = Pairing.G1Point(uint256(3662776974774987771941654370954604752125058719958812711631479766888418838594),uint256(19981575261134967739298496008380467710186687337670240373442409122869021537202));
        vk.IC[5] = Pairing.G1Point(uint256(2666775924617085695098295190053186700477803095905168034759546010388226546990),uint256(20382959528994241317392301676190681708077645419332993708206409705118785040656));
        vk.IC[6] = Pairing.G1Point(uint256(19580378068530160509239569717258864851765924751485374148711363497375282753854),uint256(7522635107023132427384976187192536991176564330445183978354266612583019000423));
        vk.IC[7] = Pairing.G1Point(uint256(17016402948233281837862746613962771702137469393046874320635142035896863350418),uint256(14947892447914551109219234409117273499884844553998160000251414131069165584571));
        vk.IC[8] = Pairing.G1Point(uint256(15960045711030736884288041099172783566049664385407188916967654441436227806808),uint256(21354611943501853549462724654501266071812654345604315514693475420133223427649));
        vk.IC[9] = Pairing.G1Point(uint256(14462823089051018529093782104789544121369936223543080817055875135476786763517),uint256(9980153734692093584816472950581420684731130169656165017752682854979382179227));
        vk.IC[10] = Pairing.G1Point(uint256(410747689523004621510042232861730895400387528903509090937178326546525370058),uint256(17935659743649696371922492892558344535494714699269554568382345585157678008754));
        vk.IC[11] = Pairing.G1Point(uint256(4570690985528662976224578405659521056868025725747486782771844592697004978117),uint256(13032113180894255509401226712750355903622728340938915264829382876433313288750));
        vk.IC[12] = Pairing.G1Point(uint256(17476321802284723074683782025945566400198809468505457768395839178510337185701),uint256(750675224983557679654289820267423711046152237813212143010626225491213001763));
        vk.IC[13] = Pairing.G1Point(uint256(14835198906647953228523318020223942292483050667716148167241745445919418649296),uint256(15005354131480883347018647270735822532480484044501911428889486610603723006244));
        vk.IC[14] = Pairing.G1Point(uint256(19328471936779739395828217913904519510887652142896987005681339646267710022153),uint256(14157433375918278097424870422977844290656723826910141970768764884622558904636));
        vk.IC[15] = Pairing.G1Point(uint256(3331865712908806246107572852480504544684208834324053311252183465735082491849),uint256(7966336662576619213406681507557662497959074788917486932810236287705516817549));
        vk.IC[16] = Pairing.G1Point(uint256(173210643721174302224073229946930976282216172800599319708787105195781276855),uint256(19897018273236768717608055984287277656511310087879814949393065180972635494619));
        vk.IC[17] = Pairing.G1Point(uint256(19982796348151805564089419509725332794578964791334994813036314210879048139772),uint256(18147643150233212194449519434275452913029671921430019414156998001973397985445));
        vk.IC[18] = Pairing.G1Point(uint256(2396366337207929239029477766435009452462195656958451163852802457276660475301),uint256(4456229581607862533196713916934611453539090664152023917829906949160254346040));
        vk.IC[19] = Pairing.G1Point(uint256(17388271649478746748199512370319954000190888001701124213506669153983370380408),uint256(10067735159999673484918597493803223982675120915875233781964315094269782142760));
        vk.IC[20] = Pairing.G1Point(uint256(10136260947092492968895768895558298047114292597259820026535347081794436174240),uint256(4639515469782829932717804528285528876232479196730244437160519422422439580061));

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
