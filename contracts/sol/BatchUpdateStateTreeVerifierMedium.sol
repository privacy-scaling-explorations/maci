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
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(8986998602556660002243008870296135030122554120869458503747347005052768272523),uint256(5930970361011028352230516913861383656815160663279033517873974349635020306787));
        vk.beta2 = Pairing.G2Point([uint256(21035859321713421101339668308414572846967319941707494255391779581714927658381),uint256(7027679333996068803999404115172530181429881540177550206910787029612724427339)], [uint256(21633129321719405801400896151555480454535519416376295358819170756415678258270),uint256(20773861511139290294678328853361052507283671658049160083536893555680706513742)]);
        vk.gamma2 = Pairing.G2Point([uint256(11548541343914476935977349717776598380565360166123100167321245556262844009029),uint256(10090198875917338306575495151406718244454206723146650420503130662660740813904)], [uint256(16473335891337857809029842132681320789825466571755092079125087602968208464344),uint256(20155461147002835453137902240895907384202815062719754960220139643601906408050)]);
        vk.delta2 = Pairing.G2Point([uint256(6096416416436529254826105023768070936875434117501656624497943912304513622490),uint256(16201260912827235380979237297033601794584321958395288583813330339774535022304)], [uint256(17367068685379264474290194474607217827936930939100497665178088313888066253776),uint256(14545860631349764750113832910713227731608974668077020734048391180886381601439)]);
        vk.IC[0] = Pairing.G1Point(uint256(7306352844502246518772672296132928712452925180291753615300669616621866262027),uint256(18241904141538759892867626366573218699405690007657774883203007138165994305316));
        vk.IC[1] = Pairing.G1Point(uint256(7194722692340694511224853036065622922747470279071959649410924579349254382512),uint256(15883080197265877167532899439358447257533004941145203107490696686667232452270));
        vk.IC[2] = Pairing.G1Point(uint256(9153304085519732123544030162966890392663853933296996136315582804167757292951),uint256(6700745933520107365804362386684458570072926878574076237073035291259293386246));
        vk.IC[3] = Pairing.G1Point(uint256(7639227538246339271516789768192038879939556106443614332352616452202457264778),uint256(408148657230486097097422105986543374599938922539201000906273839106191984757));
        vk.IC[4] = Pairing.G1Point(uint256(10179867378772017800986507676163129444668064306247537291546603025255209370366),uint256(8022745800880436495168930828261818118120679955043752991068522515968178380827));
        vk.IC[5] = Pairing.G1Point(uint256(10324108770625396484816555622600809391911153969717236673085913326821051239233),uint256(18453990685916618292630298587812543568254346337463889041378651588455481640799));
        vk.IC[6] = Pairing.G1Point(uint256(12421422896138880316593275126623302937427864217749509869327346970856707758965),uint256(18750070401451723737660483434607043148994460136005420396796081825892795931091));
        vk.IC[7] = Pairing.G1Point(uint256(17614130949107106763522462042955618197880279721401123071662711202769569280306),uint256(6317294373916774740371524734593674032126315244116775037566955046304867761531));
        vk.IC[8] = Pairing.G1Point(uint256(3124937164445061699414702571378726895118196254843399766376557850247273371066),uint256(7588395811343873639631567077469839980975332932880015037158899179250875051488));
        vk.IC[9] = Pairing.G1Point(uint256(15973343902503829748945878658548895472812437409276427187402559995924657493970),uint256(19002797368939460701700449809221889341470719595540990013824262194236659413467));
        vk.IC[10] = Pairing.G1Point(uint256(12200713606216773360505025562542977205184957231328785628760572281499931143593),uint256(15777285793908684907593167887837877676361436655918082061229949969997279103882));
        vk.IC[11] = Pairing.G1Point(uint256(10718076599427115363148322613613302403732985858588910066924532904603391936608),uint256(5274856809492848649418323206777039616936114608973209636581707727940457004724));
        vk.IC[12] = Pairing.G1Point(uint256(258516621429224189261417483946911106862742334077951327461380263129867759635),uint256(16824121112268793882246759108774327325132219130842137774944764843595236916853));
        vk.IC[13] = Pairing.G1Point(uint256(12104329826283773859172068348063538353580961426082622470051775288327479221514),uint256(8998899420512617400648528460989282277994017873159633800669915829568695656361));
        vk.IC[14] = Pairing.G1Point(uint256(7888854748900921264512153176217566362278406081246905161220474227335768808504),uint256(20951660658818757741516803064687988673880181264172235876624368616570700160841));
        vk.IC[15] = Pairing.G1Point(uint256(7847696651595940691405453203259321344889242694247122673309031535316549615889),uint256(5874585527622115982138014526592590756615966432561669552819595448400315347239));
        vk.IC[16] = Pairing.G1Point(uint256(18267028324548526958149326640236560233238968678091981194395177758235104566998),uint256(17725317754199829922046368359445298519084106676315025489905051868559264329567));
        vk.IC[17] = Pairing.G1Point(uint256(20352248140292821763302036503526490577700389540669841176082526570869954873672),uint256(1332102094458627874564374966581276997947550098685076630861324065308125771063));
        vk.IC[18] = Pairing.G1Point(uint256(9907814400601822932732738670543454104753855864831437694480184147055287389225),uint256(5448067564096187994600234025423382030811381412974185340919048634523421328323));
        vk.IC[19] = Pairing.G1Point(uint256(13472589315504609830048778722424684834332918057707656894827918926895581723375),uint256(11729613680635449852676713427809499750907344398542219407172534835799757564585));
        vk.IC[20] = Pairing.G1Point(uint256(9490517693848337217879358812615493499912883452611014877015622921235819657847),uint256(7358002311861881184783414018743323353410485196685942532513620752980080318655));

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
