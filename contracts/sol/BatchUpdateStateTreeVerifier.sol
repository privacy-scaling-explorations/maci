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
        vk.alfa1 = Pairing.G1Point(uint256(10073183852550052529840803190347210418628921391055746882869815341701892257355), uint256(13861937626253584860391736324390171335597184370706122748435266562371404190377));
        vk.beta2 = Pairing.G2Point([uint256(4991765732310952677538919817426365269570818955132978058484049745884707913594), uint256(20864434145770185068147512974657320985103490201337124177579460694771841804060)], [uint256(16151758673426354592760663354183715432564291443806190959155649762857704195075), uint256(17817985150951346038808647804754672184418048989457550980611482565473118576764)]);
        vk.gamma2 = Pairing.G2Point([uint256(2589272452940029403704150493173940656372273872188698559983808205274746159222), uint256(17551567375461494514237018792168242389349872503260430666276248714528321666340)], [uint256(9553819799088181109945455619036668564511432120814812575248839666413840919393), uint256(15712825327482213539186057928411962026450076964291227933225787179105976899060)]);
        vk.delta2 = Pairing.G2Point([uint256(4617340488753515140385594646825846834653413312959665718188992565594749508010), uint256(13990750973558351923131508056854399293949233337780174647898800626377701677567)], [uint256(8429672510529248598708587271946560364756729232059279950276091926989699680419), uint256(540993272710826756573376790531385442204862553876803282796033627031374518607)]);
        vk.IC[0] = Pairing.G1Point(uint256(10481711423395577669047709999640245193688000938561097243048962720744777954690), uint256(14108992431259954810460959389663626432911995156210763960547032062343677260442));
        vk.IC[1] = Pairing.G1Point(uint256(6681505287627086837158221860903139013591819588042494055961673693796427210452), uint256(5887349039130732779318734472428440432569056227966435995394663181181116246451));
        vk.IC[2] = Pairing.G1Point(uint256(15890395395136733321781775842990424352356191436480280104095982463290664908464), uint256(18524825325163649046804644928993343500355450531783745436364094312676427188796));
        vk.IC[3] = Pairing.G1Point(uint256(14782632376636627101833848011550855237348209405958131305587354216646021606247), uint256(64757679376984329806566250480555017680861723510543980409493912988534936092));
        vk.IC[4] = Pairing.G1Point(uint256(458543565384677651960454886985005026050617244357737359321483342679186776470), uint256(6878844324071478944250485840259255287387905775622939765850151792328209553466));
        vk.IC[5] = Pairing.G1Point(uint256(10427769223707826074098748324421650529320250570741260152145409455791035828348), uint256(8143765614532092851356256549565787488420088196677154774539448020312663786553));
        vk.IC[6] = Pairing.G1Point(uint256(6929789105128450878936759509091931033176021129711139070381242439140804496669), uint256(11519951453143788477675196379197357358655195365149692991757865801274315299642));
        vk.IC[7] = Pairing.G1Point(uint256(21482247862996584893145319185075165655204051025707451049162903245906625483568), uint256(6974284521119052350874648572094727709442380001484646428304317188770246516511));
        vk.IC[8] = Pairing.G1Point(uint256(16934829368195469803946343960532988775431071359286259337590721443105657553962), uint256(8146301677823470622313604210511841161662310505066158368271701729153198265224));
        vk.IC[9] = Pairing.G1Point(uint256(15022800404073643999091136448616043429399067266716754105646138460121167084449), uint256(16067374304463057468432714919075853349458555778235493013954731045688637655079));
        vk.IC[10] = Pairing.G1Point(uint256(15732008699900149902708796910881485913978061733568150210575400092429967170931), uint256(4322799687114070148596904410363344443176438476490441744100707646378404317661));
        vk.IC[11] = Pairing.G1Point(uint256(21553458542196521604648518002349542356144633581325196590543503350145409807837), uint256(14189245118900152513556291904843356892926667146651245523325278547799743689134));
        vk.IC[12] = Pairing.G1Point(uint256(3261002698933697588517588059051371437244160286965371631848975294959549645422), uint256(1845242844244369856171658241195770891372634294016993935960869147878127090509));
        vk.IC[13] = Pairing.G1Point(uint256(8226294702816278956165775532610244255824153976384669116837123601555326498841), uint256(3599486002841800048933787290120362971454656022077184730906719808184228300990));
        vk.IC[14] = Pairing.G1Point(uint256(11761068821013028876174967479405459850077427771632450490048313457295772698016), uint256(20611109584105270137153359921579029282073935697316999210804930372507967408240));
        vk.IC[15] = Pairing.G1Point(uint256(11495017995204387149272884842976840659421089624927537145707939041098809443682), uint256(17676182163939762396161806126335541079289345241284097796533683491049271782637));
        vk.IC[16] = Pairing.G1Point(uint256(17403007074588301881893218890559549141773086946813203379684387645642838941646), uint256(10816325885401303427334109114860288202006243495708960170564421431093893294735));
        vk.IC[17] = Pairing.G1Point(uint256(20545577017327256338433583214299895186295514692502969196490451088764294752206), uint256(20801511346091589894282090201104521271329388151321163306766086013309991141485));
        vk.IC[18] = Pairing.G1Point(uint256(13489884825557649121724038512321039351076665468060832427485493400670242086981), uint256(9121143931324128041028376374628618673753259079027620488832356809418995003824));
        vk.IC[19] = Pairing.G1Point(uint256(10389460128452185345641360324125571592664843906018946502814101536191489003309), uint256(5010045360291604224478611845657348886366806512064834951687724919777120077613));
        vk.IC[20] = Pairing.G1Point(uint256(7169402548962620934071536098535368060272866959848042869497558671839681372386), uint256(1068369381330599816293994950069734758628150239765730128481452408325628143673));

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
