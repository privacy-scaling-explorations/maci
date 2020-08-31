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
        vk.alpha1 = Pairing.G1Point(17349566147763618416857802277206650741198320871548484396349630690104723767221,7333974963301268919314405120765180027992699193854271487815164632443806599666);
        vk.beta2 = Pairing.G2Point([210924940203440965756746750684318369198957167428851323070330515834842460840,15017193154257228164733674219459859662058807796793459089298734269789830608742], [21366002223818943330588062768971971338183846540342171786325223880446572810262,414129451805017772292103885525262415125517513868593822362993451969916264330]);
        vk.gamma2 = Pairing.G2Point([11559732032986387107991004021392285783925812861821192530917403151452391805634,10857046999023057135944570762232829481370756359578518086990519993285655852781], [4082367875863433681332203403145435568316851327593401208105741076214120093531,8495653923123431417604973247489272438418190587263600148770280649306958101930]);
        vk.delta2 = Pairing.G2Point([11559732032986387107991004021392285783925812861821192530917403151452391805634,10857046999023057135944570762232829481370756359578518086990519993285655852781], [4082367875863433681332203403145435568316851327593401208105741076214120093531,8495653923123431417604973247489272438418190587263600148770280649306958101930]);
        vk.IC[0] = Pairing.G1Point(16592902895610128967724550059720562556657654156700406825731401604640433025975,19695180387386137559140208045431031968463847111561303568229831635775948471064);
        vk.IC[1] = Pairing.G1Point(1619359018488834807524313851193417818994777067263971507569843225383652383425,517124395528603127832836953288148969760130995675949678885512115186759560757);
        vk.IC[2] = Pairing.G1Point(20682529929660468675556315173297911281223502653303488632706591682327544400743,18698137179280786565549764232237126396762725193087309268702583551158397868296);
        vk.IC[3] = Pairing.G1Point(5231062795466349713182185446855432321494739587077215929492894673310587909475,1795150780529793212370021939908507477118203214240599470494503397332677243705);
        vk.IC[4] = Pairing.G1Point(13534863157472262176939758069408297475263750574402271759213571538963561070029,3081889748508753551543838836057149368809755440803549326969310692837113952310);
        vk.IC[5] = Pairing.G1Point(15992288365308504843269079282966361618488141839513560729218458363699623714923,5747430703262429473309139798054059222334741158138608385052524392681379485600);
        vk.IC[6] = Pairing.G1Point(7366040159067367123556421105918694787954635697593652728829279040294293611330,5211352258774809105960816300878102359799287493430935129805281658030861021147);
        vk.IC[7] = Pairing.G1Point(3107416397533856689221349921164485574181823964063255682581888579890380805751,13474460420542304978263225959809735813783481008176387171962104610663718579120);
        vk.IC[8] = Pairing.G1Point(4049076621146748561701660447303764729662710068944066512003697265217572862723,20822102694204303862778518779881887462255256965490664607866136670046388741900);
        vk.IC[9] = Pairing.G1Point(5510040642395091400479382072894763658418141652160832606515968745464123162445,3219451838278080535562061739179010393308763659306754270494115800993987202131);
        vk.IC[10] = Pairing.G1Point(6600940990996537994635424254160869367173229199796335133969541350050335538403,9512084822439543432647345466204316500720957640983504177817043591059372445144);
        vk.IC[11] = Pairing.G1Point(19437018598311390782040553079987199848474876374568511235338028002136452623066,10668365775987720279469061260887050704083982411440332463256129944666348635394);
        vk.IC[12] = Pairing.G1Point(4474938374257824257112992321262729848627424732800070686526075586881414937948,20986478085981064956035974319091096534937864145154013442562873160549274990102);
        vk.IC[13] = Pairing.G1Point(9162657185805428863992247743288432668995166042992292628575124785152300423594,14323008934065553518382129631641864886129536675147334601827053968466916609507);
        vk.IC[14] = Pairing.G1Point(21008792998525419657345373058793496502254116502943909681992060666346264035165,14763865038706924437070351817813030842115242329652797269587680488041591489722);
        vk.IC[15] = Pairing.G1Point(2852967679400270951590946901942689859987926806492963399161645590487817348227,21729171354534829021702728983496925946050462536667396413533882150448471950639);
        vk.IC[16] = Pairing.G1Point(14159436935764006764593055810689401179359039578528052909763351449968673269827,14420856841375110316512274589393325968072702673820231890416723764826763660400);
        vk.IC[17] = Pairing.G1Point(4167694178184913795435928285890542558768300203733577386924365671719848128976,5596959898200036099772228145373075028865969851506501872085297209126343240437);
        vk.IC[18] = Pairing.G1Point(4015144398247886577043982468173477757254206319478294716188184551853947297944,3026117990030062934698406734252690782761508675841205151019233039911324414717);
        vk.IC[19] = Pairing.G1Point(15492859851038459244258008485569923724345565481781150455189957635558076946413,21075738204930637062171582529336686640743851661680030718919245325907725594646);
        vk.IC[20] = Pairing.G1Point(447483842017975166179368364862317252563726722234308750657326704224851189777,3916949017570488871634414793252701889193414902554178616660545127534733067245);

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
            vk.alpha1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
