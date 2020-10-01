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

contract QuadVoteTallyVerifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[11] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(15660528725265274777763637847562357920611768702505980359098881413272923345682),uint256(5157633083457544093096418820679818884593035375002653880236006429952593766135));
        vk.beta2 = Pairing.G2Point([uint256(14663429514821304231120241266424511111552096559664499709391339929962086613042),uint256(11405013907639796675472315562309031784838953897984992670572908407178910836510)], [uint256(18366121902789096211801215798764317884435584475062794751518895977719400621738),uint256(18322576355250290132522529917248753914168542378231363728837932835900655924932)]);
        vk.gamma2 = Pairing.G2Point([uint256(7686905522320622725585165183795593014962753754238368983595456977502446459568),uint256(14693780744388078088825128337031203081559782357408433620000026830406005810234)], [uint256(9364176153658236112604908222041127842158232560273613427469586620704199812419),uint256(17062603803547797248711006389086501932257852838433658403718761464757517949203)]);
        vk.delta2 = Pairing.G2Point([uint256(159174079014964860391383910322924347449131928343527471751517905169742837589),uint256(19304497255406520906645381570495395806987591950944854796548892336441303666890)], [uint256(7587022572414463253187418807141815880032453585117398637754962693887392555604),uint256(3438930474887929523644204730741668337747360150004389676100092636393247806858)]);
        vk.IC[0] = Pairing.G1Point(uint256(8580173359314738377341599052126257319057322678134515246594147318062825119443),uint256(21026916776415419831681861627505250294587808222002952002957218651130982883523));
        vk.IC[1] = Pairing.G1Point(uint256(622994947914657680434463185014430601187310614537141946656828729660249020687),uint256(13434558381112088752585870518691506932463385936589262971274297385250361533576));
        vk.IC[2] = Pairing.G1Point(uint256(4916737771106554837779873669882293005833668411894155205553031608941419619821),uint256(10602200027431498200356751441449569305657240445419204208722169530627477133735));
        vk.IC[3] = Pairing.G1Point(uint256(3965461441968669033914373349271389866436827259841788669620372677687512695806),uint256(14074689077551364755020884942446588236198144932003859797491723090751951797925));
        vk.IC[4] = Pairing.G1Point(uint256(18657094818229824765703326894326608876460705321689734082672953675198347513544),uint256(2554962586205150676820192313603913787839993220506771347479293228175216093975));
        vk.IC[5] = Pairing.G1Point(uint256(14332318441572519389039091962422152681238398929228228150934204479304711661340),uint256(9364970477180039372005024204653654781183445545044171547639527254269923644765));
        vk.IC[6] = Pairing.G1Point(uint256(3857644009929127203155128490364012206535259510742885374989686349026236944488),uint256(16464095447347743465782655266318341677830646780722477889517685374437597021774));
        vk.IC[7] = Pairing.G1Point(uint256(14259631105004937037544784572614728103474878387551739871812507244174832559414),uint256(21178206890109778738110556876958156490678002844537810654984418736291451940738));
        vk.IC[8] = Pairing.G1Point(uint256(18832862775474724145528815954458782990527874490630562056385970475482103303845),uint256(3682400193030852777266056221551992971047486004060908433147128552690515988275));
        vk.IC[9] = Pairing.G1Point(uint256(3980080560873031708757943985205567792512919968682680578947222689895450690110),uint256(8166299679697989224399175835547268278314804937751477765379266397507220909756));
        vk.IC[10] = Pairing.G1Point(uint256(19175214709126148218236967889632581868464413210230635141091587043382682548648),uint256(2119305331563558962811605175995630335308906035006872075159601257772544981360));

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
        for (uint256 i = 0; i < 10; i++) {
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
