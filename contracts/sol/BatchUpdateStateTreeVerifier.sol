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
        vk.alfa1 = Pairing.G1Point(uint256(18044854903914947507331103474219944815093177230158485201369245289224445737499), uint256(15719024570342028090543992141294876757022679046860234994095963383335142997827));
        vk.beta2 = Pairing.G2Point([uint256(4708356054699187952139992623147974392950254428920096030154819338781156617977), uint256(9202048347466675266537889279862142939630179253143216288268703672865393386303)], [uint256(3683332772802410808690573772908085167455324089030152769759284201405017534671), uint256(5902998678823471880866805728249578510586801865257052544015597088483137763491)]);
        vk.gamma2 = Pairing.G2Point([uint256(1278695127949367397618288454865047285378614624451438519020082619706522706324), uint256(21216972103352756417071566835327399051400157117503129987622660326466840111229)], [uint256(11441870126793802554806771402838522659969943722717452433337177651841666224206), uint256(15283761599107063775262810843014725524111305746640781588483994908405585051435)]);
        vk.delta2 = Pairing.G2Point([uint256(11485756489427920225814693946287863028994532758473973917969318572033300055501), uint256(9779708454455050030824274345282227654406554664206588518840133164668646218762)], [uint256(20238918966549524131836896110694976939301486315963482602948423960952386717992), uint256(13954514885790846582959197053485713024669982337012289091945522987706146989276)]);
        vk.IC[0] = Pairing.G1Point(uint256(223711999655271851511360930692995548414482748782736054137340782322404652044), uint256(3112950070156147929105962230602194883651263613505299222034179964431669114380));
        vk.IC[1] = Pairing.G1Point(uint256(4218032013264241333346740401845383981916435402688711569788671537515409836770), uint256(10843741065670886430903092099008632824930027915384154726841963935982136942794));
        vk.IC[2] = Pairing.G1Point(uint256(10711707132370364382860962873504879232825449230680232799208315698552600032875), uint256(893313968910253656875413865840799142950709634752827011955172439581554748797));
        vk.IC[3] = Pairing.G1Point(uint256(21214475950914411702694454933448489829169900927564357669778321557794170889550), uint256(2350924779806744077814808473471609418442697003230467872531625893579374004522));
        vk.IC[4] = Pairing.G1Point(uint256(5426693841314066349539311334494862197769191120825019329907078786040587955922), uint256(17639310143472233813582679710983831838676783489431917328543543005939814579162));
        vk.IC[5] = Pairing.G1Point(uint256(7062354899544828486583861707480698450320178588515753018052991264003957447733), uint256(12215659842100851644172616788800185638617644362085256269865301166568220341954));
        vk.IC[6] = Pairing.G1Point(uint256(13603583104644958130543524519064436952727088652923142264899464186637656679713), uint256(10054819923449485868879555424678606493074562418727124182042337799977560644371));
        vk.IC[7] = Pairing.G1Point(uint256(5449165997893703512084281425634528772071328494074140522974963727517842191319), uint256(12091157693897101538359197374173262455107261251381848434438653343824650946808));
        vk.IC[8] = Pairing.G1Point(uint256(8157801331843779239361271794112965081324703237709561140739222583620816246420), uint256(10560573432489294650156586912768965133125388815153331666068805896310116498116));
        vk.IC[9] = Pairing.G1Point(uint256(5523999417982493913451570477361736577197760500062762964203788695728727691635), uint256(1234934350419069325304131543477823200375022776212402250322628180211267386124));
        vk.IC[10] = Pairing.G1Point(uint256(5866189410518553375090938562774660193633788004940998757396934771461195082313), uint256(19195718859403348937078566267492161282140543466965592629312138394718831207721));
        vk.IC[11] = Pairing.G1Point(uint256(11689109429791560161726974444392562006847131650521331806971064266364954122672), uint256(5349887998204236284106577162081862651561745149376635643705151745154095236207));
        vk.IC[12] = Pairing.G1Point(uint256(3985370353442153190227815564896388124332592557003738150859769938420663530622), uint256(18697486810067672358268514216240538864507214017068024451083133254431131973042));
        vk.IC[13] = Pairing.G1Point(uint256(3096102513108934930246825974765829597896625190230150302205090994533996538282), uint256(11029465101438637815333776708651907462051164091603720745762418549441453343744));
        vk.IC[14] = Pairing.G1Point(uint256(7307090967932276633995971946659846474197780541565572042992239993496910818428), uint256(1090617266507877791667104690981381504827297492051061232456779412677383241069));
        vk.IC[15] = Pairing.G1Point(uint256(6648760385877708060680919865291259822377045121685039518447012843632750862285), uint256(16663700647941629085495261821019700735236785459876879075512010977157227937789));
        vk.IC[16] = Pairing.G1Point(uint256(19337273866058063573683720818313758876953816753284695327057735272933560500565), uint256(16323709984866496870596336766928150031935267395602150155298075229879901344462));
        vk.IC[17] = Pairing.G1Point(uint256(17649554782047635867078870634620918092659727652658209778001547706408774197801), uint256(741153958941028571742989570628044934674189346159649102324182451148020292729));
        vk.IC[18] = Pairing.G1Point(uint256(18527456880047827047286592843453743495871137251243342869282504951159927727741), uint256(15275504160672385591154995276853963919993144879853215929986108520223826321164));
        vk.IC[19] = Pairing.G1Point(uint256(11668295298055998742933926973592216470573390952723155792706351120767209653457), uint256(15917333188684652992397284292764340999119542005847818457367864990916539730592));
        vk.IC[20] = Pairing.G1Point(uint256(14886361660322279965125698221590226846627885828059040883810131804495175338947), uint256(1398896433188967606160516611023461146840833945708518027357867767906659608252));

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
