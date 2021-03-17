// SPDX-License-Identifier: MIT

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

pragma solidity ^0.6.12;

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
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
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
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
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
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract BatchUpdateStateTreeVerifierMedium {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[17] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(21082225710468145288248211664337939313452462654557314525516944366189181281096),uint256(11224517036573986160690021377594695400329998903068421341777925464398037244708));
        vk.beta2 = Pairing.G2Point([uint256(5191739955958968419294352623798373168609651900921010628169617881869734300023),uint256(8592659742246838739276770058919028534501488965817963820673106438123869366369)], [uint256(5714455387550552926513291349909156092666430969259005893449797712023574943480),uint256(600397911552002990825851439142741939883266501706083153508633319105964405549)]);
        vk.gamma2 = Pairing.G2Point([uint256(21341212691759902595829754525488003919691116155359778441220489111356098157569),uint256(1367959183001989710765968889962742913645537923992010192461311178832497456054)], [uint256(15704456341829800636368759271236265522331462502003435481114458337214670971633),uint256(17339483385395846754300431696280115613755310762970350220775964399350940024189)]);
        vk.delta2 = Pairing.G2Point([uint256(7531350787471876972155201697523864760742029345567027909410459425359398615450),uint256(15298418410466218772360921502090044364648168373976944444837575314812588618775)], [uint256(21587444146922158691603017445183130571841084048470353598149691754388823146888),uint256(3357378009400267536809390672810111450056044056139809211168036068525450859021)]);
        vk.IC[0] = Pairing.G1Point(uint256(10028862436375626620897090727469749883659914932534852926175322128990171058170),uint256(8517112744083477258757235230638067477697162701993847562862520371983714915808));
        vk.IC[1] = Pairing.G1Point(uint256(6033051550616562771004328972194428777247621874287338141573491739951193889842),uint256(16997057763275248374950465790243715867660213211937128365509026266646318664288));
        vk.IC[2] = Pairing.G1Point(uint256(19093215447570979170234885444381319131236329472807770934026238236846543021741),uint256(9384989570166240698024451277547829819272079148737878966926171620769525480199));
        vk.IC[3] = Pairing.G1Point(uint256(1400267737540335115119345896726072659119258080775817225128301851975571232645),uint256(3720257960224765248216692766486628229603203108889120008228624282241305005333));
        vk.IC[4] = Pairing.G1Point(uint256(13657104497770242885729439406030525090371431762931179163992381355294940149227),uint256(16094954681589743599047565390833634922835995156058959962287484705514110972327));
        vk.IC[5] = Pairing.G1Point(uint256(20106603038582547358753509994735442115898266514811471389319439864641658388116),uint256(16275573113487733268595734426767039398650532912816559644823125770156959700429));
        vk.IC[6] = Pairing.G1Point(uint256(16320336288617081228044504960763434633703588299713574790810298137873840290281),uint256(98361209191833011121253982285880968640486262902287274988672572651264105234));
        vk.IC[7] = Pairing.G1Point(uint256(7459367754869210341308111779314319392802860989403893717094286240466588406817),uint256(16973714808435846130040094592839666827656897079265250937532567662997178587438));
        vk.IC[8] = Pairing.G1Point(uint256(9511779989759979790000368065233120487967439152349722807754057537268399264520),uint256(2438458901132792306702840273151919899982884031875355163048329751992627213642));
        vk.IC[9] = Pairing.G1Point(uint256(9519344399808368761907503780833667149720701917233655685486877407234078100547),uint256(9729244038155450633315275182949013720395309591451248799634338398804014285755));
        vk.IC[10] = Pairing.G1Point(uint256(3142705255168310267646583781039084344424379418038132406429997918819501782690),uint256(8213729160019025197002080393892018645461533575341754725352548981296563979485));
        vk.IC[11] = Pairing.G1Point(uint256(17224761859514912181420922141930536523223833196368743936850658597405955493151),uint256(5581434558404702224640604291108418487765403771637454220217588627567306245403));
        vk.IC[12] = Pairing.G1Point(uint256(14608341698849659451240846338417815824490987980646331083393582629611495962855),uint256(14972773206037841300760369820689028091479926344067517677304854394046728569463));
        vk.IC[13] = Pairing.G1Point(uint256(3387153648908794991938251593178678993806566899671489518215738055786421556246),uint256(19764285566973211952442631156798163204265317624539656991024167033245080978394));
        vk.IC[14] = Pairing.G1Point(uint256(9065608000944013737950845828375617091754302270071788498872083777492881730250),uint256(11983007645552236343927138163750937347516016439428892634820400293889319552913));
        vk.IC[15] = Pairing.G1Point(uint256(16302364899146791538982120196350024644876906353373452855230334347713453874635),uint256(20505235982030407853414530276254619263271448206278689061169442851538313604809));
        vk.IC[16] = Pairing.G1Point(uint256(5039547632532808216547806166941787478089651206681855470895604281193862109479),uint256(16337098361335655880012347237808529000433812999760897196785860680097773461675));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
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
        //for (uint256 i = 0; i < input.length; i++) {
        for (uint256 i = 0; i < 16; i++) {
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
