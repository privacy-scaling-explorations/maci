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
        Pairing.G1Point[20] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(8529146058629467298389990580692187451950631992605850031874231895559036597835), uint256(3452452292301865783624335104942365081650621308496549799346127450750951320565));
        vk.beta2 = Pairing.G2Point([uint256(6958956685672698740018184190246395473113584520277974846412657663863884351421), uint256(9112839209300625921707834075112244589457332321476796697161204597831840850200)], [uint256(8676701173988214003005961648561828123277827935317803058181817891727521785916), uint256(13651800413387697336585221742591864033623317889220528814134405507629063912112)]);
        vk.gamma2 = Pairing.G2Point([uint256(8557523067524833160348506552524842101855889349181699254962276963446013376496), uint256(1770809957151258771912803771445337286852464927653917653385996505458704726974)], [uint256(20877912937230009718364820399366295491792143137093432132212290379620062852325), uint256(12264709483279281115216828595345420790896049340287347480555428217605815873299)]);
        vk.delta2 = Pairing.G2Point([uint256(19772717017748331860189892849120635616963950387931789979655052023333510910311), uint256(2266187924308757209147200424565907492290381628604410528191608341298392719927)], [uint256(290227978370661652293599980930363230302290661692292505018271843370356137704), uint256(381720376639922319868180161898013279396766908767835441746415301193103877855)]);
        vk.IC[0] = Pairing.G1Point(uint256(17025533601109676671919134922767089685282531031010253092114745989251080900895), uint256(8576594058728104791980571010028377303109512868729903829383777265031117892141));
        vk.IC[1] = Pairing.G1Point(uint256(4441114310846939426487887553215617891342392785457109090620568125263474693091), uint256(18654816534981400690471127921732713218926522889846518950643688624099864100273));
        vk.IC[2] = Pairing.G1Point(uint256(18607567173386280255784046610794556045640991151761837929128526863560023305616), uint256(17445877395274244936027985549870983626067346416287898095228296595540351774662));
        vk.IC[3] = Pairing.G1Point(uint256(21402643161065552005300182026759356243440600830984413969584289412376050678639), uint256(13387592431515231163889277828370801709565850980218954416311179077298142574779));
        vk.IC[4] = Pairing.G1Point(uint256(6488435532851104807224749254795305742957325487413169284554593965653820604227), uint256(17809372205899589016128296951165844750876003719085023689913932289009610915455));
        vk.IC[5] = Pairing.G1Point(uint256(100176326914654316569221516932657182427604561230924685270254334446147785748), uint256(10023750206766859649473549371612124301090758299474479299400856194879554525160));
        vk.IC[6] = Pairing.G1Point(uint256(2729958805937185670479051507637051804688722576256884429154036667432381786513), uint256(14169863792473333695563297340465367990602656779423281451032650465748592379261));
        vk.IC[7] = Pairing.G1Point(uint256(16463362123118874543561339440471868475887424592507817062123116593173221940705), uint256(448340825960123711052134382661114474819071557034613714195480184503372466494));
        vk.IC[8] = Pairing.G1Point(uint256(16828216024508715036148652190881009497054064065932530058978602254583204484804), uint256(3339291688494841065002846140845302278708983718325854066597602656976323603105));
        vk.IC[9] = Pairing.G1Point(uint256(7841277877723823130114567116565185859566742054813351400994760185227474942497), uint256(6567720770425028544900997712984609164666233594247487972533507643965479050368));
        vk.IC[10] = Pairing.G1Point(uint256(7027614561132106998138058407022482096238917470903667690802261769128347868060), uint256(3161399091014108711248261662693264542426527273127462781396396661714324463288));
        vk.IC[11] = Pairing.G1Point(uint256(12603471658238637713924278655127404249170641985602307449329877095405464406009), uint256(19573331020164836791429120330549847875139211032817817358188125950175438619651));
        vk.IC[12] = Pairing.G1Point(uint256(16617358140150923776449933772853596809083305622675232709470351392072286380899), uint256(18959255339803996925834999521498304464575773449422921651645446677027629051389));
        vk.IC[13] = Pairing.G1Point(uint256(982575278957386501682568635165302145335688498973949762512576982694118948529), uint256(1163661342176442056451287210258457194149158031634413207205439208126591163486));
        vk.IC[14] = Pairing.G1Point(uint256(2490411609193031829580691531756399408238273686506420241704769581316403965411), uint256(12858249659124388200442125250968368562826310680179015499232524511076810539356));
        vk.IC[15] = Pairing.G1Point(uint256(13564604991465218075156675749772242223101179838426487314003470770961239468796), uint256(15915267018456151294520541025797227292631865239156362281459742246419669124487));
        vk.IC[16] = Pairing.G1Point(uint256(5612239377649794307114244005551658091330736086855377834072977474195355144723), uint256(15281771385086615196358271096519486609332638459560562794344312137221967180339));
        vk.IC[17] = Pairing.G1Point(uint256(13683195030722847883487117094823129790620850732352890603502520403872379490538), uint256(21103993853472258571164244105706325156928844120716782905204907507041658030244));
        vk.IC[18] = Pairing.G1Point(uint256(18337950448423110571692283179427952435998721616999793647512575593327279301094), uint256(6988365060525640031129952311808499791070826892586944979927763317158859954300));
        vk.IC[19] = Pairing.G1Point(uint256(11090803408221346428271552221019471310201764065336257627073826268612236528148), uint256(19340294289910496373758221439349101441294401341654294291759971541710806583886));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[19] memory input
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
