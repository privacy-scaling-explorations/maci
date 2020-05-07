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
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(3190327533350494955018060110784949856276920621012424847570045103628037287492), uint256(4094626990498919428154660942847285334995385242108751523948120360936021167419));
        vk.beta2 = Pairing.G2Point([uint256(19198275243761375251105220387614238220686155706773355558006863129515293039345), uint256(18930845370246000222985395797480231707885343303977395864901173573115815469709)], [uint256(5964047350479366717717821363224103941606942451707325442477556166749796049762), uint256(20240639894728997356893538095187961131178606249228221653051144132647306450349)]);
        vk.gamma2 = Pairing.G2Point([uint256(18465048159231439660037637466481252061381163437484909187763375611718814409156), uint256(8121560987376581593879643034799612244069922022632300186298294622584430698310)], [uint256(2110132958635389152251026035375124296050543488221836125905426242551430403084), uint256(6096273947725174040720016267496536594759923703853121799675620499022617929643)]);
        vk.delta2 = Pairing.G2Point([uint256(8583390928909462819425880743590487235008912174670592316955725629825357775466), uint256(7650110767332242864958025473005326501254672211502756526698507172470283899697)], [uint256(21142765637799382980051350817090831238270967440800269131043585032987354244925), uint256(20636676774776878994865827873196685287680405829969969922167477168726493379701)]);
        vk.IC[0] = Pairing.G1Point(uint256(9498838932025412550284266212093711228631683264271709683194878962423252007027), uint256(11148211287969751266538309613712857595487913182353227644621023905527347507731));
        vk.IC[1] = Pairing.G1Point(uint256(18790104041582022046698455496688793479827126666542548872396759290129566990600), uint256(7304132457060850514206567283332500060041516755250292716564703806117160711512));
        vk.IC[2] = Pairing.G1Point(uint256(20799953821491924339371178866589797649348955325269907678377221639995827053886), uint256(14410187091064645018315019140580790805150208618146397857446072425987697598231));
        vk.IC[3] = Pairing.G1Point(uint256(7041404360179105748997143964401289486854031044880229081154911213404856535601), uint256(20976084282373659068875883576796725592065111451839981120683730839804429879001));
        vk.IC[4] = Pairing.G1Point(uint256(9865512736271607927139674327841228046452265596251029779825185128395930181233), uint256(11887887165534620355339872071832812703409425914988841966342900589631748181260));
        vk.IC[5] = Pairing.G1Point(uint256(14738155375768509461925464953073534433562644625084735109128126301546066011770), uint256(16059872583534620527961638450017738031129512749103420889209045057932719007026));
        vk.IC[6] = Pairing.G1Point(uint256(17209462481675545465507857437139314376439472376081768266319440360230977303087), uint256(10301626028670960961431071048802646045459119300527513606469446357943914243782));
        vk.IC[7] = Pairing.G1Point(uint256(5758373466661714127591616639962415960718424095828520968262455336728882568797), uint256(14338883109680619119992078178858453621383963303649498739270178916800796474117));
        vk.IC[8] = Pairing.G1Point(uint256(19452110979528063264621221526827932279684959867637602784756753694075647754459), uint256(14446692334915693459603287018673167558230223286486443908057608346472913453639));
        vk.IC[9] = Pairing.G1Point(uint256(9025964431558350579366180029031744327339731908839850858288517280142637124828), uint256(7925708496098990671022480991405526582060649721584750107433564876719034781616));
        vk.IC[10] = Pairing.G1Point(uint256(18710362547011889080114259462556283510772734505782394445351799719820997902588), uint256(19924752399259192363795895123822622776804063200389504887226120542833204396875));
        vk.IC[11] = Pairing.G1Point(uint256(12895169782802655061221688991992028906543556712447768119750670866784629958852), uint256(11819446875769468344878122260284182927555260006620960957380786830419313144791));
        vk.IC[12] = Pairing.G1Point(uint256(5394860763153193630188700592816654237281594384662080943442525764640897203697), uint256(319252945177281558343015602635019476240077945044312248411572562165386137855));
        vk.IC[13] = Pairing.G1Point(uint256(10330226208881785827987604876749572724460030560139874412481846928868561636354), uint256(17007987187904206833160672830313731622480232442747326848121051703760498845515));
        vk.IC[14] = Pairing.G1Point(uint256(10969183781696330831515176770092376118342406783002233050406016262558461797658), uint256(1831535007695955729892775696862322271104414987875446931234536948911241186426));
        vk.IC[15] = Pairing.G1Point(uint256(8875611951945146015023109550913479086637723842704769844101243852720534871652), uint256(7905850003181243366799403397074623718231625212890906221698741934715308363180));
        vk.IC[16] = Pairing.G1Point(uint256(5543208585714839580012513502675189034688426293541121412614216437783695150837), uint256(2133211991339847296238662825894606594693940744934001698738669055041906599659));
        vk.IC[17] = Pairing.G1Point(uint256(687426915078852961811612337439191721106669500545606329911311201171168969301), uint256(10583629667596008715491315609925976320596120241089738666131604207529253630110));
        vk.IC[18] = Pairing.G1Point(uint256(1022064755661380191966715443086523908133580403847529680259347061452998318085), uint256(10576457886141124428063761888284912668163739754126657975185457902816296623223));
        vk.IC[19] = Pairing.G1Point(uint256(17994110130686020524322521345204176442161109930254924826925202480134081912875), uint256(14883241314629597685171943460205628064396207219513694887164950304979470749000));
        vk.IC[20] = Pairing.G1Point(uint256(14311793609689208600421329792167654304266458465690811767391329512133101595981), uint256(9197833712326669813811446318068777243754631364111121854654306565688119042655));
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
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
