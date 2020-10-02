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

contract BatchUpdateStateTreeVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(15923934927808421354329633736437772462464309235358961102113949988679546435295),uint256(1051056017428573395819178189571557323196321785407241489163827412281084708987));
        vk.beta2 = Pairing.G2Point([uint256(2618107297615379773375193119948732175059681539200254556446277581757839472815),uint256(21669774097874575687214518869387756689535923537726388086116621635978261704337)], [uint256(19749800909425762355161953729914197111244019176261827292250978656218158577150),uint256(18939578500944030309235864995991199970634704080395699900094928118364601600770)]);
        vk.gamma2 = Pairing.G2Point([uint256(21115583479419417370403405875225774602073527687782262743307346428834497525883),uint256(3980101596650357328158630758187854407813422708161375744620290545704360345013)], [uint256(13293803171547960641279913525619030246704646685970522150119337908781003816078),uint256(3372252220512917832907341519056697349737775245374573262693255790965957947698)]);
        vk.delta2 = Pairing.G2Point([uint256(12926275720364622556685330466919015560117997526519360486581417079120984694108),uint256(20930362281521526482263900546514149303956745742662253818290151508864547389169)], [uint256(17744411137763073567833655808437110745485608090496564351330246744442721951703),uint256(12968733849665254030688266000227378502003104672612440167618512148584787126710)]);
        vk.IC[0] = Pairing.G1Point(uint256(13775194420844557728017406221379730599643794387027004674843007618021666663771),uint256(10534355396948276065552434215613608757553811099871922828223188553670091975588));
        vk.IC[1] = Pairing.G1Point(uint256(5614540119459598299214581306550294855492171299364816759749312454176061250717),uint256(18593972463840788158593637976112743130846781887346664908679251796845308970758));
        vk.IC[2] = Pairing.G1Point(uint256(14563455442357636214630099097899531400956432452589629615203832213332065522784),uint256(4179064747195642635228599695910975547495925373691852566973393944855342425084));
        vk.IC[3] = Pairing.G1Point(uint256(11543931950664568476587031716254542811809429672779438033626424540316682323698),uint256(4136364190259295148119669109938194635120676491801010446502101089514947283024));
        vk.IC[4] = Pairing.G1Point(uint256(10797963586757181767844307689041078492604685715342169471754771271257597526999),uint256(18624583548645949025051646368657684873687132191321179391413300569330406156418));
        vk.IC[5] = Pairing.G1Point(uint256(6655587482529082645055701360018225740587146507226006444975804861245938436089),uint256(11072117189072586003080407501275791733653144429757506596651084751895638228659));
        vk.IC[6] = Pairing.G1Point(uint256(10242607686185995042107594108118605427308211766005949330958275046215785586259),uint256(1323456859773721215114515622409309634236769941980074153551969939829798459203));
        vk.IC[7] = Pairing.G1Point(uint256(2518846431225987048416547420356155840855558948370694298289064825755851463539),uint256(15617042741414203957243126657247539991609615899972874866273062277473869904615));
        vk.IC[8] = Pairing.G1Point(uint256(2094103209988003497167213306719190823047378652113901965634304297825911069217),uint256(3346120709719544960739163029811604315646770099372736308084012694656619011388));
        vk.IC[9] = Pairing.G1Point(uint256(15854226581983978418493768409964649119439577368633735058205797447313059369053),uint256(21606162486822570762770076959129235965171885821656974409156015410985652089800));
        vk.IC[10] = Pairing.G1Point(uint256(6823719637840855688547265170150350125495488755575634200545305173934538414181),uint256(17490303260186053529780119039316377108843647762163858644572970016977193202818));
        vk.IC[11] = Pairing.G1Point(uint256(17588259966462958204517801694258855850517375756712869072722201497218256244789),uint256(14875392710744378547198757977290672194726271105333616805888692857607055605726));
        vk.IC[12] = Pairing.G1Point(uint256(4429113460885158445763909586987489804448525406208249350377832077715896344508),uint256(4451531012850187317451429207466346116319445642964931732445411005821311151762));
        vk.IC[13] = Pairing.G1Point(uint256(409875471285552678995099820495260852462839994718198889756961405483359530918),uint256(11550078935859113132423628562879106692613237369226694693583881617788696078059));
        vk.IC[14] = Pairing.G1Point(uint256(14915530325746749755894063815091481963259702028435411637516180794008900726717),uint256(7315501115170869178242423723312891752378426178990348595069402055634973224843));
        vk.IC[15] = Pairing.G1Point(uint256(1348803336665718354422520966747502881463275986308776919349605340502942898811),uint256(6105825717023671670403210148499903291942676123573753471531678185622041617689));
        vk.IC[16] = Pairing.G1Point(uint256(12084507416566412480116896208427732177900878608618890243869362768080092255966),uint256(19091498101754413753038042741713435256386148598448023361036351799809545670505));
        vk.IC[17] = Pairing.G1Point(uint256(4428258430239710046403997733652045192822789656130512720316470024544189849964),uint256(21055604439763008968524768826650599477363582817793123771386913234734750216054));
        vk.IC[18] = Pairing.G1Point(uint256(6333666191150567236861310416737572497951942567861355998853254758503192035003),uint256(9821935014081736598364280647476677239828281214900322973284374970033830193673));
        vk.IC[19] = Pairing.G1Point(uint256(12330974936721349275752646236745038162721871913469734286227407730315076623716),uint256(15906857008292656444467593271084833457811224328402521614347940037432423770185));
        vk.IC[20] = Pairing.G1Point(uint256(747590586376064328992574100593644500015720702868698453256981114506111860382),uint256(21491866558663033723418669170606651754350777069139097141496071268258791332068));

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
