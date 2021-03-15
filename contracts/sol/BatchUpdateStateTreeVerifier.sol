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

contract BatchUpdateStateTreeVerifier {

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
        vk.alpha1 = Pairing.G1Point(uint256(14385955436396323946137698590007366880351884598316439518228758776358171038642),uint256(19809454850510017342489107897862894216666142585457950134245782630100388158233));
        vk.beta2 = Pairing.G2Point([uint256(3580580845402657785008025698912802623474414876002117455574933643954163725066),uint256(16681869838240130968390459805366905599195476972430942514656253339082241249833)], [uint256(11848743059026250767535110892882679153926364674290732674651481615534619183415),uint256(21636287070200324600902646195327676133593545098931143408930748562260421230527)]);
        vk.gamma2 = Pairing.G2Point([uint256(12525886799471670187756130233419114970736593915989123574578100484816886873343),uint256(16854506536811989007769861809081407290462178430485442377828046508218592739816)], [uint256(10599707198413608222031535918582114630961985098965683923119679325094809820093),uint256(11279154276091976936731954276823594369268203472689024095298318037461982091484)]);
        vk.delta2 = Pairing.G2Point([uint256(19399827170646401134211401597076037397308949621806802742844934341316894252339),uint256(6290834200950111006372424225132810006158686284420277871105764121045531200189)], [uint256(1134851037037946585863839985559326533929100538695298350248355425113742892512),uint256(3942281433504304565600578918595730301119845182137704873418903045471312370171)]);
        vk.IC[0] = Pairing.G1Point(uint256(21100212034019927673066686801676819941979409232986392710828166035821215966513),uint256(896666706651066287556051275374659780988764801739125955966877417919590607667));
        vk.IC[1] = Pairing.G1Point(uint256(20986854770094013206220363454119455449435588014706064160307533859271154553411),uint256(4076888615937518004518730385224948793912138801049186247152159464945314253249));
        vk.IC[2] = Pairing.G1Point(uint256(11371102345099209435963134041202773481752265654562944132709341964256037457302),uint256(20757973136453420033700796976163368042866140269567778416029968836132930494422));
        vk.IC[3] = Pairing.G1Point(uint256(12462118287965571692379278775912172224565321677589696103237694372856310835113),uint256(5726123715747754023186213735604387304024267329102087627797217525105798580163));
        vk.IC[4] = Pairing.G1Point(uint256(2724362796567696538052595802973732462973038938074410765813067680245578096600),uint256(20615524764571882452639043882583934096379885313768049124266256473193465613186));
        vk.IC[5] = Pairing.G1Point(uint256(12335828833529004772613569595229394348432409127465483554548609616159064289441),uint256(6715668588536651186881779741843739199230718807126010744382486801936648861328));
        vk.IC[6] = Pairing.G1Point(uint256(9134061777429093498057319334321515261442417630722628178271316799143144460785),uint256(595685661809345363584023669041959324310232349418055313059150596638542098710));
        vk.IC[7] = Pairing.G1Point(uint256(6488058941958994029670330824757953851440602047012680065240519779068081593373),uint256(9259084610766065540818233820661179848572063148091750937672725197722544908887));
        vk.IC[8] = Pairing.G1Point(uint256(10178030136691240138370132491291656014857238548372695133571407982283403295291),uint256(17572473236520601059778577223293587048442458572967621832095805235020520290389));
        vk.IC[9] = Pairing.G1Point(uint256(13437953724120471869215876282655196102569530987432245456923057377118825725035),uint256(15107043526135424355030172829485702817001417181987860413430624608549895665590));
        vk.IC[10] = Pairing.G1Point(uint256(11471871266657070089561719354684751600488133812975627487045246985002294534551),uint256(19750254610174149098333729615111131449386514244184959925740174713415249067824));
        vk.IC[11] = Pairing.G1Point(uint256(5881573193259087746726161618546864782110615540485614322899316599026683070852),uint256(17812488921603518488748545329952310992189006231462797425583540962473102722387));
        vk.IC[12] = Pairing.G1Point(uint256(14167524561919394258127807223015195012985686763329851834919641207305844751985),uint256(13207780890895687771743361190315553765503822390823784458864746537685328054826));
        vk.IC[13] = Pairing.G1Point(uint256(17369089023535457421858425607966476447729710932479720788250075116217630650170),uint256(9973127029686295872959570454308033213139703001861085711401229356749936901330));
        vk.IC[14] = Pairing.G1Point(uint256(5953026028635046083226272954439601316905217876794870794633798768915672721174),uint256(1140424494698698205974785101727130338225848309263766472819599034991546330988));
        vk.IC[15] = Pairing.G1Point(uint256(17414269927532361771077788648991487617720403493632152633357278222882508064885),uint256(1098067017676575453453451562390306846100304612821997098599603400887470983985));
        vk.IC[16] = Pairing.G1Point(uint256(7947077510757980817291008306178417510399813830852293676720472240617074391383),uint256(184918103657864260547976154686657177959158870949744046658428117022302846197));

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
