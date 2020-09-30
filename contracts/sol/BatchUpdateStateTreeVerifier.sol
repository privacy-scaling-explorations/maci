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
        vk.alpha1 = Pairing.G1Point(uint256(21304887071706747727554426407623494931901803654326731888597936731909854637694),uint256(20817882958300721688471843406893399660502901870650160090710667276123392616566));
        vk.beta2 = Pairing.G2Point([uint256(11487764043771225954005235923509677465951799818583342593639555359581981404353),uint256(13621503967404508609904138223417811490502363954841657649611083622557581885488)], [uint256(2399587423693354562943375150295507292624662351377918775585793911515141981354),uint256(15788212865383190911432419340970787603951474899387623672037156655769407585545)]);
        vk.gamma2 = Pairing.G2Point([uint256(4906900937644985299419927749940693465338214494799773585106415452655155308959),uint256(16685080982143610772884226141397727408133813501724370745033902617167249971591)], [uint256(3786298166173653931432825851621779144135798765797866034559818089820822491936),uint256(16238689271903484601838488516965636766730257033568435458215592163288902431930)]);
        vk.delta2 = Pairing.G2Point([uint256(7984893675224605014562489601203517077628278947764103906641462732810616710717),uint256(18025183503854860437234817348738331478782683706031701906006938482303826059501)], [uint256(8137412290263564171370665249985683810296940742823906287865182460439031597489),uint256(12802723186890272585022716872571332427016623192509752768561817180041629581814)]);
        vk.IC[0] = Pairing.G1Point(uint256(16077375504283504185719871242392004913582040053114049601330153540987492606113),uint256(10642416265883146578710091873569085687271891565570998055579010767489001904585));
        vk.IC[1] = Pairing.G1Point(uint256(738283103566950487426330825581451654788944385040277559249404144372781421421),uint256(7367284495585405098443136713940334453645860906215868843250147571343693855845));
        vk.IC[2] = Pairing.G1Point(uint256(7536494693623120120240047316137489667690926881013032395895357011686994771706),uint256(18870142467325101717987151446567412481214353978574874635285544733115702996132));
        vk.IC[3] = Pairing.G1Point(uint256(12392378146515696616862307628938163107416211134318052514196469598070637991916),uint256(12836338552004892251709151950937750794381476507189011222144630765587506719041));
        vk.IC[4] = Pairing.G1Point(uint256(6217040722151531855841239678803343735083542047138908842412591383455282284213),uint256(6381666165464576277394295743366022373049175395028883987298634523896292309828));
        vk.IC[5] = Pairing.G1Point(uint256(12856651906357065761418679026875792872950791334730427694582654808802069105073),uint256(18242429697225429548113810726115653127228345187943914358824992668931443296769));
        vk.IC[6] = Pairing.G1Point(uint256(19104979411129438406214751197400519665140824093657537280670955395888223681994),uint256(7176406734889725497689884249453593746052212118340918376835713622429332548791));
        vk.IC[7] = Pairing.G1Point(uint256(6610741997172033533302200251927904852565344836089211802539294436899764220215),uint256(18731357272137505896161019086050231894874344769054407862787859522284179720691));
        vk.IC[8] = Pairing.G1Point(uint256(15674038674528086552108311140912392343457106160874305660206590810956735967486),uint256(10412487810431668266435096633580288492857638083870703774080874078958011078985));
        vk.IC[9] = Pairing.G1Point(uint256(6078246255229867366483384385369607328711446034929610335849480137846640572030),uint256(3465458101635908784758482925175770028448365822362392833911221054413389503629));
        vk.IC[10] = Pairing.G1Point(uint256(6473539783552741939995489950681496577702707908668585607229690085337860562045),uint256(10620291525269326148082067226795309490888523927246377820804806501850790020422));
        vk.IC[11] = Pairing.G1Point(uint256(6154517075040865961932147634257013664932063428465687651177950966041677515333),uint256(13022086613810497316850903416528432577082809474049296485429736570371738341161));
        vk.IC[12] = Pairing.G1Point(uint256(17470874784479437453374213682221090414102230553907904557479097731491942215454),uint256(11384557056607302721415699968050964125277482512901487993069735329073421606405));
        vk.IC[13] = Pairing.G1Point(uint256(10605063870896764458418630694202031937354138297415049644377907499221958778394),uint256(20236315126325673200667387896426844236240900464553043059702181725195185815985));
        vk.IC[14] = Pairing.G1Point(uint256(4655643370699539052846132443195467469461886717590254502224880030850292146637),uint256(10919401390998534182859064794593507229253860608705967401840131777892530099005));
        vk.IC[15] = Pairing.G1Point(uint256(12376598735344531117937185910769641949452401799727776729871300856570656594429),uint256(19418402510558722582179489194764007850502948977010794431668420749271830191855));
        vk.IC[16] = Pairing.G1Point(uint256(6173841796332208284608802516771381085732030634810527415438451799379124045158),uint256(9488690778254944140690790809585577076641313957922750682551175933482643047202));
        vk.IC[17] = Pairing.G1Point(uint256(14217836161160087963676559484348775321951485996176371872323841509220196192492),uint256(5161144986519580541278902176828607616102408168542417131419866953198746058894));
        vk.IC[18] = Pairing.G1Point(uint256(17030984429638550718177464181214732103116456703570269219789514539868238959937),uint256(19398482705458454000912987174949972712029877469494063687985328035201555897731));
        vk.IC[19] = Pairing.G1Point(uint256(4781543332346812010010465528597228359373771623623599385864634727772355835488),uint256(3169542087528362227618535263953295173640467386849084771360340571089630466955));
        vk.IC[20] = Pairing.G1Point(uint256(7049105212190135909308118964948684823777966827425821131250674388463582116731),uint256(13487379511116368412733060920865241694357668765589005422906656445782663921895));

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
