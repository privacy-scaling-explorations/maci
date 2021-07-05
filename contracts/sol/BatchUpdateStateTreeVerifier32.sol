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

contract BatchUpdateStateTreeVerifier32 {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[25] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(2235937757258328332581655207316854914340553041478756749021922386043254497665),uint256(11720695076632845600035435519386961195137050119051159881119328470568375901061));
        vk.beta2 = Pairing.G2Point([uint256(18103312586997372723464065125468726628197103937398148351874079500906002078514),uint256(3521241463040229090496972414283999306378042701894409495991649947043913050390)], [uint256(19929222577579677319710308208655935830382430571925744018028233535451768572526),uint256(2713488580683808567223254461296987686393416756219077378633699157752784449871)]);
        vk.gamma2 = Pairing.G2Point([uint256(18540033106735871504246221953284252727449583113344978088798752551559197497443),uint256(11804507394712288367663827325809152799963322749311995594214433375808748914215)], [uint256(7823444017721090114052934461767123920657200397414318893992672133734334584881),uint256(381539947305595214533183072009982233806337443107151710535066901935181836650)]);
        vk.delta2 = Pairing.G2Point([uint256(13777830633300304139191093890421583212822007120835768179730867378433207369904),uint256(5829308442558755354882021024059658392511579302722950339672751965830178369479)], [uint256(3247971301408566159364701679393539201504071675477219748559808130461833317206),uint256(20333401927295807868473825746451131502855146064139046665350946639946989255290)]);
        vk.IC[0] = Pairing.G1Point(uint256(12695296843741290243689381493557344935288860265047293012366283732179354585998),uint256(8756234222257929396036211927997035681483199097361823776457523938231702657637));
        vk.IC[1] = Pairing.G1Point(uint256(19427060885837198291358374320196723084935525206551352881413292228008641375494),uint256(17830025099056800507919694199083128206588010134164569106894828438761905032458));
        vk.IC[2] = Pairing.G1Point(uint256(410478146407936532689270128315003070671881564424239715170777648878967168005),uint256(19810008246942770361558893286482792592821114623562524395734095279442205700805));
        vk.IC[3] = Pairing.G1Point(uint256(16927932954172000562734191935150272341340300065159146447389567055435697197896),uint256(7080985430376548388712273850247201104283444559574087251008037877021942324388));
        vk.IC[4] = Pairing.G1Point(uint256(16230357772827331182078389034367129255766008017458394951654453835970997773946),uint256(14390597016939564779231872532412964300980781945004466358993998728674970309401));
        vk.IC[5] = Pairing.G1Point(uint256(13714106385150866732996352043897273245837658980446605229373226331378168393032),uint256(486150390705720151962722842770974288776559483789878327517085343215375560197));
        vk.IC[6] = Pairing.G1Point(uint256(17768923331894319515675582767948565732688231025317939555708699614152398211686),uint256(8499610897814284712396152304339583329559266108913886418999627219565622002315));
        vk.IC[7] = Pairing.G1Point(uint256(14415647971716124875365599377021987010020281756838687529386783498764570820512),uint256(14613451060692886380252911494947779806626467670508276424823896732115700932878));
        vk.IC[8] = Pairing.G1Point(uint256(16764983637282451325253712526116676245825038387105887732952918407603662725617),uint256(1352524463256846201723591130214587605935782520895303289524343032854923110908));
        vk.IC[9] = Pairing.G1Point(uint256(10056087566202527332631589268663832673613483884145297923102443097932637361605),uint256(16730779773798332173061611611644870364986949778018646363117835815193258915616));
        vk.IC[10] = Pairing.G1Point(uint256(13290900503321714658935311585568872029990198888697506684512806338887123938831),uint256(8114386552118049168577883416679077864672808493670718294274215610717572843963));
        vk.IC[11] = Pairing.G1Point(uint256(7782896038733621968832942200150060348729169883217332185424996914395075738032),uint256(20682377337106534901146812854074383535826740744181459358117072396602346484606));
        vk.IC[12] = Pairing.G1Point(uint256(617901749705332346513537208464626960953097676177271170612675508795831094045),uint256(16186736174707113904460258035003488129644568973675010912669231698078479023222));
        vk.IC[13] = Pairing.G1Point(uint256(14477430187013369520618676362674934644081527218666492121095639975702523047093),uint256(13914336563460888476578316933419114155531706131840740221252768233483396324368));
        vk.IC[14] = Pairing.G1Point(uint256(5924187723811910208644055167942297972031087776772786313548743929893285133800),uint256(16361662290370920310451572623845118040008422660307051722847580146457871736989));
        vk.IC[15] = Pairing.G1Point(uint256(17090166758717550052215882897464335068092945362735421722892605678597646540057),uint256(16398300913997240579023943771253062149083261407674822502769328439978123578689));
        vk.IC[16] = Pairing.G1Point(uint256(7574674900722229272749996430153170469828315370484171764654649633984135615279),uint256(5069496413177806803124281195026969110815809700378025228167702995573586665836));
        vk.IC[17] = Pairing.G1Point(uint256(10441721171682792688941253005732564080622492912137608063443699246450315451923),uint256(15398991661933253947425996624904544110556542286879829919064231912826539570526));
        vk.IC[18] = Pairing.G1Point(uint256(17674413698382420009917026819492643888193304168981044450949863673048991538414),uint256(9527495908817414334530454481572961657315487660716656106473790248118706961070));
        vk.IC[19] = Pairing.G1Point(uint256(1305107076420532159069082995140140252760452422131801890994478405555848637105),uint256(20641138567711443797973886773618825716028720528130685248162815978012474008318));
        vk.IC[20] = Pairing.G1Point(uint256(20823282309713566159682969445806802229330524100205102112933548669175660181229),uint256(1585818072534898485010386083641472744958777764688589865815398129584392257276));
        vk.IC[21] = Pairing.G1Point(uint256(8602838104248160338689652217659749853668007141927006509298162439781733248626),uint256(3031659185416842164642200249451988498992828231012099148797461669175568452385));
        vk.IC[22] = Pairing.G1Point(uint256(15062697778545981716015498304594399446175287977109202577788056450289044074530),uint256(14595426536584631660528478734922855298873285152019524939752258039412967085035));
        vk.IC[23] = Pairing.G1Point(uint256(9203110864527021095159434212260506563713459019946440113668834753150698387275),uint256(6633831390080912793725673980685906970380191858784131579135247042888943087524));
        vk.IC[24] = Pairing.G1Point(uint256(9703769305917897594120374760147891009572024854624222123846683638776025013089),uint256(16754141899540658922386431411326524911697563540800148668488844811424060636134));

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
        for (uint256 i = 0; i < 24; i++) {
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
