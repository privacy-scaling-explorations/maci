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

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
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
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
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
contract UpdateStateTreeVerifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(6168495045417176996331446253360990836821168384855619942319982708099751416377,8260037839074951720280443927867460910697713264586661600193065024504922820932);
        vk.beta2 = Pairing.G2Point([8042889292657692299030000411255961876675948252856087118121107998448509795818,4399561610071115279030136508952591422491008534108558187799544399365207352714], [14054851889693925312349857944138579492395127720661608969661812255814042550555,11787585497078428145374693754886540033808271447009886451112890627999321910567]);
        vk.gamma2 = Pairing.G2Point([6278350283586611330935283949190329259985743041967745696666160017310870009544,10586019417693924850069972692146308272517135244973374898157348183924297439685], [7948402382135572020664819324211806104996386628340258221708906157994170087416,10570978585562679023978994819891548686874149770064359580984390496657306813546]);
        vk.delta2 = Pairing.G2Point([14171302620330564578548891824199701391782343893589905085764495107215559756935,6507453672980978238066159471324672654684186827897856033070156260477127763526], [18532413731745743178068695301856161384906850079872338537140522692662330560790,21156308672366985768119133658627724650051464487416406048750419100152814392393]);
        vk.IC = new Pairing.G1Point[](29);
        vk.IC[0] = Pairing.G1Point(2559809654396636058108157698820161232897915405422115571882088142384125488264,6255819760427085138471877646943794160914348753916827246064354040735143440413);
        vk.IC[1] = Pairing.G1Point(7257450329299325631329430646255461279738438828141853375125731273563547717319,17234488619639771437125968283484017614930485414998841525096327888812942243553);
        vk.IC[2] = Pairing.G1Point(15109223656853556384289352795428969881448935189353604084795679692960510605288,6788191744963282703689643109176476368215755735398571660543519437847571549979);
        vk.IC[3] = Pairing.G1Point(3243112690897480140333931987637334642980381681173016436454978852382702156543,7925188846799250100186025124598841338190791175052097001353469601835305110694);
        vk.IC[4] = Pairing.G1Point(4837622934760172869824122708076893510756571263291061032480170925721391896891,13353616164192834101843663523675165172097372193058176224398342508761887510325);
        vk.IC[5] = Pairing.G1Point(19662948805871317989909583218333003614781280915989791239044781980726945949488,17998922729670847488294436719851905004221771142601186757006780652604854520898);
        vk.IC[6] = Pairing.G1Point(9712768583051149664661717223531857867884633569275924599511836250847632890163,17304954163798687365087341658709161211111181278429205394685940255956453876790);
        vk.IC[7] = Pairing.G1Point(6901553082223464686882431943676978205198076222603886546166302977498902631399,16635179675666644379659326372430947875132099875627938727515415414587014889191);
        vk.IC[8] = Pairing.G1Point(9975732208053564772642645884887695738176660540059863236467416529908825932006,1203688078696746012945312220540057363525232262889326352963238463739473227153);
        vk.IC[9] = Pairing.G1Point(6217769463187585290646429575559045003518719234020417428105361202818864035199,2906777695001322319205090677388515086040862735900169862263901807224861228652);
        vk.IC[10] = Pairing.G1Point(5967500778256610808436119605154999970633175570152008403122368185607357160497,13916258808138270385770962681486847527202772970901014959509785613506515254337);
        vk.IC[11] = Pairing.G1Point(2720106779243106284289808926824392808664238029385880226151053382294948917314,18717328216650983308140699530200266204350562842671988460250255301132285930877);
        vk.IC[12] = Pairing.G1Point(8274185231803554940956516574963838223761418841480079293826813102107926394872,20974380771262518843880289577730387762007465552691280544704683738111041760142);
        vk.IC[13] = Pairing.G1Point(5919280041281815054446029904241456320272839314480784538472580343932668853568,251301665647988898979586245730458865015083386698695559535834512161138341569);
        vk.IC[14] = Pairing.G1Point(19809173151691673053980581112476700048064186794487325699139660465267935083731,15255235130080908361109923455034354399116761436431270241415835200541261619415);
        vk.IC[15] = Pairing.G1Point(20554173727381538361502301404217930321465739121878437170183139541075852814809,5369267930504217103562806335971038960083344096685185098640064585141644165211);
        vk.IC[16] = Pairing.G1Point(2333267388984283466978440318780898838684236881537728689175282917113486129393,9860780388161436468551665279903162835808400568833473941412942826252841444135);
        vk.IC[17] = Pairing.G1Point(19493835150491367610743203171262064356396574447064428346500041780126340706884,16242880067042543242785399093722134130539398432841095995033363360807914225710);
        vk.IC[18] = Pairing.G1Point(15430848931886625093649708271117546059728462032566811827446678407546844348843,8490162928535750578470077330887840994364500098611338248932423575412176524461);
        vk.IC[19] = Pairing.G1Point(16391881316454375650516424051961792296689350357309259596945918351425872713137,16078770646500180344133888310667644793371567658568260734713756924001466343541);
        vk.IC[20] = Pairing.G1Point(7970588325155079261239131977377250064214861957806229479596396159179312590353,17112625304958048934405946812534706165861811198831432490187242759344920862176);
        vk.IC[21] = Pairing.G1Point(6831295784448333219349164629705942459894167019417019636128403720543469844105,10056526777020118896629924574963491623045966973006950887414922403474768989749);
        vk.IC[22] = Pairing.G1Point(11707161111992770384609187529940629049553849574916397590047427695492506668767,16760141631291237892815523571665224450525967844757868926541853726495380949809);
        vk.IC[23] = Pairing.G1Point(13107584639043768306377725301858275517904750109601840476955828351660203257233,1513906161826195246271555479815713132548705494418191641869388343886352729657);
        vk.IC[24] = Pairing.G1Point(9941078548511643723541485494445658486728871976101597127223429576558673397869,13141386566579854818247564394870685619806503924669946937970776861337991412084);
        vk.IC[25] = Pairing.G1Point(7826639087500337673711155178533375491885637931859675594925675075422557410655,5929974133882677380900016899355255714531809344464063189084075701314771407565);
        vk.IC[26] = Pairing.G1Point(8916099235363021522714775610199643875401421399455388335418399593176712144690,21234184149478045795608364034556778398829491059978717311907742668779329963989);
        vk.IC[27] = Pairing.G1Point(799599934450986667599716904540754137705173089028026562982957682612239599094,13253996413290240280351955828497106183635277582531500723414133491017529179427);
        vk.IC[28] = Pairing.G1Point(3760171996481807257482878158674325051458137245657940345084895332854767328594,3508767259915258360033149550710472578350790311858500058940505815118763763164);

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
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[28] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
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
