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
        vk.A = Pairing.G2Point([6067717206635143790365332177177420925295904947796776715881769299784857002241,3386489372804383188102869861520641249184461185702006409859237249151332738283], [19671067783598662935866365075873569325457840999498376327359373295676961101522,4767891165764793521065150746082400091843009722884025968397766036720948206130]);
        vk.B = Pairing.G1Point(10332239701619762822142474451388667919621822841923394253622196343794350051620,2664681342299784864676821663373380333123611548367701637969004668223901133682);
        vk.C = Pairing.G2Point([3574185836805909444485807670943770955015226279114680074774833748949876577493,1973069079579092694930681993198242781556774910518922071919710218509979245164], [16843727323874949839700275857536360352648387464785464999871996822900361100627,14846516350399977460704490575279939730091724527182713405082160527929157194022]);
        vk.gamma = Pairing.G2Point([21746023067682907039205796424155555296424872246031551908761388281225489989500,903747434100585502594476262498732345659873611648826587760687426627355390258], [7245719150444538412570653937433375110672964896263523387225843430198017465914,10448246689535087227833811211458091534621383489454127480510665931654724533566]);
        vk.gammaBeta1 = Pairing.G1Point(13559164425151459600585472680898767066937861224416125947854297873155655451496,1127400742740449682400575779564821277133764069308354078386976106705168496119);
        vk.gammaBeta2 = Pairing.G2Point([6034285467236065382508054829142501304948529791705507837818657167522909782160,8159656153993151518255961683000407921163058176353081350229113757546935229416], [2369609166377208127643598328783495598724940869020570874290428751058555812335,12562741577894306657689778837312963620699747347967028187390837546633562267916]);
        vk.Z = Pairing.G2Point([10945652796181068734346865112971408651186052924924949407013449190716646581551,7154790835791937774375334895617343066848424503120783239464671394645023123720], [4657203666155498472635817363516758963264388916202634529186589809048902982339,19265924606080974094935697212009938080249149589756588152803320038042278826548]);
        vk.IC = new Pairing.G1Point[](15);
        vk.IC[0] = Pairing.G1Point(3375083811519508106443039980637997148739524547629249224630312394991606643736,20521050928501579514555995881221738136261932943128333565088569338342671303730);
        vk.IC[1] = Pairing.G1Point(13687321129179839239870419173115023882425505500283226747039513092246354703640,2987481132524143709799329652562597348272766098121384340048291234768237045299);
        vk.IC[2] = Pairing.G1Point(59746987890864534039802407580371894346361900043212278779816231781012558229,19111701827255126009999310849097065750942999943063829575083000486212420501632);
        vk.IC[3] = Pairing.G1Point(2145007520844397182542059191966742300365045635240805370812358505220933648956,12961590471815127742105216341044690963748157472047413050104953397959793012176);
        vk.IC[4] = Pairing.G1Point(6849736618742604658250725721925494855617000444037286782536659891331959948663,8450225317081519438922159002296180193495845637539443175726822181462750244444);
        vk.IC[5] = Pairing.G1Point(1924316487762537936075470449520821642793078472696426627246092260323335531847,10577164637019288199308886390751787237290281424952670938321593813101148564234);
        vk.IC[6] = Pairing.G1Point(8721987132279150499838011217816580697564001341187784051046085305350786763533,3985653232891491664185887490845027168677831603921949488050780037076266219720);
        vk.IC[7] = Pairing.G1Point(15425989394740796992959455689286253631659096767881558064576531564623038763705,20145645660696179641415195838878209055338389254843820080402546480478775952804);
        vk.IC[8] = Pairing.G1Point(10406638513886078611399696106171874064822449231168259008553057845449240732138,7082111166897498975322721085900720205446556979287883223129482297086990585104);
        vk.IC[9] = Pairing.G1Point(19101553035482392576660266322577835313153464823199138751535906150037847319837,10741027324363183370349007175124686223126450306511376984662907753999990436120);
        vk.IC[10] = Pairing.G1Point(8373092678262972848250070834299870145393807780026136167937891043766454652084,10099176050260899246661410530042872546604048602053456440290238291626313193432);
        vk.IC[11] = Pairing.G1Point(12362902359130078587546147679829812882567126702358496898889336122210013437621,7440074133901141913096227632292625100679912379970536211777181724361333092273);
        vk.IC[12] = Pairing.G1Point(13086988122777397631165568804751231544098472712820092963686598078286301720847,9651168417960972404725330020741784692518098243643282432953305599228213893054);
        vk.IC[13] = Pairing.G1Point(334279537741984094071447951233525386209721114074994320710894168128935369929,13680471231038080957199235463046601774106885335157227956763522656831475080434);
        vk.IC[14] = Pairing.G1Point(15948724747861043337162272254855879272868872701026644073137751696098045039889,2027533630618074979335872288516617728948607974212826639009901680866585122362);

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




