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
        vk.A = Pairing.G2Point([10250722059800633691211510273951767144960855300593857963605349673121864184705,19185541911036449987781727695675244571298598083198242371811711582891068255529], [2703448411262935180318101461370766526880625587179181968349565940146023371054,17830600388080922570424846476736031659369759670379018289768131978667548180612]);
        vk.B = Pairing.G1Point(6034563104575096210977487179270644291319937800906919891105572310124835705181,20601286417202679357417685726973039717000816521144347603409683498308555281354);
        vk.C = Pairing.G2Point([660808238823423798775511923379566746020727977955510519155092858388298251674,14879042179025004238540928591472766517335797646685126409291310744721021187774], [912726155985135931669205109288062920232280887715099129894127496022586140329,5664603166058461004453000281075983697588106175374075896201835456556254551043]);
        vk.gamma = Pairing.G2Point([16171587308503104343371063708441294794640299511266233353154904445856964443502,4780878448230954899682576326536057644980938912589608832411971080736163485166], [19648070833481946182117450569356580856181248043243931898688798417868206285928,7390542064583461034216113643687869566694722419390910443039313839557537182639]);
        vk.gammaBeta1 = Pairing.G1Point(21811809961965951274374198470451844829759297748265296014465883139902034248747,8572950444722754125087994396052281366131735322037276535023545395384554795878);
        vk.gammaBeta2 = Pairing.G2Point([9467863799775240836519993457211151550268461347758551002174217714426818487097,6311187171655962035899388432906971766942799449291010437575333018942010920786], [17288316811956712608857856471233508059604684312220794582328939480844659499631,10098258136693972245974614178328138789436166375104940409758977468546053707475]);
        vk.Z = Pairing.G2Point([12170378779296050211344795689397270697257385789987779400104954315603924103180,7338429911414207480993882584665535594609442081856467839029747077098031608463], [17729690788309475949518775187135220102475321063461700256931375181469876007956,10742563159192529684257453509956249362820510653824218680201514526758979554835]);
        vk.IC = new Pairing.G1Point[](15);
        vk.IC[0] = Pairing.G1Point(17068503652344678394330560327451288753023213118608850140296462718026179830951,10004181303534871163357379617526703900001636131069496750413527316918113047541);
        vk.IC[1] = Pairing.G1Point(10568890552437611195524830864961014252993471440325235477938361014366314693931,6197816967153711776041611196404009052334424245286737880480297069516284461498);
        vk.IC[2] = Pairing.G1Point(18204377869985772557348530965483045585886940727239637046649222904853646726108,12285563615436168897464516236996853840859005944477312639492720241246510850395);
        vk.IC[3] = Pairing.G1Point(14512559746496117018994717296705319300707315263770057761740266626525183220064,18609556826199465421340275177970788668412478288988562149377533376610851219304);
        vk.IC[4] = Pairing.G1Point(12022723512800188594724271254299614978163396477226716648087646894975940850274,16846755806835668609424239692076806354041634879431776273977840448044678265822);
        vk.IC[5] = Pairing.G1Point(16648066891304545569324550384632536503243418031151462525697029998669944620212,19833277416271009957196666473209585046714301640159913623326583247988186264374);
        vk.IC[6] = Pairing.G1Point(20240316217270972478216816191788307505607111973919398036845693909934840007389,13877146321970677939060260292846677569914246352118239299027051893841578360577);
        vk.IC[7] = Pairing.G1Point(15792003757187206989328346779725983597585563617989511399358197225906647699565,8968840029727280424033552677620449340766915692882453576916786740053402583223);
        vk.IC[8] = Pairing.G1Point(21660869461555143751897980707667269026951308870413803260673813517667983534223,13402273115670920899534676944744438205329454697187870767991141387871867551139);
        vk.IC[9] = Pairing.G1Point(10543192513115187069390850899446934529969113093102143055078459867050779234434,1042468496999455518761050680546182626830951837386994272299528010473209221144);
        vk.IC[10] = Pairing.G1Point(16636448021665880051583971345833266964719240319506174191902447725912347187627,12182917941718339532000435618449712271039712155740458554024071064674898504315);
        vk.IC[11] = Pairing.G1Point(2996255279171163957577246647620560006821181935583910722573307685593573121066,10228450388885631019420346175159432801564475414134356217545480457250052962525);
        vk.IC[12] = Pairing.G1Point(14243842396687337334399432984009940331862285545229097803858099589905389950781,4443482700845516772885409600109954262463035344161024546541681363109155342433);
        vk.IC[13] = Pairing.G1Point(12706190730791653242473682549268870212839421006328392159376727473631748504275,18193651199136156638561520959732369632087989621272233225109943406315569509621);
        vk.IC[14] = Pairing.G1Point(16740794116633175277900768302719295705888199218836186415999407094054416745711,11874558492025170743816099927590807957993409654260817721320647187923325153521);

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




