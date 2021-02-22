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
        vk.alpha1 = Pairing.G1Point(uint256(3157381668012629002546669003904611603770627176858483418373570726565333167830),uint256(18771449715812687758266611491120448694413529419835909454114534463672829505557));
        vk.beta2 = Pairing.G2Point([uint256(2757339028894548226562721034371847529007452411389492148749222339340768433616),uint256(1782313832487272775975216763104435707001640970349765283968416486351840682990)], [uint256(10091546535777553672626199043685314284874207773875686850540956043921261968255),uint256(2191656190359714751905171194337482684001499656619781387403957810234920155812)]);
        vk.gamma2 = Pairing.G2Point([uint256(1857355585383518088259171963111918200858078770222076118710477960292619625900),uint256(9049398110855988609930733099760786599148619682178912620967292053603614472254)], [uint256(17503074761219958427843576188909471682674818204605266079158907507542847363005),uint256(6334502290128562612408967156958298475994984984731743119969812783647399247801)]);
        vk.delta2 = Pairing.G2Point([uint256(2020999266603221682861957539344095963761755216530453625417000334321667283814),uint256(5321804173373645594912703517112251920238916551842378232446327368903428308853)], [uint256(294411380118451853943275189180880797107059180683779722549629731635199721359),uint256(20590908436963585770308041161377865829878014927866007853379323133227863168995)]);
        vk.IC[0] = Pairing.G1Point(uint256(8731089659035052010055798480255316037346586085156984155404253618106715961953),uint256(21737191117648672535329385562420255819216005375942621097007267851177667401653));
        vk.IC[1] = Pairing.G1Point(uint256(15358251400652728479939600823051084322578865821534511398586662071082191249964),uint256(5910986726191050324637577754684047947962790567801963889811775299151909512144));
        vk.IC[2] = Pairing.G1Point(uint256(20223451387748131710174525375949250979470069581920042191984284671034524056498),uint256(17747877442467204583556728188989125028695820697065611519899463444458164083729));
        vk.IC[3] = Pairing.G1Point(uint256(11514869344159037308776243385546926132541727082451582913630101102726484643477),uint256(18552475356445754296518600289267898835240957107086462364363732219489272426963));
        vk.IC[4] = Pairing.G1Point(uint256(4511775788194988153834834877615151987917115687949606469170568668599365799496),uint256(14481696839034925319580359395715694348777179675221242297207735822217128287331));
        vk.IC[5] = Pairing.G1Point(uint256(1232400705860681836028243296199681344216115992115087279406621711620299639159),uint256(16015091050525169332507327288823629022551591843923687575940355324747170577947));
        vk.IC[6] = Pairing.G1Point(uint256(10638894850478919245421712409084948996311055413338232201176809389875874697867),uint256(5854012476933701215042024117954173569226516873046569805499149698783581621333));
        vk.IC[7] = Pairing.G1Point(uint256(3645267893219118758110251179846107480214023009031754851139902242259833676925),uint256(8520200581854660634993426844090399409929426812950618558526377552592441131331));
        vk.IC[8] = Pairing.G1Point(uint256(3724566672801675769227508759571762518934677921861692820574391307618488666988),uint256(10748287300586794770327622402918100229305586030987384904798918224543627807530));
        vk.IC[9] = Pairing.G1Point(uint256(6220951196917603629540827657495503361366994864367663929557980271397437341638),uint256(2733162839982162557567263966596064681876099687059653341601822675082817771738));
        vk.IC[10] = Pairing.G1Point(uint256(12981230912188027709681822213626057586455441258029518340315686699241040568371),uint256(19899329257924321560889896111556968858665480147572482733018547332867051250782));
        vk.IC[11] = Pairing.G1Point(uint256(15498866599657413129343885812131048818928144142692743274302182738790973441028),uint256(16635524321183712867950703869547097050382732416761781279416809916981478144159));
        vk.IC[12] = Pairing.G1Point(uint256(17227488078017669480943867846515008001572620134033889628650415863801958106343),uint256(1102774016990013308837878786587662996314575226465328221710767248399143079010));
        vk.IC[13] = Pairing.G1Point(uint256(5401252297062936808731976785809819785565358089669882766562410540995445250502),uint256(5059515752500562396043980829371215771224361971576677559260997252059146626804));
        vk.IC[14] = Pairing.G1Point(uint256(5572532990806498005303013780229579088837579443304033792969278201768912381545),uint256(20491701307689875023764700720784519388976819412251686422655048297731250020426));
        vk.IC[15] = Pairing.G1Point(uint256(16300095182848845294753700143980666132122112244863466693183842172914658956516),uint256(7290632854476776080461069631870019054077943634010870577938667751743068483117));
        vk.IC[16] = Pairing.G1Point(uint256(2804437807317653486124754253756453422117031652957409322181656652807365394323),uint256(13324089397977245053484921872221773680859819367783105736561561109399607757326));
        vk.IC[17] = Pairing.G1Point(uint256(16288048804847722119366521146280962626328795482626385613297932469094582431426),uint256(19542881404426036638589335927998980253123006860719659511103328752588963634280));
        vk.IC[18] = Pairing.G1Point(uint256(8568697467824146901285895287618719355248179400177395309844726892964084873948),uint256(6254920426091966858570418778204807768114030958781316741717193411641921166803));
        vk.IC[19] = Pairing.G1Point(uint256(1442738656958574628117727821317670024257867618223127008105675480118477210875),uint256(6705185491808371672683595367453118674841224424431571087666763006365240558895));
        vk.IC[20] = Pairing.G1Point(uint256(21173984374315483479566947758950832156478909780301048485519447748842580991204),uint256(2020507239426335699637917258033043435140173846709664117338029562531423788042));

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
