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

contract BatchUpdateStateTreeVerifier32 {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[25] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(20418538361027423628950759005329616387698143678963107187563180338030741867318),uint256(4575670361212643958395832068682175994586035312917311544452378042285614383572));
        vk.beta2 = Pairing.G2Point([uint256(17735359356091903877101568617802955639379717824800299130505575048292020642669),uint256(12793103554249930411496565640794706186375666904940647131350752971722476435397)], [uint256(13870080998786595346788823834480731755612082976147606459624995891465377212925),uint256(4845608622567633862814012735858173195460883971642097450780339277169810906076)]);
        vk.gamma2 = Pairing.G2Point([uint256(16703190815831247903447360244372468647363761570420718982626370472406964304448),uint256(18802391324143083018429119069431381390597706852037142182442902456131367236629)], [uint256(19714399496159269412426343600361987532003544593967614993507735594343949433671),uint256(6414084655377321666597818038278015163138720375319044883174772326353194166724)]);
        vk.delta2 = Pairing.G2Point([uint256(18717480664876905689917504124140187316664758226647601110117656155222049295239),uint256(9194835542517544450476768662198724757370881376056679151860698699195129186764)], [uint256(9239906297429042822432650806782176476815262799418002205461085482819241504738),uint256(20364614019878451715272880814038227305767791449214566068893684816230114107870)]);
        vk.IC[0] = Pairing.G1Point(uint256(17244318746193652570531036134847346227554021235335852518141468822060397708111),uint256(516929174085893986950420285441058326289904240003586030904535196339612130072));
        vk.IC[1] = Pairing.G1Point(uint256(12205372881154737828689613940653753181806398148757140021064521671253727753688),uint256(5688966771526818260212716826251854962393601265957839001098229122765281854163));
        vk.IC[2] = Pairing.G1Point(uint256(19022648277105693046876514502476811630256714096371317812444257826367625734973),uint256(7553039605611478131896371717868587875524725201165541399211798908252916319297));
        vk.IC[3] = Pairing.G1Point(uint256(182228607014021400851002400875923762277168324360955455961853712917639946479),uint256(17244605249082867099552298454701131606329988241188360780558557652531963001765));
        vk.IC[4] = Pairing.G1Point(uint256(11762751446996234255512618538507117970383959495500223812713235178870792223427),uint256(19246420635826191908133731480988535088802174495890927752826041664146616503056));
        vk.IC[5] = Pairing.G1Point(uint256(5057261020957829391772641401716706218359880446161978966207063413093049816311),uint256(4899621025858242060436913924313805863903994771375287272392010512589467539031));
        vk.IC[6] = Pairing.G1Point(uint256(14981236593888946968626347918041297018439633401867103151935084006460910046794),uint256(17717243537918177796221603397140005674811001377636482503646280595847788984287));
        vk.IC[7] = Pairing.G1Point(uint256(11676317210750285692297455961949836949372577995468290102318760553041012989205),uint256(2891360553274284733079304439777211736145963214426118834182538121408855147041));
        vk.IC[8] = Pairing.G1Point(uint256(5882016825161170147081832227186045320763593975475637260217168824450145724874),uint256(12258724592855802397070927932585123980254483533833739245211444072480053524526));
        vk.IC[9] = Pairing.G1Point(uint256(3503897143177654054959313049539868888438624012994359383612294117179828984880),uint256(20151848339509983608018444930954895228404568016891564000083977287587555930179));
        vk.IC[10] = Pairing.G1Point(uint256(9431904958861948383592500066703508175512839939584782339396786077013541220722),uint256(7093770806111066032455921611928140709994742130720622911324000574328870213895));
        vk.IC[11] = Pairing.G1Point(uint256(10709324112367063463996466080213514870352807194199387478823942910439404854910),uint256(17906399444566172502328081638354152266803970432542049131854731764046603568518));
        vk.IC[12] = Pairing.G1Point(uint256(18931701106928614894338560210320200842926577781015318184457389086573883561774),uint256(381470517242633707124680827268614398342292445534540996460447585317191727383));
        vk.IC[13] = Pairing.G1Point(uint256(9764422211134804958190819637833950985738078546565774893838461264541267284440),uint256(17543077653591397268456077638787908719581838808196302196595780839670011236179));
        vk.IC[14] = Pairing.G1Point(uint256(16932714612282831362210401508270716729314471867734390821528673256491992241294),uint256(8111352477999958773854007201219957411235624688449557130784680880038412763297));
        vk.IC[15] = Pairing.G1Point(uint256(6966522815045822205007436231993560501403243320859631329763178389800536339775),uint256(9951560008928669914482921250880532637678259493104186345126300474765357110264));
        vk.IC[16] = Pairing.G1Point(uint256(19118078611611626273046083034210707966301349553351261674036225935189733691898),uint256(8178683892308765515533138046446888958395757984889891672994683609654232065346));
        vk.IC[17] = Pairing.G1Point(uint256(7448698678005593861059908599058730933659627063372152348177556171289630127700),uint256(348257631600811362266923044095160853142923908195255584421911751942931430178));
        vk.IC[18] = Pairing.G1Point(uint256(12394382652526070761919073363692068176061366733103419548234605499950112274532),uint256(18549261899987359555348291780499699312557513814679675341025383218415331434701));
        vk.IC[19] = Pairing.G1Point(uint256(19615559162276718611567063348124701769169140245752794456465736289349742596488),uint256(19917334819480805866149020274610721616467619343306043235658546374282742095739));
        vk.IC[20] = Pairing.G1Point(uint256(12509211243736188103701909657540012382784395000762928027262184579837664219526),uint256(11086351039752207483827214268614994962849725656799741732496103819334763285208));
        vk.IC[21] = Pairing.G1Point(uint256(20856513560296388844793019760226110071584887080605834264511195382038856543123),uint256(16321684015555113594072089322457639929570112566011668124070803392800103587084));
        vk.IC[22] = Pairing.G1Point(uint256(18220368249403175979880534282827710455400861333521068677049151784491227433346),uint256(9823993496896829713946311434036860052451344276205258581621195381339323443783));
        vk.IC[23] = Pairing.G1Point(uint256(12779995039902574964609074398356746434446198623987700124943035843244226010004),uint256(14580857115003236700461699210095293276084551704348876629150651317698057860202));
        vk.IC[24] = Pairing.G1Point(uint256(8718320677459374601882563118426322746181947952927146361486508804021357276854),uint256(8951036658973283033519005882345939618564772502538423992769637362527723742832));

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
        for (uint256 i = 0; i < 24; i++) {
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
