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
        vk.alpha1 = Pairing.G1Point(uint256(9075212186784756856831717765962653235324820197689639341923299387158035291460),uint256(490399631584485940983867256707022349334426024841882762116786563361403826010));
        vk.beta2 = Pairing.G2Point([uint256(14540928419207854463011022737069075113992742976604421428139465392578839775372),uint256(18893805497306033848802173872506987185693227089385522148425728273330638790130)], [uint256(17940147611387986490058492057416826922688319190631173502867530755255598302645),uint256(4184356810038184117503201200044179554194048473762449345909940828765831639934)]);
        vk.gamma2 = Pairing.G2Point([uint256(17429538794839108607367451980818424506676497167484069470535853776170134799835),uint256(8084087538638558846254165901740710474326125220819229715906439606104884796909)], [uint256(9474465031472453744479291857129296778817167535120591772723522497362192586433),uint256(11005116802591406191167538271037656740030219814400686382803215805129220811346)]);
        vk.delta2 = Pairing.G2Point([uint256(20054087271957517908438937383662335572691438936220378746100950434374123073679),uint256(12544998435160747536658002421006606399401604199958691236468899657537052027573)], [uint256(11053424648770899517917831186786157659409688930552714274594069475523747510279),uint256(11455304556450026112284711891337237786340021047498887114280530045938380269218)]);
        vk.IC[0] = Pairing.G1Point(uint256(19725822488859245477856938776349341341614203969441597513443926144831220416070),uint256(11812167777315595041791302081472189664330693241822435823331375258044123785600));
        vk.IC[1] = Pairing.G1Point(uint256(19472495205110748214638833070999230158503601354614848230413468028971757069914),uint256(12570215264587374148963395656671661096010429370828039416153627800557821113707));
        vk.IC[2] = Pairing.G1Point(uint256(8981765742820594689917541649031308095565016058089699814613329955231979584415),uint256(21872395025427031921340273803349572678195418094248115202290020433987453323065));
        vk.IC[3] = Pairing.G1Point(uint256(2325293661194206504376757316023129042747575757072262579117771795808890742608),uint256(5151690994251801422391272733197103933197527509362588006918991500663074943416));
        vk.IC[4] = Pairing.G1Point(uint256(18174382325889780959666113325436422405416090241006274016328067595692062258759),uint256(2344673858639561696300428441192718688797401639035091497653730557146066018532));
        vk.IC[5] = Pairing.G1Point(uint256(9904593736172495947060886718866318990072748495642450820784052146291630626439),uint256(12481586330843639600384922621501497867642713628194117097983170584615319212541));
        vk.IC[6] = Pairing.G1Point(uint256(4825137042015100157582192395151222314691366187262271309981600445066175630770),uint256(15485052458433146656109092740545800188729208390796037023798961175390572699683));
        vk.IC[7] = Pairing.G1Point(uint256(19490268105008156488334630296612843485845613317617704455272572274455893577467),uint256(6747932036738505855617679755892947901889497830788470665238325131003360845257));
        vk.IC[8] = Pairing.G1Point(uint256(4650172856836045881034257634012754885884624994508470538283517214704613845414),uint256(10939460867467453329026008861775567488541416087258953701135490110076937783958));
        vk.IC[9] = Pairing.G1Point(uint256(4904170080184814522004407947204251727640976477792634061439007919542372709758),uint256(16195194103742946827969398392194654060008685274323363243070837653500353646895));
        vk.IC[10] = Pairing.G1Point(uint256(20042018668446038127307648525627765443308636527320546185214295662326831754654),uint256(5488586111938112107835694642393056121112845462244098859617638283364584773813));
        vk.IC[11] = Pairing.G1Point(uint256(14219500723814757439858760695790014805181405977970717672080737714929715049438),uint256(11841085280514289698338149286765349139051856988135156963117225820221915997153));
        vk.IC[12] = Pairing.G1Point(uint256(11672919976093358720038774889336079049793969006652962028447252573540664995139),uint256(13180519752126177124854399186374189619266862648936223573648415632406909479770));
        vk.IC[13] = Pairing.G1Point(uint256(2846528020714767560715876844582451574518595425597879550943367772283362364039),uint256(12322711475936804704864646429150562311366485705024659370118203009486761383807));
        vk.IC[14] = Pairing.G1Point(uint256(19140082772077912730145647320206162354215337815701189986902587800178137132290),uint256(8414672277511047986734650655634385559836439906772279479605503761258951030178));
        vk.IC[15] = Pairing.G1Point(uint256(21349968512396518799352228517289947510251430637889141817735268819610790760088),uint256(1369111289062149468574801679364506399735646882799205586421234008736446457195));
        vk.IC[16] = Pairing.G1Point(uint256(7500741428348404875190429289443288992231883210309606398236994855232980728616),uint256(1908424181549148567323804742769367292967843696225000729279329277855706143985));
        vk.IC[17] = Pairing.G1Point(uint256(15706775483834865439178300793718799710829706457303910145617007575934755822653),uint256(3821121505649285830789622095665199496329991370781949706505144574531508183575));
        vk.IC[18] = Pairing.G1Point(uint256(1722111803008453470748505177158324992128848206048662805531249237196051189749),uint256(21092417304436770064259734227437721985035321054165542877222960240667811576613));
        vk.IC[19] = Pairing.G1Point(uint256(16474690410673570096002611071122227712248873480053203864518506178383989510264),uint256(158707317115684202272803935651394985931310654922440776012183263372619519383));
        vk.IC[20] = Pairing.G1Point(uint256(20538005004160271470599584676514227795824542240706093626480274792186377311545),uint256(18398234033445960948902541768084879019697781740207595466400338218969926574236));

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
