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
        vk.IC[0] = Pairing.G1Point(uint256(4482300386016953052462103982318268828546488745055403784296358493000111747090),uint256(4548253875780790504223961587330445504052955561371598275699671861933762478074));
        vk.IC[1] = Pairing.G1Point(uint256(16683106630219435975486109518638828568130706008762768218624604258054793326866),uint256(11302784610893553019099006213751629324014106263305837875692555209980869553476));
        vk.IC[2] = Pairing.G1Point(uint256(5819033230250458287448462923632769341086865383356991093955932323039507191879),uint256(4593906098893515339481037669777693133114388107143654169308067254778683117612));
        vk.IC[3] = Pairing.G1Point(uint256(2010980533163856309925050311678606100065625883725876940366156747523501626254),uint256(655732959310038141056971976908361052813920007295624510712099996449576529366));
        vk.IC[4] = Pairing.G1Point(uint256(8332123507975016228634201901030413891656749190297274263477350388514025511273),uint256(12362204121122947129272534086878955282361941796543272687313097905163965022200));
        vk.IC[5] = Pairing.G1Point(uint256(11425380113013884367712497861273854583273780232681367875840948749289616232079),uint256(19485423942448905982713802921542194798968599118962752743759214037741613766377));
        vk.IC[6] = Pairing.G1Point(uint256(21550429344682086154870813960368310581797573232000311694758720200491506539484),uint256(19385162152955088350043951790447312814882723308723254166669721690727535080655));
        vk.IC[7] = Pairing.G1Point(uint256(2140770924554421761715748530152809757255156732045682670481648288874289885783),uint256(10323390760039212352130101123130684877619402642402028802075177951076976623873));
        vk.IC[8] = Pairing.G1Point(uint256(1027303422659846696912242269893657541697682577257523589802986497703543500661),uint256(8582200880849334623458904580788681208991576164004449098164948415166867615371));
        vk.IC[9] = Pairing.G1Point(uint256(11632706940302518588018355209186351263348675793221143127681873614105541155765),uint256(7622961793815032405249331066126999806887867716874811053641168217775677145470));
        vk.IC[10] = Pairing.G1Point(uint256(12167333190940118730282791643333996748161297975069998341998940219987318294328),uint256(370851738879971902187462251210521826533434564112345288338533922946338271377));
        vk.IC[11] = Pairing.G1Point(uint256(3100294242034282982861987886939476960776745097301613965111660720592058823492),uint256(3611283100900870096943290876305364038110905436363617770222141576199526527600));
        vk.IC[12] = Pairing.G1Point(uint256(635911861783094316204589451708429789137031890846788605298796486163794217650),uint256(19715484148786603938111629241357217872380016934290970375710397557554958608274));
        vk.IC[13] = Pairing.G1Point(uint256(9901100864871557322731076490443484708432696663731352973206661650545918407210),uint256(11958563327022057759384753567092846368666707245878957549402440188677056676503));
        vk.IC[14] = Pairing.G1Point(uint256(8220858421153882336998421713775967086625046789175082916541674156144949799540),uint256(7825731898291220963857226052263747768793326181086544116130561695068873849827));
        vk.IC[15] = Pairing.G1Point(uint256(10343444843060517624536257622728861577490892080992718999818083562544022903175),uint256(11133779402124092763156846614640867213986837219980424834913812656782826615555));
        vk.IC[16] = Pairing.G1Point(uint256(18976243638167911750519775822168439696622490070925999648040206288246366038335),uint256(14352220581821201732658906207208002375467087141064816686045695558488908504178));
        vk.IC[17] = Pairing.G1Point(uint256(6757098692371176275006118274223007544463340607318521961215347168650036360769),uint256(12134153122431243785273429995958683809435650541893008252433574873463449001155));
        vk.IC[18] = Pairing.G1Point(uint256(8347536483333005097437980595681196910097589063983521801432383029905078417649),uint256(1393577011683365487705347021315456747859888099260292916650486322839739839556));
        vk.IC[19] = Pairing.G1Point(uint256(7301218689655690091736512712916183654676007240459425373001087147116515672759),uint256(18680100201521891435503742432462922613156454085423910067682779555173003673350));
        vk.IC[20] = Pairing.G1Point(uint256(17177622740675786208761935309095599252224354031526941119516004017238198568861),uint256(14658791093600801328547814421419343935452608199621125083021821765858869026188));

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
