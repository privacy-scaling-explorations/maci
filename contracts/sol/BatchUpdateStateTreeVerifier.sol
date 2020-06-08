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
        vk.alfa1 = Pairing.G1Point(uint256(2715817960559046439286283585173152761763386083883478130948990793882394541835), uint256(3735853808371901194497528362993549709343556437843544692068413150065786579768));
        vk.beta2 = Pairing.G2Point([uint256(12384003394550201073515439285084480955731304210825323238885661648514267034680), uint256(6606544970756039990814408270300417121880064092228719714864732775709364439533)], [uint256(6934281140496987014625692744632719884697213808239116621927002650483445957164), uint256(2085264113187409896658049081788994418212351050351718873940039837854116333911)]);
        vk.gamma2 = Pairing.G2Point([uint256(19260248706917494177735149700402766381742916369907395750876971884529081287716), uint256(18981018666487065900239968271579622692500548701967032159041377142691661333292)], [uint256(17510118242797534897487239449427228765999044249227381520036626344584872679455), uint256(6972959680339703613113313102112268833723105509004618270843238894214328528736)]);
        vk.delta2 = Pairing.G2Point([uint256(897903743476632065837460070555075130910576634604580585094617838733281158876), uint256(4707899626596390492055809373899016081951599429782582344859025305252951657777)], [uint256(13059359103007354816001131171215203509346578436171512335097409968782827165135), uint256(17584342017118226456102114198449759301161713349472423285416709640379428246626)]);
        vk.IC[0] = Pairing.G1Point(uint256(10580880385362634492475653814168768768859725923431461371205719397733451596212), uint256(2961330846840297442175039008154623327204437082107503062185310241679615198509));
        vk.IC[1] = Pairing.G1Point(uint256(742588619955161068136796159889093671908546263262918305738552844128810858735), uint256(19885409356517688602167683012651218065014263492932316535597179395960956167937));
        vk.IC[2] = Pairing.G1Point(uint256(18834811619499233041211920525250342581027825327640122402221760730823895712017), uint256(5177786474015747465181642340506130772254455122470042021524780506186977528512));
        vk.IC[3] = Pairing.G1Point(uint256(5355399360811307432384451787750034172833086667237814312565022989214100274547), uint256(10178247459406119319634206414015421205337778656026604674243579487233027147311));
        vk.IC[4] = Pairing.G1Point(uint256(21764693920343755069781710248119768319166380784952394242838633007626139048358), uint256(18094532316701744500960238863437286866408112549607213659654994808533226418557));
        vk.IC[5] = Pairing.G1Point(uint256(3420973286002894031555232471385107160881174526501186637782120287353519559287), uint256(9436526986303253013217407626542965310498750998141696155213179281025017317984));
        vk.IC[6] = Pairing.G1Point(uint256(14142375720900301384338693483301840019021044237659576081295326864388743118834), uint256(3583038331758128287748420863591514799090719798770384934725167471544665650374));
        vk.IC[7] = Pairing.G1Point(uint256(20835778909351238089310343083614907903946245845318127341948696880338935491661), uint256(883290784447258692158311978326549917260160052642904712899032959721288196776));
        vk.IC[8] = Pairing.G1Point(uint256(5588579903514905754705407186580275490594464619175221991892254688656239704474), uint256(20033792910001353644399532811873598198486471922830712801205485704658114755109));
        vk.IC[9] = Pairing.G1Point(uint256(2586356877448908634008963736055360908207321527359729047563226770024524207852), uint256(7773337271732080158324067452790009647336612967421821057326190137222388261938));
        vk.IC[10] = Pairing.G1Point(uint256(9844832084882471246742103678083278089795824673069908990849422226125341750403), uint256(8774936340693874721573324688069232374224530000610526144050424775690407954970));
        vk.IC[11] = Pairing.G1Point(uint256(14231931224079569250843365409517343064123888996127709025179113023570928391008), uint256(9819660069710362066914565058696621774327630345709512490286087113269066053269));
        vk.IC[12] = Pairing.G1Point(uint256(13989326160432235877888676607902630176340333857000521940751696295560695600179), uint256(7686211402945143643294417445803700500876836747546643713095836990902360792489));
        vk.IC[13] = Pairing.G1Point(uint256(2252932644138181568425488005585422659615467998074998203060665105973943790829), uint256(19763451736346649628836888019248457857909732203363358557789154091747686194536));
        vk.IC[14] = Pairing.G1Point(uint256(6784301592338683352538734580876173172711661335346071778060146866469128912539), uint256(21184764609533293505095493261739214157318326995646304171411966364056989092475));
        vk.IC[15] = Pairing.G1Point(uint256(14841686455864472013417764270555507955489754487340211521300359788173806071630), uint256(8589250003779184970623401472741234257540606589598567078139853898675110627266));
        vk.IC[16] = Pairing.G1Point(uint256(7957163022796937637063368887533202819333679288220800932886462437406678588797), uint256(3026190476283237702089454613233295888353345051390566276935742044734344015707));
        vk.IC[17] = Pairing.G1Point(uint256(6723146417662898659886124645723936355974201026826713287175876786365289465204), uint256(7029225886171501542822388164668789356742937063200301376377628784289715437945));
        vk.IC[18] = Pairing.G1Point(uint256(2536059285810870077007523454784454971958038385714587400281706308809758707665), uint256(5719436053560976300536054817115544685638420352911862143349004742540998400524));
        vk.IC[19] = Pairing.G1Point(uint256(3793106100735183245653344346897844791282891860488839464822396626296180768104), uint256(21243863836384803168090352123135960084312305220689758874048732882009013926156));
        vk.IC[20] = Pairing.G1Point(uint256(8787941499772621652975552685479856337268652079826379134432616507374944276443), uint256(15801778002857498606653789701588440271962703761206628936846963856277100360118));

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
