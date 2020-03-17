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
        vk.alfa1 = Pairing.G1Point(uint256(2380282547505881740087846658195044937957155382772741904744909366953466049482), uint256(12773395784735727217525505573373331540092187658943150795478781425366997411867));
        vk.beta2 = Pairing.G2Point([uint256(19606577353092774440532633640604029597338951913847775075707011069932728934986), uint256(14287200385795559247264430777185591798957335252867074728158101835179958062384)], [uint256(19856997572561363039484564840352738568235726761820987721361349635776141319735), uint256(8844021990974085920568353020046809274952244556270001352600560513911409611074)]);
        vk.gamma2 = Pairing.G2Point([uint256(14209465580574705601626934205887308447693686864133208275129012766729876581292), uint256(995949456074733253082919893090620027075852889227537061076830424183026077360)], [uint256(702259616885145815956023338628725566810331370610145532742481851932221759928), uint256(19033811840099296224000509909408161616393022843041881234191009624585034786165)]);
        vk.delta2 = Pairing.G2Point([uint256(18121325090202583969070459223017288507408808536611270880469608357738282430396), uint256(12481615672656929305650242282703738578418749689362443714864743569220145114165)], [uint256(14885340148530871501613775620968644997562149791981023293244922252165945497505), uint256(21253263899236408036072294949820724586033706826161321107461707824041362051011)]);
        vk.IC[0] = Pairing.G1Point(uint256(2588261395786377133476870838347249697590866581415723270663309819454150456602), uint256(9511208119222160392972697965756166362159996688121845454483437450588386091199));
        vk.IC[1] = Pairing.G1Point(uint256(4803930794194742162776379757887517331756301393020598670337990067065919501311), uint256(6924237820679412523675592629027245618860492824892923772878389861428560009775));
        vk.IC[2] = Pairing.G1Point(uint256(5576683940690480457765638450715188345426341945878644605505272363239915597478), uint256(11674849800330609901042494400066111032123551613821504546543067254945937084100));
        vk.IC[3] = Pairing.G1Point(uint256(6927095176231507782683326188759897608586053238076103287494975982030456447259), uint256(6961975635648830698395442238467972492267911609388637873862344526510141892926));
        vk.IC[4] = Pairing.G1Point(uint256(2387461503394950738025420959156146510856586275512266923208891113290030591061), uint256(16340190740004392362589281589228010288915656227852796127620385883093229816027));
        vk.IC[5] = Pairing.G1Point(uint256(18821503301667483625536681705829702402603967157788883141706986390210759511493), uint256(13661430472441894397742869850056113853684770239901836912635244626216242504335));
        vk.IC[6] = Pairing.G1Point(uint256(8873810851492951794758609460138909369776403180588530394480840505863362820173), uint256(20234923407187967130523802331896341393552898286050509661968339591122920288596));
        vk.IC[7] = Pairing.G1Point(uint256(14480152769862881976117433005254548705435960814238835081220751664765630724513), uint256(20904173958225374156786908641993314167907143585012848791685166441311072810354));
        vk.IC[8] = Pairing.G1Point(uint256(11798132561085321524906031966966483039277942536650876550472450009647920982205), uint256(1225639167093203758456622388796447453217856441146927052911159829585171843927));
        vk.IC[9] = Pairing.G1Point(uint256(9166500668382711775270998243331716314093616911375554211936306286406674090874), uint256(10393682637260072060761128313636939954182567075903722117406381145331015586561));
        vk.IC[10] = Pairing.G1Point(uint256(18554906179740720975813730085217752253290650162864085972157129433093302268023), uint256(17238679743485287403636094825868343284134932949309108522573055556660468051492));
        vk.IC[11] = Pairing.G1Point(uint256(15843074127511339174952169065779647008891487898633888060873688169351501838584), uint256(10941895596507296114804362154030470357909010174082045886990053320169004323058));
        vk.IC[12] = Pairing.G1Point(uint256(350159859196320568585611869796659946436139951871906483973071419057698574905), uint256(16235911805186447622915431532044265930736659511473804151183805524685832043213));
        vk.IC[13] = Pairing.G1Point(uint256(2220628917396094512959144422338633793978070471833751010490743610850040301570), uint256(2074704183268570782458251988507067886825638853469502257624270544151711449885));
        vk.IC[14] = Pairing.G1Point(uint256(7743724808535052108162986545458128514237328612638432759012236313039060114175), uint256(4149584780702755682793927660615238261528885273559571151683876761461535927768));
        vk.IC[15] = Pairing.G1Point(uint256(16577812802068716106430305224670663036663539822295546088591637087627796850027), uint256(16968158231156371721102707048847960896999055023196908515787588558426429953919));
        vk.IC[16] = Pairing.G1Point(uint256(6992687676410186840505351709154464234523098931142588393404305996156423635208), uint256(8966309016693684033408673840102004804504559408929453237307440974083033344356));
        vk.IC[17] = Pairing.G1Point(uint256(6550601800495637522784462236991119387640352095581298254087941431527078051015), uint256(9967805825903125311432380937947965296632971091442510251290992651336174399613));
        vk.IC[18] = Pairing.G1Point(uint256(16522831674575934638070610888399260645622631020415798180960385894942173603089), uint256(9169161956237784569663585911012503750575894743763873997131520216702368088350));
        vk.IC[19] = Pairing.G1Point(uint256(6028154795434885290797790235231529304713137414084320146081285326291443472856), uint256(11601356594103975231450411234708286668864561030323291284909149037486351404353));

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
