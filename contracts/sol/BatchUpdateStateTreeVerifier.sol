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
        vk.alfa1 = Pairing.G1Point(uint256(17464197956096312074244684354259563353366815090116844377024245612728887463790), uint256(18614172308168001913624236998431265133353016755714758438797872960414049480207));
        vk.beta2 = Pairing.G2Point([uint256(15015102842824422947860360072501045880697466675301740075156728587057120612961), uint256(10997389845994719541885128116979151504446507612565828998248229574048753906381)], [uint256(12574185806291593958389691598194592440754889563083389309070799743643575304698), uint256(9298134607604406024018471433562175408683432994394448094713701552164973506389)]);
        vk.gamma2 = Pairing.G2Point([uint256(10625304096107399287177581058839798287574639339813708664934296915055892798481), uint256(12060167138603225067507865488783127147517784290442758303220687657284999242245)], [uint256(17896591128542685259142203900212250047503515098915132934615228426851850873859), uint256(16304520393228613833899119639434827373047515540320162867922002048134651492912)]);
        vk.delta2 = Pairing.G2Point([uint256(16425451276178061245740715582190450711632922757631943799233451399791030471625), uint256(5105395151037848740140873725146781288320217126545665562514744258543961272215)], [uint256(19145999942988047092032883286644582242264900576472418750461500271563621032549), uint256(7815810582882971242582174147704376781044249834192827987177066855454523000662)]);
        vk.IC[0] = Pairing.G1Point(uint256(8872863505413020063859986007192258024098729689438185148082300089870749800632), uint256(10541622417412073388192343201063772149744263362576282702126840507172717753344));
        vk.IC[1] = Pairing.G1Point(uint256(4620374574990323470353551150399348805902665750114173512599254643309271524266), uint256(15729448912236925557229341524417679663523397283802335253592044370958507914389));
        vk.IC[2] = Pairing.G1Point(uint256(20993706662049594602411932618458735783320145484828385106064289292103604642449), uint256(12445931804152657136371444402205753331192438842473577539848003013504490899425));
        vk.IC[3] = Pairing.G1Point(uint256(11972492395934911976420006006378664587433189921679672080803221003811876239982), uint256(6202517074947590504020762960759914289766286882832108232824915805495628227260));
        vk.IC[4] = Pairing.G1Point(uint256(1328772105617039503720015193912391702456221435321376080439529266757480556080), uint256(5941577746880605612431599202385083771429487560403246302639925851314482656146));
        vk.IC[5] = Pairing.G1Point(uint256(6991318893504277958874177771763342612465473031448700550365744448429398424963), uint256(18595693436909776509325401033037990135046904695783938184931777932889889934537));
        vk.IC[6] = Pairing.G1Point(uint256(2079004684571687621326046682843935383413593549383921867374842874644444051239), uint256(1178706791370473460271698612560352904498507937235460875060563472950531872831));
        vk.IC[7] = Pairing.G1Point(uint256(18261623405936081770896538384080047958739271544628463902506341151896646355839), uint256(20559807777068840402705595254969593759672009373235717816809794737263874085773));
        vk.IC[8] = Pairing.G1Point(uint256(15455874885901297329567412504154199642209929157939471172034078515331405938360), uint256(17082780461846322247454696549094828223132126449687616773355017012711366640763));
        vk.IC[9] = Pairing.G1Point(uint256(4236671302650621767298397702976650382529866233378988000939491491166267141775), uint256(21721182763710266259456507078283089792740446528827164117818386841657544315198));
        vk.IC[10] = Pairing.G1Point(uint256(2643860502343598431500238786067168562963065266615607674070829060227947555962), uint256(21171982160455421074497226585404839922876972169576313673815343608538726528187));
        vk.IC[11] = Pairing.G1Point(uint256(9121322526057864996374289765577392833737326618982686447389133918333665204512), uint256(19382872929703374525711077281269831132438046060210806974016031350260956684754));
        vk.IC[12] = Pairing.G1Point(uint256(12918920451126173611126555872447515203894625036095517772839912196228636882882), uint256(11961254015436838542516632353839219837983809806563604343318620001748146824602));
        vk.IC[13] = Pairing.G1Point(uint256(13346061301927331048217922667082448953981989271358813303091279866842332945102), uint256(21799739793036599370867642923826287794512238706729045588344142141634511587389));
        vk.IC[14] = Pairing.G1Point(uint256(5392689372702164290423406482087861230450321174804631000796615699870038906269), uint256(5206060597074865860694888039122213577440343935079062994740902050992870674831));
        vk.IC[15] = Pairing.G1Point(uint256(19935907391050049486763884527696007085448913578429972608344749139560853871530), uint256(20532966005940716396279217494195960105364162234934590001148597413735557863971));
        vk.IC[16] = Pairing.G1Point(uint256(5002373119518421410695029455955670692681703225129311968793988337434613961025), uint256(10375419588411178769575119909144056414132693182936794704783763732406799793772));
        vk.IC[17] = Pairing.G1Point(uint256(12472311789196498213754958553110561257924178264834058006037771815753408363271), uint256(9184215525721848440951036877998655355081514871542966732481050775659957035455));
        vk.IC[18] = Pairing.G1Point(uint256(9177756452491108765131791525309259348620069289209326580551938686698815753172), uint256(16660816777297226023535331721493676836098791514346662436086412591411620473347));
        vk.IC[19] = Pairing.G1Point(uint256(15334306015378157170217683767695829297664556970159676564524286535535675829058), uint256(4766688987871729190785150640178681895612281867146877261653879176064666396327));

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
