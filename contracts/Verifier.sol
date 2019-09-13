//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.5
//      fixed linter warnings
//      added requiere error messages
//
pragma solidity ^0.5.0;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2)  internal view returns (G1Point memory r) {
        uint[4] memory input;
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
    /// @return the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
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
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
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
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G2Point A;
        Pairing.G1Point B;
        Pairing.G2Point C;
        Pairing.G2Point gamma;
        Pairing.G1Point gammaBeta1;
        Pairing.G2Point gammaBeta2;
        Pairing.G2Point Z;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G1Point A_p;
        Pairing.G2Point B;
        Pairing.G1Point B_p;
        Pairing.G1Point C;
        Pairing.G1Point C_p;
        Pairing.G1Point K;
        Pairing.G1Point H;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.A = Pairing.G2Point([8347643634235983415846976865750885743511527250365710180936898915157724780760,21471589763367938490396362861228799573560089603594588838278114231430958855132], [11419113624037906755845290824562476416483418193869173934171841902721447985669,13015298930450398230336397867079479508263086637536443591398133731886281662559]);
        vk.B = Pairing.G1Point(13519803211293949114851524031221459949229501960124160340165049339117426038320,10810222373197573590507317853797807773463000167121511820906878406389606121210);
        vk.C = Pairing.G2Point([781925391828723698536904259783213363872126028782487883480801273705022243854,13014809624341655087857500204201515750006860597576025377768352284887921345493], [13131877969571728399755340530622758706678895938280868911139719613242771823178,19054482781194461925147097167153270852696186376623814104400334263980488617013]);
        vk.gamma = Pairing.G2Point([20904262735025189412485453682279233657334070354001923264766600989191923818899,7435039787456394032577616462575918339059580502131948314367232944574473776057], [11555209283306104865333752419988762778883036568228769084275155157976303155999,20578546904242390182494011165176331644924595316762692929922519559609396039682]);
        vk.gammaBeta1 = Pairing.G1Point(2026612980902579822616323725068813041410275627818890861015571985413480290404,5656192607154709623313757668795586770019380589257950302635154752844139665228);
        vk.gammaBeta2 = Pairing.G2Point([15636526284719173701130562069051019907723742821367944959463981517420004340306,6422259480929509551138349576096006547066919113631098302767102402114802463290], [5629992733936034558859694080171774407097626052570780650719746392118806218023,3976296148526743081427548933136961201580728896330043258542816648062573533561]);
        vk.Z = Pairing.G2Point([5821185762423666569513252924859111546098508142705443137346063745992357792192,17507999270301454642901600317488315202756761577988070141590964997241810294538], [11742086768178584105856377509865441190120314196875248685746798154855446662270,17369609699468996972520232918033991933102207938657693675920538008974161388792]);
        vk.IC = new Pairing.G1Point[](15);
        vk.IC[0] = Pairing.G1Point(10112085622767528692456269013401831141314026051810789427002547644000742484907,5226063277019754745930116398949725557043785740176232999243801774648900635624);
        vk.IC[1] = Pairing.G1Point(999467552694086595837898720020712085122852193729133000477122362147218403469,16830478752432856066839557101263332999256791806002153549838906293725107427667);
        vk.IC[2] = Pairing.G1Point(274689606507167211306557728390384853630029447648082897634855426865373899351,7401476295610469722568260448427588986537673448898130666056434239386243093508);
        vk.IC[3] = Pairing.G1Point(20653797513721695990495158633881097341963215791851433259202325598445647682551,10359104261824990953805697300312604572342662973123297635483723268812824167014);
        vk.IC[4] = Pairing.G1Point(13943547126527621762336319480461236382052206801394003146368086201176670978776,3114689989748547201699411079634625861679169343519973834898664152665704875074);
        vk.IC[5] = Pairing.G1Point(21474686496622559850165004024038213067219930542511493407545155229590900572166,19242455502914067531892593456374272486619752296948650922081314492676809970504);
        vk.IC[6] = Pairing.G1Point(16669259793707012743488021708340408732929799799377801725771421662127229029931,19642757799055591339662953145723082624177508605222190541765044124895439087767);
        vk.IC[7] = Pairing.G1Point(14606205520243085738098175850733293744421238585423854621920862875437516485445,2168101605370439257907170939299099901096690402822891730849979895560698243814);
        vk.IC[8] = Pairing.G1Point(16571481720803372898576983187327092968346066534020934977042799245334131655982,8837432567948417068484706376506627635344316704400577668196625444524199966941);
        vk.IC[9] = Pairing.G1Point(18621148268450584191866832106651534624599945684249752546718788162587167541955,14112881747780641924594462088667187928010362856094671246858157419710400462309);
        vk.IC[10] = Pairing.G1Point(19327554968099669545849133350639874139296368424939724472123734065140919993909,6797992783058742431250517180853004070573009865549445539162898069937954654340);
        vk.IC[11] = Pairing.G1Point(17093478395853582560075859105525762779373885257933767160807674150068937355474,1185676164689031970234007101648504556741277218393261263675522781692912785842);
        vk.IC[12] = Pairing.G1Point(12083217621132517374564779411518119697120818195616949052946564363267674809551,2031315716716097637495429333094568158224824710374493073951795427791395011690);
        vk.IC[13] = Pairing.G1Point(15945598669370076039475357920336019687871688715446818439118291801653842067465,12421970084831933874255316039797146991255006201221271267006363993949019519962);
        vk.IC[14] = Pairing.G1Point(5610443890608790522010666843626077401071321396778188205840447770038017274669,5630216298184664112952903247583835490556166668490768647037303859045134553352);

    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd2(proof.A, vk.A, Pairing.negate(proof.A_p), Pairing.P2())) return 1;
        if (!Pairing.pairingProd2(vk.B, proof.B, Pairing.negate(proof.B_p), Pairing.P2())) return 2;
        if (!Pairing.pairingProd2(proof.C, vk.C, Pairing.negate(proof.C_p), Pairing.P2())) return 3;
        if (!Pairing.pairingProd3(
            proof.K, vk.gamma,
            Pairing.negate(Pairing.addition(vk_x, Pairing.addition(proof.A, proof.C))), vk.gammaBeta2,
            Pairing.negate(vk.gammaBeta1), proof.B
        )) return 4;
        if (!Pairing.pairingProd3(
                Pairing.addition(vk_x, proof.A), proof.B,
                Pairing.negate(proof.H), vk.Z,
                Pairing.negate(proof.C), Pairing.P2()
        )) return 5;
        return 0;
    }
    function verifyProof(
            uint[2] memory a,
            uint[2] memory a_p,
            uint[2][2] memory b,
            uint[2] memory b_p,
            uint[2] memory c,
            uint[2] memory c_p,
            uint[2] memory h,
            uint[2] memory k,
            uint[14] memory input
        ) view public returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.A_p = Pairing.G1Point(a_p[0], a_p[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.B_p = Pairing.G1Point(b_p[0], b_p[1]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        proof.C_p = Pairing.G1Point(c_p[0], c_p[1]);
        proof.H = Pairing.G1Point(h[0], h[1]);
        proof.K = Pairing.G1Point(k[0], k[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}




