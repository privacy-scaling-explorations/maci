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
        vk.A = Pairing.G2Point([21085806450901702320656371083026087138879095689976107129365838974707606759730,18913748414176892479274670842350203777119637930201821232084782069963529142015], [14191656586168971330976675721891735330235094727370713131362567045968545194957,4542236126025270738531205797085997474947468377125945884210205923303576915794]);
        vk.B = Pairing.G1Point(20517231497023418944225028493516297445179856816760843872173166736927583527623,16685632189917278133555020469497073675970660724388931492043119948847635603466);
        vk.C = Pairing.G2Point([10064305759859441999532671151378699959723671789644057135929400083819407717460,11886287156222196888292984230321508768732079192448633683921456088805250463013], [8021057565665089668721564929981003266674510775152744333654244822941119740363,5644565571099345750844942336786944477383171827555912651800112254560591525314]);
        vk.gamma = Pairing.G2Point([17417760658420515413657707407855374113231879078574125070617843386741433900571,8102494487978525577507556223898944977489744548989329513903243345052585863694], [7248902113801894666542668596033534358519735894319469576794781125488808884271,8378742750932859101963943975404917001407686931976276953078610129669038620382]);
        vk.gammaBeta1 = Pairing.G1Point(4309741233743841273589310922433029464267501724264287474940761125206334672819,4960154695061274938334743215206730933931243225679393043634303299618758195895);
        vk.gammaBeta2 = Pairing.G2Point([20398140127925194802219581610941549298943820177385166071361382942201196842691,1890279677366386447962489485044173323086096912789730621880100001370696432534], [15679494426930420152969897970740399276822601978800653875564560926074344797967,17990713650265020943483412933452574264917655308404253753877788663018743359427]);
        vk.Z = Pairing.G2Point([20850140149229279283634263623200911068108619107726489934479844972452874478314,6619540924155258803727874926520556382779627312413477472658833535178956704170], [9822531208165541167773851527168536563760130020953031630734761322588091459005,7150507488817480038706255891237675433308112352403969524004702464072128347154]);
        vk.IC = new Pairing.G1Point[](15);
        vk.IC[0] = Pairing.G1Point(16525980145051622102903078209401674257311940653424267610303628064132219876731,6734172436745887054657013752169685264096497906373169805265927886734146280630);
        vk.IC[1] = Pairing.G1Point(6932066835984310624463426290213373297067631959589205638800590347369550547932,17899781825349783047794707909663435309646400501611071093338820561733624308578);
        vk.IC[2] = Pairing.G1Point(13095602352367964132046793841725686537235866950348313409004232586731544530890,20455781325646099638007692890178521638529100300503712024509606605717148491377);
        vk.IC[3] = Pairing.G1Point(15183925039420984303057089907108084639824016492508918808961288705333747748684,8708007435970928169285292275449361533761531830626299671785969048014820934891);
        vk.IC[4] = Pairing.G1Point(18776024193472071316253065330940655916282535956324602640559224746415907155362,5292221688682110919501013489311272092053412711359101633572720455116320005830);
        vk.IC[5] = Pairing.G1Point(19604696276236180503172858070292713330666336132791732557532288153188705591845,8699717462151608060117355717884831105500862772695752310554532539410991156922);
        vk.IC[6] = Pairing.G1Point(15200114632856149085414224353740388270295490084311073776976982059144198189821,9345258633458811597588859345159787949752378129315551401788986717657894947769);
        vk.IC[7] = Pairing.G1Point(11215312986157601934012146199589813156994022693020873364993044062055743437692,17176435429262948302584507790414233599658195336242600771383115125208587125027);
        vk.IC[8] = Pairing.G1Point(459983176137413395241586428586613146606620736103126783780158629445550096211,3114574168221272954850961859768904847738799511693043721393103423069360185772);
        vk.IC[9] = Pairing.G1Point(18616151395688679036355115906567747858133206338753300050039665182611054399989,12436857198171991993578130142345431527601421927462844056967745504462653041920);
        vk.IC[10] = Pairing.G1Point(10895190923044625393129292689541275711645692532537060151731785059179418282247,15360208791153435772036310979881812787838806992068071266146643862216549317237);
        vk.IC[11] = Pairing.G1Point(18413340370432078424331746142412339903554704784869652067418110240955398563646,4503645168665817913786813198127788222415108941442032275547091033053551230445);
        vk.IC[12] = Pairing.G1Point(14766122009042103888509105265814702628423736357078043936459262877881622388773,14639780017112827988598652070207771572009220235509683172683127498764720795702);
        vk.IC[13] = Pairing.G1Point(11764743940751739286578347120747617972207917124412377446405682122185312215086,6845423006860965110697767907014551503466309588344922702773744074953150315977);
        vk.IC[14] = Pairing.G1Point(10603382326818420985485478398257477502168268159455527229876454934274466969395,9581456777185322516612334651197149639487732240703683060243990320781788882835);

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




