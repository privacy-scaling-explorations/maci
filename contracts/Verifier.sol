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
        vk.A = Pairing.G2Point([21789326637000920299586842104930270936785146907248741812983474884554676451848,3663992622632155648084727593225811907693348146172905057064644034179167799013], [15296871518774726881261648138115774871187418548810128046538958150262510206430,16110506937812524001464660060175315370316499833376409232341445849213890349803]);
        vk.B = Pairing.G1Point(20930790816456979434146936229087957414240711290277706523216798881608495794398,10136259804226312656739120224390334689433357953422334333648796982305948187170);
        vk.C = Pairing.G2Point([20307349348314915747768377549570998042067962211475261803462533828468412900018,5486359163763203108725411720033587358363129894947027504393048306919355992941], [6580425690792226413337768613322014826021723199383229274673135469056721868942,14535245295411667054887765327309349031791457509749218398767789780938182264989]);
        vk.gamma = Pairing.G2Point([711862241608640876298405146520039873403463839315575703986086369038751966129,13498975747498005051634446985044188864216590305627283049521799792804119765666], [12286209417246594374504212822456804822611015908243424508073600211719725363009,10826025703168626115572241543299999752858840281240324599485173297327278015397]);
        vk.gammaBeta1 = Pairing.G1Point(12657799377072110120627581349403250492306285931363235216822609942150333638921,4771690974498930048052964524794507310668443760572948901878373472044802084182);
        vk.gammaBeta2 = Pairing.G2Point([7928168468859605686149643019275854451638255690192916296672924718676627109280,14831600053704455168724178483392345344152713108956999667115512820596113392159], [12222780738732826837529307178335016700187956233763829766033676919319852326423,3488580341352972114207992994530549927362248887038072190616625838748191705962]);
        vk.Z = Pairing.G2Point([10224449271782615124055018339217467938581000776690398255308304437017457376111,17947046410520167625809459477863765093511679309991962074509701101885716205970], [44025195877906895686731069118604309054132767623694090229105688710340046259,20221646505784797051647000833221752764560187164192539798182354312172456857154]);
        vk.IC = new Pairing.G1Point[](17);
        vk.IC[0] = Pairing.G1Point(4605244902327310433486775936239376875396800300667348675189028109301936448903,13767079388662031464886004077951723980842755964963818331825143389458486908527);
        vk.IC[1] = Pairing.G1Point(3275412809834964349209536864739218954123371804474238194536043460722935285846,13884205493351270998984682904759451144475301277879210960260407964802850760567);
        vk.IC[2] = Pairing.G1Point(2345091191983232535631966629474182226524507992189517668700974543092925872147,12707864001955768573615708196726407474230316312300330619598168943748205199974);
        vk.IC[3] = Pairing.G1Point(7791484194181025311975693948285691788241171476263219530034699785364050318550,6688507093071861028466033055930182582985419353379408274204622671069182703820);
        vk.IC[4] = Pairing.G1Point(16219197699785818219168681469575821389610371049909182951883571862448217351522,1274164331098606039350880867626671250034190505920121389869942813951695839888);
        vk.IC[5] = Pairing.G1Point(10076130450361532590733360840664906875796115824785588031030220649655533570852,5873663147339392991205856150878313385271164439573444286419452944054271646697);
        vk.IC[6] = Pairing.G1Point(11318699907315426627708630757779047444950056997872305165516085858341875267691,2327505431595508027543801358335271715107253978474428937996464587654960193769);
        vk.IC[7] = Pairing.G1Point(10835222754507173831837947261060910888566992227295669621735882100027037135774,3809863045493401389817717579212919029650050514232454097193029317283854044686);
        vk.IC[8] = Pairing.G1Point(21315053415160310751501347254199653241500652405598855680127288967158676105222,2411265908659741076116913381530801894362336659521946490397455925887967393629);
        vk.IC[9] = Pairing.G1Point(18557192805695722705334897523627991312437382136521708324753487228058028884142,1875218770872296830394505345124772272674416221785237538245173862371718795456);
        vk.IC[10] = Pairing.G1Point(2651599143599281913432014580547792397654277270574133916141585617045078924761,10679464508722147077475287239582934667348853373341843449232649044739706304961);
        vk.IC[11] = Pairing.G1Point(20306424323382305640188446757538068634539478165497895982852287694060135716687,9589286525734205826753591371976730211039072689479669460757289172962849199784);
        vk.IC[12] = Pairing.G1Point(15159618320551167373770386387683507660806681694590749206402980753261449251350,13132781056611580843743909457639501031826378774031310014588631952715569192296);
        vk.IC[13] = Pairing.G1Point(8059065229460812247675279596930893523496968756054234311192407196006872060692,18443959746084826654983592474752039582661983669401675444988687461882780501600);
        vk.IC[14] = Pairing.G1Point(823975069399338585102854186602786544311862527421849607389665288178854931255,17305688325512671598100704815396816684213381372473168676796988413106738645580);
        vk.IC[15] = Pairing.G1Point(1888472935253031178351335753039682454870963696759525722834215793832317859286,7180757304675337277126339642736240624837039728369656745628386973031078172307);
        vk.IC[16] = Pairing.G1Point(12469202333856588332288936441987192191640889885158576283615268318865617525585,15730918407624425869940899731812055501510714598246055377400351447564985612559);

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
            uint[16] memory input
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




