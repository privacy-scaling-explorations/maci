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

contract BatchUpdateStateTreeVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(1711315343011532622335733162308320695098301365925492342676228057184875032440),uint256(7711486959984686399562672208082354804272516154838926538171082014429539697791));
        vk.beta2 = Pairing.G2Point([uint256(72534849658180709305765587221043227205873118250214547959605297601891917386),uint256(3730137725687841393036749459578368618329497045242690408375192096912821223827)], [uint256(7176323156324431209588480752789080466469389058504112021043007692554732831597),uint256(10854067475936286219629757733343909564987575886966157480550244201316032649476)]);
        vk.gamma2 = Pairing.G2Point([uint256(15160348414707359153832774098920917656625181489726873366773423359093221808486),uint256(14578441440983926212294688059614867668983506473287600942358059374770536719678)], [uint256(12857107718231509751972835868343705232730794405404549999530670032599515862262),uint256(2509851967834701932260451377132984412639511852036438795959296100850207834927)]);
        vk.delta2 = Pairing.G2Point([uint256(10570789372872120320326799061452729120054674188912302921784549595286405602890),uint256(20822262002450299686635829379254882950173562563899920883121932758670784650345)], [uint256(3948738919332448774456978560210766901411156912000946056888681203573702672808),uint256(4563676702482625789877613772734298923549044719042927908972309578731506222119)]);
        vk.IC[0] = Pairing.G1Point(uint256(14519484741722656640314112612771585933874506185647894579429779948933627115094),uint256(333902952117483127771797362110752541875688349134936782182246341579957741983));
        vk.IC[1] = Pairing.G1Point(uint256(9047637095445559615349872800309981966447170940209685179961827782424432673185),uint256(13631461072835957371127736915972034816248382018136171314472166854031053041281));
        vk.IC[2] = Pairing.G1Point(uint256(2798661724215779475871126610988631778911665824023467360239000560402758247791),uint256(17560734399590942495801079572980755584256701990198221450415966152442958489229));
        vk.IC[3] = Pairing.G1Point(uint256(105227214006266434382848455978522762931108867274848900327271804412448593410),uint256(20843320686569269019259991356091843814936474348993859628045257913067955497064));
        vk.IC[4] = Pairing.G1Point(uint256(15657665502788912228649483197906529090516709785074152077054870898444695471838),uint256(19015642434896218455645634874585074926197934064263703162416072290523066459995));
        vk.IC[5] = Pairing.G1Point(uint256(1781961204792515204161911819019249832879883757670920316913111006742681576065),uint256(7575494620975947060254326158640885319185034119681729754717047949457026443622));
        vk.IC[6] = Pairing.G1Point(uint256(8943717936718661927637935501699101208135191891532551717721421255306636007533),uint256(1503696899327151678963289328111034891082418781253925413734857406205356968790));
        vk.IC[7] = Pairing.G1Point(uint256(16401873181789537341186008545604925907378205493803797750459058510246754227559),uint256(8452354329704213681156446758859521192719050057586353923796315019860813585238));
        vk.IC[8] = Pairing.G1Point(uint256(13644710996647075027949057743783475879256844906418937549530332165602573201675),uint256(9538492489038346148862817842104640991869565000968665102294832682061227991558));
        vk.IC[9] = Pairing.G1Point(uint256(2067340886147118121175430600362595983673683408149975756252281599360387797474),uint256(3927258456309511656357792680459762774118106241286817232524018486610058602582));
        vk.IC[10] = Pairing.G1Point(uint256(15992274757102531568421857051814672397468400997183638952961492687000347536587),uint256(692868957898102602626139257722387830715539584343425588771797252853763228629));
        vk.IC[11] = Pairing.G1Point(uint256(16012854084345967829181293631097032794156657576870624856953826758331196951875),uint256(18695556874727933167372595185398646522079656519840929460067276373966104626674));
        vk.IC[12] = Pairing.G1Point(uint256(18252478498608644272967881423026003531644660772346340990766801232218515647924),uint256(13657052145284088347941674756190591465071203954381197719331184525760809045784));
        vk.IC[13] = Pairing.G1Point(uint256(906659137564537990343923559992425155820710669779523460026757852227347472544),uint256(20770011006051401407789263626416254741100293007910275682328969372338800762493));
        vk.IC[14] = Pairing.G1Point(uint256(2663523173543440960133713420875859052699775882360030385926092437347698594518),uint256(1957900701052995631852325783198905990296613135202873330869462371030426598446));
        vk.IC[15] = Pairing.G1Point(uint256(20426646615064747813317359490174987708549881192282962447333578819733213163806),uint256(9886967910130680278076440343507518516625593523139819443368437789823727913856));
        vk.IC[16] = Pairing.G1Point(uint256(17655131763936720921086551762209979643269372157540403619328864809757062161896),uint256(13753887029492303284682256008537877468063078824941030395823341479869178161645));
        vk.IC[17] = Pairing.G1Point(uint256(11622622771689541027627562235265537293245626139167105476931847042974528413435),uint256(9065771812743765118354002091357651485139067155040005273652927911268488488108));
        vk.IC[18] = Pairing.G1Point(uint256(12644012176730052831659151414920743641549405016905568028947541819884817853792),uint256(524966649502700189279313565086867977928109449548059374764534743723437285276));
        vk.IC[19] = Pairing.G1Point(uint256(3127771768994647025346765581297140739417565092633284464863699100022424090629),uint256(19949958442369493380124424035178335251790679375719086376508028464557261688623));
        vk.IC[20] = Pairing.G1Point(uint256(13490835928848380061453271165216637245381692929873179175464317663814975480457),uint256(11322696458140787038474894216965558314478404564938334125710673241268845576912));

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
        for (uint256 i = 0; i < 20; i++) {
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
