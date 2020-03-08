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
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[20] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(1881186241671765703260445379655376034321703680267975249494175955799272523702), uint256(6327362426579978706288385876025119986081928233817879018922059102438006831725));
        vk.beta2 = Pairing.G2Point([uint256(9410928845457034360923421170385139379459327347383845979071348355379131234535), uint256(11039777476756709132599258517588569384893376990878264687826647653305763313331)], [uint256(6742057800345666292285444236510887433949598078265864868201469238975671282063), uint256(11300116551943172308523252748324564269392151795082733826473764892612322057526)]);
        vk.gamma2 = Pairing.G2Point([uint256(7775861021289207985722412605984707536131200714152632485924285910568432883996), uint256(11754724402533271370452969764899598953585979796709168481336694968554807451733)], [uint256(9625650318310296893974525883940504179005331630922205401742236127154542842510), uint256(18044095247265776398875660681916086403905975762966619331851399140342600893953)]);
        vk.delta2 = Pairing.G2Point([uint256(15024745390204199948625850712115250493424408649740843317582203854964628141150), uint256(13665492409342947363210304841872980467678508539264965231923033097214064846454)], [uint256(14759771621827782971779960319999329796747298920540616215801371058815881516035), uint256(4973514067345154670771073952446682850376297388299073941777692005266034136971)]);
        vk.IC[0] = Pairing.G1Point(uint256(14368214106387390641204109350400249681229877819280001618970265643529317003671), uint256(19472469431278322543242728388478268856739220455984748314198112821638262626885));
        vk.IC[1] = Pairing.G1Point(uint256(8050832019657171065155466111173053698151181845856545684480852164224806030023), uint256(19928028115736525894656967540956741840587239071887012763769943253103135205734));
        vk.IC[2] = Pairing.G1Point(uint256(14713761124629323803128207345324466122839924850254713114006253186404108296765), uint256(2053048429595847464011599092470925562756503831889549504198930143015329680922));
        vk.IC[3] = Pairing.G1Point(uint256(18834302599938815653100629212462649918600041983142417106701390334319948067050), uint256(20836826365665749063772635494611733479297960953595074107480848637633709288780));
        vk.IC[4] = Pairing.G1Point(uint256(15622628773407801901994605146171680192727684478341216097731463925001922110479), uint256(11470158728740588733360361880062923337870182112003867637626635525146025669642));
        vk.IC[5] = Pairing.G1Point(uint256(5021219008108330081168932180340634072541811132062088075860427537064478175219), uint256(5733070986947109853969099954680580661124372428145705617781991206929397413101));
        vk.IC[6] = Pairing.G1Point(uint256(19041401513893171781832099251280891757198699716058261138281021748587927825503), uint256(5490486448948886958518066082673001830746037343917549301964791655287550985856));
        vk.IC[7] = Pairing.G1Point(uint256(194680561231083694346194135874521397836975020802650160873362853820473275409), uint256(20216277095464113159854738345506728411841974266710110230189883524725892997320));
        vk.IC[8] = Pairing.G1Point(uint256(9560108323704997904099705288291877491035183594756176363149727191229379355006), uint256(1176950462483494704026383392940469036896085431799923632191651786977303271320));
        vk.IC[9] = Pairing.G1Point(uint256(21192008916711947311288191833327130096840542767535221500865130435086363392471), uint256(2644761293408022045138160655551311251270192696507934721333962047404647127404));
        vk.IC[10] = Pairing.G1Point(uint256(4337826163923240733171946409866628271048929850135572222665538431628995765067), uint256(14194320415578641600418172936618756033971284712689957180795019460037241820565));
        vk.IC[11] = Pairing.G1Point(uint256(10382319285268547017053903224786434929631332397298385726495486273879929207544), uint256(8956172706147206307346961997521989486170548785627143557135658302603068828570));
        vk.IC[12] = Pairing.G1Point(uint256(12636061304663903466268416970733997086698432942284119576432998568315776585497), uint256(14044063007504016473394077666395924100166699794008668594324898468970159759747));
        vk.IC[13] = Pairing.G1Point(uint256(7020410194697833513713385824793122888110167483988785722669912300213560560874), uint256(3103635990571565104639237646716437800954727770179978813194067019330584964293));
        vk.IC[14] = Pairing.G1Point(uint256(14767322664048998232830891796584072206783511510032004704624876839716148259028), uint256(21764331073420679432785982143468713808118757302837433244094557188830599410972));
        vk.IC[15] = Pairing.G1Point(uint256(5756891225141048778153314468562316856360933252976588486596528351488882176595), uint256(238239209801366455183849675955487912343297842764612725879705777433121332887));
        vk.IC[16] = Pairing.G1Point(uint256(1914253196170626213937267530196741210388274133901932821883213763786958370538), uint256(8306855953730502715087701229237588805415434998861311551081155013317915257758));
        vk.IC[17] = Pairing.G1Point(uint256(13508166164568778201655902568438188585222545113049611400376272175360368508633), uint256(19296682048428367401483665444890496417869921242506454033984948783241029341115));
        vk.IC[18] = Pairing.G1Point(uint256(5721800813458692074356943213449701988506322027265243629042523239708569252386), uint256(2098495135929803867171364937829164639855609685766053965695877876147008985756));
        vk.IC[19] = Pairing.G1Point(uint256(19187351531675154457210689743684070598416410648104821698780000635402629673123), uint256(4207122158813305449832577113864570004101367771424623970939402823358867427107));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[19] memory input
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
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
