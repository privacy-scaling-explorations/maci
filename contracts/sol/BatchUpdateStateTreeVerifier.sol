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
        vk.alpha1 = Pairing.G1Point(uint256(7749045791715400290925792218664994875833652546928258958604216517044434425585),uint256(20684539550707329674327367645479384635504229932305694435629049781532107656315));
        vk.beta2 = Pairing.G2Point([uint256(4702203139329044125368554557267025178903311368859872551490052347976866221386),uint256(2397792781501777885906600388373512641671546491389095739977864364691070417442)], [uint256(3086045888642818360568982115529663381442028480556855512944635770623161935191),uint256(17770853155929924354713881720211491475629003602567587572493071618357822108105)]);
        vk.gamma2 = Pairing.G2Point([uint256(6935779672139219151078187350324556731587580010163723720728065408803302868635),uint256(10016572212883181255500555708717668907950353431502128208501191443707477158587)], [uint256(16406622233643872222687652777975936812785861603092798550052299661589762529188),uint256(13187703688042642368727178632850341413563992584262064348808738325816245406873)]);
        vk.delta2 = Pairing.G2Point([uint256(14288108796267169495699030312658075868940067167589732460080847431589160364784),uint256(20626085335398064155822219380848631742039008873033032544028955784809331565427)], [uint256(7106737051377765013611484448105829660883347148404618878630972643905313228713),uint256(15953474783897601260020993758991403990793250004737646269263306506942322180107)]);
        vk.IC[0] = Pairing.G1Point(uint256(11036474913838166205666623134328351166372778953417936620441404741395334216024),uint256(17966381059037325995219075788208120647607652411540139685334901715778719534620));
        vk.IC[1] = Pairing.G1Point(uint256(20295785384599054266605564897844278684144257374527940785613427419220586256913),uint256(21272689265015316201803468461009584910238801098913317384439503413250354712939));
        vk.IC[2] = Pairing.G1Point(uint256(789732269549694742179686799143105314487762975853917958046038682992385878324),uint256(9431652377212476116347217015541555311844406847694467908291120145421719894290));
        vk.IC[3] = Pairing.G1Point(uint256(100215721426516726425028801291142477062151193956257846724924441727434979403),uint256(14374676255679184313313414705766995248077150137727114617765216005615268366970));
        vk.IC[4] = Pairing.G1Point(uint256(8096519910893749704796910809775450672288074143723223608583169834586064642094),uint256(16481054212038757917087526134510410019242762299191400532486682367546747900066));
        vk.IC[5] = Pairing.G1Point(uint256(16480242090602436707220491529390912434578158423391294130513931024076899829992),uint256(3714293742956544217492439803268492781496128537433338441571441484321597390697));
        vk.IC[6] = Pairing.G1Point(uint256(1459602301260112929289653314458973925769356044262433647706215982173409466249),uint256(14734101529882051535796738864765231504626876977241859488417514628369566816164));
        vk.IC[7] = Pairing.G1Point(uint256(1153390331385903235903715723319198779424471159768659938366752945890420725827),uint256(5446537865665077921164614224476386425991268835430310054838581162365032980561));
        vk.IC[8] = Pairing.G1Point(uint256(13628549743020232468181066849298340166301274302388603559991172723787307718816),uint256(19822240224443277820913782536857861298232686860794528336919377320648357934064));
        vk.IC[9] = Pairing.G1Point(uint256(15342837068128036450316530222047988272782123496848128447482888219742907102090),uint256(10185249038603256893593149302323251676239721457757723858696172703620177926570));
        vk.IC[10] = Pairing.G1Point(uint256(4247329752754253577721453724634591872864908584616067301558821644405665857541),uint256(18305035603091862808195231401806670802239911471462600310920146447220682741776));
        vk.IC[11] = Pairing.G1Point(uint256(21415712747652540021175707030860915964242448522021135019206966992762661314257),uint256(16761809110157666265951435499680438787323323878856883875981246400472859395168));
        vk.IC[12] = Pairing.G1Point(uint256(6688701214153437699916226772544058627660291660638683082320628689953553076218),uint256(2261848692321134517472768761652005258801953878411490409696747638323967608662));
        vk.IC[13] = Pairing.G1Point(uint256(8322019614317988953188649881534212692179090877470170194176579089348347867054),uint256(2300867899447197929998422307212453935128666525609423346346058730902845540610));
        vk.IC[14] = Pairing.G1Point(uint256(14892519978068172486943773555599332889517323062971141612218687766754300470369),uint256(12238342493114538041473343750420330504915830770657117921484730776494182185831));
        vk.IC[15] = Pairing.G1Point(uint256(17777861464486242177076299055713886185660474728471462640799066563404173784950),uint256(9167017172333382296841046714649583910315386873304235562126634204937945719672));
        vk.IC[16] = Pairing.G1Point(uint256(598407374006816079455127059829597511248280351695832366643108603306348034165),uint256(21415394393653539941320494218802455854900130594185156415073597423422821609111));
        vk.IC[17] = Pairing.G1Point(uint256(17323718698600987706647728645511221045566237200846666968885368782847931823774),uint256(1428262977404195578883506706524140225361633906734505757495376018563283450954));
        vk.IC[18] = Pairing.G1Point(uint256(13589053820437686470976975599049709417405912954030572473221973114772254181998),uint256(21372531607493727747685880876362072047504222959132979528871108586230069331327));
        vk.IC[19] = Pairing.G1Point(uint256(823709011026467208000860244260164292900339908905573119708174250814382113022),uint256(8165065252082040752781378726045488088906318187859262481402234135704514656562));
        vk.IC[20] = Pairing.G1Point(uint256(2538875161913048872031759419029351136317137619728242139321160093674161651614),uint256(12212918729708190430950714616663863664740003697800450244521832541406333869453));

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
