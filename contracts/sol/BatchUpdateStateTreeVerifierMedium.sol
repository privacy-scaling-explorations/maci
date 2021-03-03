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

contract BatchUpdateStateTreeVerifierMedium {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[33] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(3685402730524439048415344231093425095837344973442172685144712405355711066335),uint256(15141730555801500626535091795440649644038616567644350746804935006634053328673));
        vk.beta2 = Pairing.G2Point([uint256(17567375253910562373807973021762140238015157469127713024570749736627993138850),uint256(4759112327703445891012029950876612591302558247737100512423611503936240058416)], [uint256(17408692831023039001078941248743091141827263614228778295495866614252637459052),uint256(7701418017708020221109732821891276099284843046513823794862147357820795181289)]);
        vk.gamma2 = Pairing.G2Point([uint256(398418730822892976038851949367706837719431670763777406066625704695338133879),uint256(10070643965411638651897651221569645784585342167565761568736281716353404723098)], [uint256(6789415590183581657736292014648991947020644846979638024310254451589419801193),uint256(2448804290667428578441186669912395062854229684417225289675284688365396375919)]);
        vk.delta2 = Pairing.G2Point([uint256(15281065297957021023265086364036022238419118241382613776904716649016483841959),uint256(17670578747051214376554469109989442784557987643358662614107232395575877881492)], [uint256(9311150546032671774015905769586416260787072173981651346926605823364204903356),uint256(3464944329304022225809310391585110771531212079072694293745579565876151169204)]);
        vk.IC[0] = Pairing.G1Point(uint256(1863159663103262264092661645582744756114911776619022362359203522370279300401),uint256(18707017054757447911899015426164039771618691770254132035278141376256940032899));
        vk.IC[1] = Pairing.G1Point(uint256(2310577948158101644443058312426244206854825602716951880957770664501982929315),uint256(13884289319889696905325624263896028502573010841561511415297323764654299439505));
        vk.IC[2] = Pairing.G1Point(uint256(11809457423213203821067662070615426249306265114385477412918045842355021912002),uint256(10424920609407012680992799979068368104989542959340022134414897446668246727144));
        vk.IC[3] = Pairing.G1Point(uint256(10556189326333067641948648327361216849406881787014966685564669262267629841463),uint256(15754136834314116352235651595925364918837790471114382779210275272517998096497));
        vk.IC[4] = Pairing.G1Point(uint256(6831796217306184277287976915009711451069546073228777917522746663882119789378),uint256(21568858871658929569668048332559023266680312926391731297198878407218090002719));
        vk.IC[5] = Pairing.G1Point(uint256(3275317959293074195170465241962751250805411366037987712774711478385737661836),uint256(20854889585791324748993020680774084715417614422816350969337705142601986624220));
        vk.IC[6] = Pairing.G1Point(uint256(5048404664864492808858014732326791186828029166649914660980533667270408181564),uint256(5809956351675469900756558756886655977999635221371069661206671005574202632373));
        vk.IC[7] = Pairing.G1Point(uint256(1487412929006013854052036840689655272714829742934784424044634358926113697685),uint256(4337450503434547323066411933637509386871282060733406819766694753263779465088));
        vk.IC[8] = Pairing.G1Point(uint256(1743176665200388576750831667739349073492435306413754545189007136383005551058),uint256(8502400721803428717817187014684470177467086777418724509320469725946228946624));
        vk.IC[9] = Pairing.G1Point(uint256(11354863635956152202854393257352233973334361831827679882765854648716786152015),uint256(18212940831648208423288570685545362958269130167330967398268467291236427602689));
        vk.IC[10] = Pairing.G1Point(uint256(21717047892042958415712912102241537360323093122001369399607545207624244116693),uint256(13506017862384212065611522947071792305416144156071840326258894149419959941364));
        vk.IC[11] = Pairing.G1Point(uint256(16737729333280733867394828628391411676757246878673613917058239614976342939977),uint256(1969929117012833098664770779547232065763371001072483061872616024451717230847));
        vk.IC[12] = Pairing.G1Point(uint256(5062008716062398330204080910254080650362589067385548913273553707877365680790),uint256(707064988036740282934372223834323553711303918964005928530305049502754031362));
        vk.IC[13] = Pairing.G1Point(uint256(18247674871710588235852853171407736339641021551866170207493146854838567904508),uint256(8539427401661610184232475613563334467304245666374117434089913442791698091876));
        vk.IC[14] = Pairing.G1Point(uint256(6971628936582654494764081207055435626046098279705889814904731590829493997193),uint256(17446924749234206150844710963369754558289996597403154612926858644919381518749));
        vk.IC[15] = Pairing.G1Point(uint256(17843212136833134037767191765123567913989166041097067771163510833708974275410),uint256(18761498003674159591968848119937823962930370206045980448789955429857251653076));
        vk.IC[16] = Pairing.G1Point(uint256(21051467506691779800604388447336143784862476395077510564784959907352912691837),uint256(13811926687804424547236466250285864491561723359300590089517194460479885428847));
        vk.IC[17] = Pairing.G1Point(uint256(19016740376746142592995670020648672700427787117136004623780027492473272400521),uint256(6766022876673143125265278170160807255738740359052811223264073205304081123400));
        vk.IC[18] = Pairing.G1Point(uint256(6336777771680803765745740686218637038086519292937894750908131405293890817211),uint256(12936771636609051510268429937326296000710638441337998856427869706572673043670));
        vk.IC[19] = Pairing.G1Point(uint256(6559335752728606148833827844787944114363185913044813714273784287171969950173),uint256(18035913761720467030889243391462793708179606390878438104261868414843976420600));
        vk.IC[20] = Pairing.G1Point(uint256(977812056251964684675275243663029972817957263266102696097692153566750016695),uint256(7124038918087322038244485733671696303445783726420069257485949699754937674085));
        vk.IC[21] = Pairing.G1Point(uint256(2574908243534863128290317288504280087136657519064819287287437475251494375196),uint256(12113933806136513839172336566813292355126631684204874523526923808973774095164));
        vk.IC[22] = Pairing.G1Point(uint256(1414091618882165103765711837716029311215909550432330951707271840796076902294),uint256(2930275573648485538284953005111645615647079357446303583914215802054012586461));
        vk.IC[23] = Pairing.G1Point(uint256(244141699237943733675702176975716266048544849446716307722811651899090806941),uint256(8982023938030042956060924838903029188125823210566404889126028791806363700312));
        vk.IC[24] = Pairing.G1Point(uint256(351869521289149798744066160546012078637944699280427595847071872992056694177),uint256(12299295816223828267987084173041847837789339221999758497146846938816886954053));
        vk.IC[25] = Pairing.G1Point(uint256(4368896693995435187396036754842203150696212464262104732952096952424872580513),uint256(9745927285273957081036803450111019076364838980316759200508670323019335509519));
        vk.IC[26] = Pairing.G1Point(uint256(900502362686229845512220487912742739792145417522320945951041526841049868564),uint256(11700442113223601274849436200787196259260586571864971000595402175450649579026));
        vk.IC[27] = Pairing.G1Point(uint256(2323199714482651528381682138976682469790722145824885297511643575094213338518),uint256(21333359421670112397996356185731822179233233222556786035210520446362320828348));
        vk.IC[28] = Pairing.G1Point(uint256(10198130174705464884897853043515570185672335834880736644122517053039027964475),uint256(14185758415740419643367251655093181492124764733969902634227816267784272902537));
        vk.IC[29] = Pairing.G1Point(uint256(392285054025632096133918125688207778527512044549400574660541102813067790104),uint256(19634844064996281071180725052101803909857321479360360213221401773964828283623));
        vk.IC[30] = Pairing.G1Point(uint256(522066579287068912175173433383552059896104459199034395228901118744125505756),uint256(3921134712583863664844464448412401868248475926849521298081184633464420557623));
        vk.IC[31] = Pairing.G1Point(uint256(9845242811289869169797877409318188284358969438468587456270545880052835903605),uint256(14263431540965939195618142039746047620127373151380512584152372254009097026979));
        vk.IC[32] = Pairing.G1Point(uint256(19428596224682509174395833297077919887168740523466055258111989957655790577626),uint256(2063912008376504856031212007201101538457205634109820787094760701901865323965));

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
        for (uint256 i = 0; i < 32; i++) {
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
