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
        vk.A = Pairing.G2Point([15425275221294981218639327158058517403126041554110903518489962123945304314258,4382057376054704069775993303860062078976564880739531910119890433636699333477], [15639617005686097049787497901525591299121573948432054717422625756182942536386,12714217863132518734094754861972761437325845266747574850963629152158143229708]);
        vk.B = Pairing.G1Point(7153608543191946614263606858877278721782448327841409165972347973674768787070,19271829891558305616654385502832536987857727686633104009487412396306402758880);
        vk.C = Pairing.G2Point([18360020198426419159421361718136165842929308336490376832617383179851011759071,8963071188728947302261667738886133396407924891631434967602261703940912367446], [19218525437652748768845355863388561669986928401842167916713454584477804827090,4588539484797639516606388828921476935411199001410951709922740945057065738477]);
        vk.gamma = Pairing.G2Point([3892467529519526339214383764574924280259195892825436181577701342799621551114,12165694688120048978284280410715963110440836045334649972947220934391811980337], [16943134562057249766523293343469345114851336608865824709248838904358649286528,7659719445059335711596048376246622197655167326206727661332970976189624746030]);
        vk.gammaBeta1 = Pairing.G1Point(3514181231380639534648253767414648283916672551916225848852550918222520827957,16233269408925096517694157638174689557964059993907535815497281873535674138487);
        vk.gammaBeta2 = Pairing.G2Point([10948853122830256839389853836127923841119387144893430149062799769336333896745,8123194812511968870728439024029684624988569474711560195435760070133626008352], [6833277319500345348862205744209799540489437179952330719209813025599363501917,16607584598891799794741373404903630938802947280549770306956685730807321542339]);
        vk.Z = Pairing.G2Point([10518925370734929309380648733754256889112165659495377148645105780731457618273,9254198788178577753679713850572847416888513140003916847867424693616267921723], [11583345840846189784136709704365406006815962847694099854126062482484490828006,21345271729904282744880856056084866189603886698542273168413946116740893340507]);
        vk.IC = new Pairing.G1Point[](15);
        vk.IC[0] = Pairing.G1Point(7810268939594491551364383816617713782691628682364245386860621909613242869511,19887280816538627754913735681358970901423858229097143032058464435890273654544);
        vk.IC[1] = Pairing.G1Point(3157284508008817205152060196437349552797536479696660401283602989996296493636,19545319240608961229951044389323493771733828548018865741349989252042132625541);
        vk.IC[2] = Pairing.G1Point(6664252101236271566877371412461338195433202967809143459866746175971762984825,6664375905401229968054037311546082115396908039153746704280605139534891047946);
        vk.IC[3] = Pairing.G1Point(2043427199381918007513495974533096598905692055122323854078360189339964977095,18508763567600691219542226682005987723537460624540773619928139140797067697492);
        vk.IC[4] = Pairing.G1Point(20155320948226352607877806059016593612791091969628882164149767488963547276899,15435090847834223955817586512950169307204050761531295436647490759894874352273);
        vk.IC[5] = Pairing.G1Point(18118199336629081814197590807615291218278313130993512490444217114722262891312,6905328143643120109076625036087776445910885285254944792380198793790859481935);
        vk.IC[6] = Pairing.G1Point(10672542512830973507056156243609994557168610033211139782539189039985643529227,962966112681739271262844091706182937428853164194594177848257451709707641209);
        vk.IC[7] = Pairing.G1Point(20550314260581160428368491760368487354104671488779802006134339272868978364447,15759495961273243343018112460988392150677591389160345665614752470732215134091);
        vk.IC[8] = Pairing.G1Point(16007565171128233052559442739922824106611815782348190327424348876966081862080,15669125578142015703316392645520903893939279411100538346153595655146379779237);
        vk.IC[9] = Pairing.G1Point(3330027117483552158861840590304909607566054456904340286470052432698944011802,19179956069945671819112063392061407967192491572744859322311520752763309564289);
        vk.IC[10] = Pairing.G1Point(9969329168067045165215973854047209185362901039839154512960045278488799332938,8229039933085505706823960446687921295812884505907548575027425805731415165611);
        vk.IC[11] = Pairing.G1Point(7151750133805503287608621356871343266420165814907996713405323628597069800558,1674131674886623210465947547775090189423361176683437419932609113968860532038);
        vk.IC[12] = Pairing.G1Point(8894043099035761597491746508601260389314448528973423514429998951775516631225,21221451289279046130321689053744918883542397512667381367947416804355545003134);
        vk.IC[13] = Pairing.G1Point(20928860621975355087855892168823286732558308732153235713143266357044535234530,19838216778162302174619839984033791453873523424285783641855357311249411998979);
        vk.IC[14] = Pairing.G1Point(10684679097369373172403603337593658370684133251973366744478897854486281519631,12915903839638363055693624336033137632252811253377146983659330047706065837791);

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




