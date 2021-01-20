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
        vk.alpha1 = Pairing.G1Point(uint256(18159784179384520227582283233576603708224635828566269276573654355937017708401),uint256(9967002368807989898766579312101897446308042551106319986213389431103950992909));
        vk.beta2 = Pairing.G2Point([uint256(6148679757347015058230242012929713087342591106624782337400551542711510530292),uint256(8162885332613960039181752813989272411129860291212463780053792638475028338451)], [uint256(6657187636898315891001668968916829962890426675190175218751237093000951921516),uint256(7708348212939067881636515925502532619033021131574083150046801141908195319200)]);
        vk.gamma2 = Pairing.G2Point([uint256(7877086678392765820200090356293713095626013143395578153673038427793900618231),uint256(5246836547718904059520302820127872221756461514781035270385093122457600754715)], [uint256(19768098606295883553192535001651082922622936468177047943441544409055031443232),uint256(7726894025955631673002815989050163912586962346975782025201665625240843749092)]);
        vk.delta2 = Pairing.G2Point([uint256(16187002004971451044818360104081702564135030074427081263650342572086537509349),uint256(8629745675519430305846450741170423816717024044385875257003414871937758208374)], [uint256(10190334767206385721120472669793950701017472813519144688042853515190049834927),uint256(10787010136321474939930241411582762963241131169568685538813423438680945507587)]);
        vk.IC[0] = Pairing.G1Point(uint256(6194758618265341215006722774732912859084811793469720043962468635397631729480),uint256(11274978309034158606165390461511331489939317632507665588160888749419892831243));
        vk.IC[1] = Pairing.G1Point(uint256(2477474093484839406038313946170549132297253281655155722772829242194582471560),uint256(11282842779617685443124825044879035909372228243922925514242647518496060622068));
        vk.IC[2] = Pairing.G1Point(uint256(8562272337701477652853023665856509704218662779752039935997629802702926612309),uint256(12163671731617944284550339812744090990633468594628778215927751417042865542684));
        vk.IC[3] = Pairing.G1Point(uint256(10986109686870484108497367395554932284603867736409600042383816335369180313102),uint256(15514382796101448509916664469541430562747272540718980728444530079843530980056));
        vk.IC[4] = Pairing.G1Point(uint256(5743541071422998343686985176041998534467524287699636591970420107405602176399),uint256(10022424803123857862980615416865793269866131504088420137461071825003478470895));
        vk.IC[5] = Pairing.G1Point(uint256(7931212514135046899816836186004760875674270705932024159650234399203131874187),uint256(1395338164781180062362581329411382528925692829424173244143737787659304646287));
        vk.IC[6] = Pairing.G1Point(uint256(1846386381327902771606040574570726213034511424476319026659512324886360762813),uint256(3616026252037174854542427039241715800280750056918935347114179285173492924097));
        vk.IC[7] = Pairing.G1Point(uint256(3086249323009171441046254016324381077041536522714250347201337106800339702491),uint256(21487052599157989094338015762723245498897003795424431085979934458373998263858));
        vk.IC[8] = Pairing.G1Point(uint256(3590496596988516347114858753246161851071503572403493712824756595665808209209),uint256(13899057557568199936219069828741046841333770930564542027864217713502255602577));
        vk.IC[9] = Pairing.G1Point(uint256(18583178868812927397659608524556945064610068911822468591100142617593668979025),uint256(5587042517004042485416995186210934379690404105514951070714474598953575371535));
        vk.IC[10] = Pairing.G1Point(uint256(14367464758172798106900566137556974703020859082140958003129831605221019638886),uint256(949405519498581840908409938925804196415815520067907535455508581128563769288));
        vk.IC[11] = Pairing.G1Point(uint256(4299825007748608669749753248548161175886334453295215395126448983352877205892),uint256(9997427872411480902565582762376095043231047116784365286954485534313091041160));
        vk.IC[12] = Pairing.G1Point(uint256(9457679165940110748203612136423415647182056394451771342626824851383038220696),uint256(2537878466420034446759389977964812884999665603486136550581763412867780985249));
        vk.IC[13] = Pairing.G1Point(uint256(5116479020059672430709536643165382403545482516823117548706156505531216049169),uint256(12763008077515176735448772504744436659316959130928840747896757638255711763735));
        vk.IC[14] = Pairing.G1Point(uint256(12916343928861650986343499980615198683047644171859767977531334665323970155543),uint256(14462218353350330166315653455053395640055685756501613709377799918947822680089));
        vk.IC[15] = Pairing.G1Point(uint256(12198535782697234146727514725072584334593025734440196154822005974044832130066),uint256(1576971966344676954919773045696065824722365445632882329802797675860486447008));
        vk.IC[16] = Pairing.G1Point(uint256(3386992448144459829476553868081303077636418597503291701465744827057956665348),uint256(4116759022685348207069632632631933875838856419821174543152618902691933149676));
        vk.IC[17] = Pairing.G1Point(uint256(20542574867611727080128788277844842447349423412257166150829300535916109506193),uint256(14657790660535542976835111689881913512462370269360270964946829271040884297914));
        vk.IC[18] = Pairing.G1Point(uint256(11311129814109315628305962450017166148956090824070263247133288333876021847123),uint256(957821141813269555805997233945269518117584226978095305455183576034713433293));
        vk.IC[19] = Pairing.G1Point(uint256(2307064307306719273421901593026293824331870734744948839038124012116309731898),uint256(6763174863223151197785353459346399596160633875746603112497252469725829677613));
        vk.IC[20] = Pairing.G1Point(uint256(584186631015425174695719504115227820282622075373538013407236269213577035422),uint256(11466699833656997042071117716066573811205873240226430819500966893413452593666));

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
