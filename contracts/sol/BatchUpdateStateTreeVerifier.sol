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
        vk.alfa1 = Pairing.G1Point(uint256(1993368645766601519599018916861585675877819838629368551841889814517298074277), uint256(8637447259984634215678139868546893828351684025114763465823427634748331294755));
        vk.beta2 = Pairing.G2Point([uint256(13597185623100686886277824144375674018812853770956674060274748959573673706392), uint256(17563223857761091751263258007101273131474799989476734065638211358224961044330)], [uint256(18752302296486116689884054655976282799916615885456097445046817279347867212466), uint256(8855329199402584262304377617259973829538212350805438461853166604449921894392)]);
        vk.gamma2 = Pairing.G2Point([uint256(2190041502202804562218908101144485088088221213483396552870962223097960521881), uint256(6580795418887483260465786724989767495622777851308860340110829085186328737479)], [uint256(13003929589605346977511817498636797542770487552279731959988481398405855862339), uint256(16706699158316901197302260253646744233901119548096845324298010267366788832881)]);
        vk.delta2 = Pairing.G2Point([uint256(18645960191028744020724176438508338678277429354902466466157574300038361172224), uint256(6752478446413241522874326440257514812339620450925752974471266818139120009011)], [uint256(21046172840958967279243485922001774075892598211134005145848678642982518486258), uint256(20100994129479738076154327039402726908540266026251988381501827538267960128049)]);
        vk.IC[0] = Pairing.G1Point(uint256(13735557102679245715225000169419619183084223462384777437345706934350469704891), uint256(1590012905484099434658978934238524531598068570008181755319316046888770419726));
        vk.IC[1] = Pairing.G1Point(uint256(19122615664636058831796844450208217342478321934496369507627142223785736896204), uint256(13362098403042639742498928682147117760441762431268720883963463886620787351357));
        vk.IC[2] = Pairing.G1Point(uint256(20084397421779905418554254754365936582229494543366954105092072593443149152232), uint256(6924382099736926470290002487659502866457231829192722527401955489806986295123));
        vk.IC[3] = Pairing.G1Point(uint256(94991305850891367649578054742895537504059421865475668009255280917406319756), uint256(18462161234562374641673328019149065405504991210939377294351173110955016268654));
        vk.IC[4] = Pairing.G1Point(uint256(6039084703901798518767008563255866253626904735299981064480550710939860431247), uint256(21034001327587061478176258062069893408108576168377722338641180551012965499060));
        vk.IC[5] = Pairing.G1Point(uint256(21348141520672720380393861825280334254060702054209151438972805397937177520780), uint256(5199068623228967415625313154397367821841812909185166676302415210638005875995));
        vk.IC[6] = Pairing.G1Point(uint256(10756149989879745348772151250408146409849800082119243050322056422140153399301), uint256(10973855884285552387692310963962136518045675916401021554416819257151789258162));
        vk.IC[7] = Pairing.G1Point(uint256(16345791969237494933569236117276160986737774151541732673601650102594094313795), uint256(2340434817042712088227553959570559930844298105708401339204138638022325954692));
        vk.IC[8] = Pairing.G1Point(uint256(19484495969712365712105805834615287015928895753791468355671862601798049787069), uint256(11514732900190132384207150266710186090877992768190444513652522132748097352719));
        vk.IC[9] = Pairing.G1Point(uint256(5917442133777871977797907983511766831628191415574574420748515495433651494407), uint256(1266195210535588350215197687983803236717509281237797158905449634028961512135));
        vk.IC[10] = Pairing.G1Point(uint256(4677190947640920204038852586846115473498976451420365734276292922775992535365), uint256(3707625558002682494940603526123759797341194304410577662528914802841545863789));
        vk.IC[11] = Pairing.G1Point(uint256(5896307802557697294349863085536783735869181230373044696847200651070626181684), uint256(4322716175292411401218949776705318662154103085469464528016538241783535140648));
        vk.IC[12] = Pairing.G1Point(uint256(12584633898713886138739028200490833060962058770982515527705495508643474233537), uint256(18090298127636652914540414694551797259119073871299371936197110736649319309987));
        vk.IC[13] = Pairing.G1Point(uint256(8832259675437547464887799372609489560058981454948055968193698910863061773641), uint256(18557506264994340314685299289207587575734450522908550477391744639567840900974));
        vk.IC[14] = Pairing.G1Point(uint256(3361165384542708427232989930857951165952041575611619993966801876826668342578), uint256(7935567864203606300335098077930662176327270419230625057898503777133551910768));
        vk.IC[15] = Pairing.G1Point(uint256(8376135181602967107101550299671864782121315273296313159988036187340294072531), uint256(5165988930747378446364073762594171968840356589987090910083479692668528785227));
        vk.IC[16] = Pairing.G1Point(uint256(11912394155391972313832040800138732042450989164494729060712351113364843156395), uint256(6763944643796271499421198537258465345768439420633490712770387622429105632488));
        vk.IC[17] = Pairing.G1Point(uint256(21454091609849360707769900086488240557163647759599448715729313582919915556252), uint256(9719956303743061665327530450106700157576958471549864500682539498747559512270));
        vk.IC[18] = Pairing.G1Point(uint256(6004287705109428799471894264695766342833345973445811487490627040738902539115), uint256(13717441216101461353022104852902170130244477891730424179497522096616101616339));
        vk.IC[19] = Pairing.G1Point(uint256(14539657435132748536116971885851627751658554912534153231593335790777773260660), uint256(19708464070064020985878140442201982702417799428594288788696847602109160940187));
        vk.IC[20] = Pairing.G1Point(uint256(18751097183550787430452454874003436041711934902839319834861541326597552732108), uint256(6644624641358598664420511923775305293166624753343443240362772753193621017696));

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
