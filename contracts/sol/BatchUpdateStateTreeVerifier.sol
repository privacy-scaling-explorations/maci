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
        vk.alpha1 = Pairing.G1Point(uint256(12885979057026071345926381061044781078658421638225472126670016132891682152191),uint256(2069194521230962667827709116320226435937086312445311279117711442519900789626));
        vk.beta2 = Pairing.G2Point([uint256(18593515293963998555291258257629320574679855548657257628748683109639641212938),uint256(7138431357562636620177428858840750438442701899250647168221685168698620706590)], [uint256(15338378662423113735944210203359727672497681017226001355759382110365572378025),uint256(11765540717863319588460136153243817531008114410236543038181445372496051002095)]);
        vk.gamma2 = Pairing.G2Point([uint256(13501719646218449823219649956115641435173279011563424566126253511516244908716),uint256(11417506180492594046056624419010337747034283832898897535903908054019419801556)], [uint256(17136968988976012063477745953059453083736924777596493158192487015324361705878),uint256(20010835131669213673058338651576009228217972282689820297554110264030990160516)]);
        vk.delta2 = Pairing.G2Point([uint256(21168808953367153947295001536759330814563615445328633210496614524534644442870),uint256(19760618482615407884348562683134432478860499892808144691246444916809184848593)], [uint256(19785639480290710761652063014826947275464395335181873087051681101516840253000),uint256(17679794124612694680950305840071723283794503470497148022762273330980899539754)]);
        vk.IC[0] = Pairing.G1Point(uint256(3088186229787144068315120310028658995082241395909561928168623870219409083516),uint256(3160323481433516922860639447275901152625479738099617283967915729598944630679));
        vk.IC[1] = Pairing.G1Point(uint256(3506340682865236906219519299723875901336302663342173029312757022905878138081),uint256(3145167311992588868935161851757045800408053305058561114318196883137668947017));
        vk.IC[2] = Pairing.G1Point(uint256(519900352237485915067368438487834308728480681901502683903175761718345717913),uint256(11885505181192606042374509950708919513879743011047780824722780197172694322571));
        vk.IC[3] = Pairing.G1Point(uint256(10576091600369632844597963717994303762425789495252667871609151330755962198578),uint256(13469014215067159381351076249881714735595855467846037544717393919921415087610));
        vk.IC[4] = Pairing.G1Point(uint256(11514029508058790947657978373035436358810995894348821975425963653142294992947),uint256(19986401183019460562792130699199981242218833960764748329352181084496001295239));
        vk.IC[5] = Pairing.G1Point(uint256(14637071266900265350052211370100296040081931904572480676385466596555592668537),uint256(6629403024463934736928029545636253855300570756851441460893413797855244744566));
        vk.IC[6] = Pairing.G1Point(uint256(4893521235605798075017537437558720153396522640627821870210190361706888871836),uint256(20118832745840955190024435632591195121695886544490379879432801130515314576203));
        vk.IC[7] = Pairing.G1Point(uint256(12118386926935087269250692271644249293743970431634760475289122835942871873601),uint256(14836776241358130872513931639102807984477523347412432781279758872055473296632));
        vk.IC[8] = Pairing.G1Point(uint256(11553278338075545038905864830762546611331033427728930463073005353986192600110),uint256(11253896700370523625485195721408073394029835730627677184525215363699575450777));
        vk.IC[9] = Pairing.G1Point(uint256(4696156648515979247442214922088528878607751351476572901061560770089966549423),uint256(15774117982156867550939530698071192912928597629922142199607205232973719618487));
        vk.IC[10] = Pairing.G1Point(uint256(18270826086483708420011067103198619206433379848193315807355701719034084173873),uint256(17591447855419060575383805530342869429972556032732015096459065645521395166455));
        vk.IC[11] = Pairing.G1Point(uint256(839968231110823530185035677171784621998683184593073348444824000184836628087),uint256(16328739040688111590552656057316982364901249035008523450542047835562532005138));
        vk.IC[12] = Pairing.G1Point(uint256(15092342091221845345110811563742487312639744678405929128422544709554345210174),uint256(15748774681578895898771308509929475103620766388354016751780966328204804582170));
        vk.IC[13] = Pairing.G1Point(uint256(16684851313429059463533388546736288013533068439800236936998525553450556299036),uint256(299004159282882876184451703927077452887909638151431393428246837991211387917));
        vk.IC[14] = Pairing.G1Point(uint256(12498466069310893608006705100909168358902008421702988331567814479581557662880),uint256(20341719314796900526209289265005966728101121178247644705545966763359372681791));
        vk.IC[15] = Pairing.G1Point(uint256(5493043016300212479748473143395712052153269507552623652915667311421660178251),uint256(12418637511323676383200378131972485608356964322279006762256489560878582850133));
        vk.IC[16] = Pairing.G1Point(uint256(18196641001654017849730183229846560863613370825268145247193091060285310202749),uint256(21432145022265569788901121682864408684667183472161860798737300910301178791557));
        vk.IC[17] = Pairing.G1Point(uint256(1351867074471929412853839288596832236853121480729901864476286449020483784630),uint256(8259303488459323720114932768564719219011908670598275999434206253520719927139));
        vk.IC[18] = Pairing.G1Point(uint256(4484850860857336678444481024330838871351586464240758267800236335875303584200),uint256(18919480470264905210551215829385833548957792887715853504559697648904893444936));
        vk.IC[19] = Pairing.G1Point(uint256(17917356296394672575277579268981823178915864206138793305979157754869949537073),uint256(16728332718959218831228081535154144844882855601509798885073617675196153264420));
        vk.IC[20] = Pairing.G1Point(uint256(17619767213179018698575105960229522057140095098116448046115393453280963608026),uint256(4568523155031232181327213483267004437549834814871955680654925989264814176508));

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
