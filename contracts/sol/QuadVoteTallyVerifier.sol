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
        vk.alpha1 = Pairing.G1Point(uint256(18460833811961653527598964584629390610623978153491905939140995567765971443811),uint256(16850516443502107328974593427811817815967308750534113498873471246062872739881));
        vk.beta2 = Pairing.G2Point([uint256(19153614651344874554472290320591402641216921404850248673161015740898727635592),uint256(21845806095421579434940050065295032409495148833467186891369924157074273367315)], [uint256(9125818946718685087861879151697943222220724275865759225184235362675034006538),uint256(12507962701754441749712980949162282838046777125566485401481875626716071085117)]);
        vk.gamma2 = Pairing.G2Point([uint256(11649892880419209040016455926561165984067463472142409446332492464538797785754),uint256(14680160203169641666392680795685059914073476244051138951071989759758070872446)], [uint256(9119470223221375456827007531399326442879306917539163961726686696979808420821),uint256(4546776082039730319057107041717927367297360046745372012523298360749757836232)]);
        vk.delta2 = Pairing.G2Point([uint256(11187954774980867972218752467138291235442796501909721640377410152602943698433),uint256(8120668400749293971966819051996839703072649020072121261057357376980568003993)], [uint256(4791994260466666873937347967486305360787690150841894112446369861844040404570),uint256(12982155007357558359482805053092665111579666138849315707685545217594728965049)]);
        vk.IC[0] = Pairing.G1Point(uint256(8877335058601602328593107216417414085749247166899654808615725894811546544829),uint256(16420567331268375489667932668810526576105500090469392738070772760108779525032));
        vk.IC[1] = Pairing.G1Point(uint256(6764194996600882299155682796391403753633772433594171819593139933273178659406),uint256(12146975818569080603719844134453100842221443544618945118927645281489473785299));
        vk.IC[2] = Pairing.G1Point(uint256(18822007597123624498891519877953885034002950541832714368981181521128637873768),uint256(9555547091837886346404919214358008861055964273987666817909254555082203026952));
        vk.IC[3] = Pairing.G1Point(uint256(20825261920324163806297661956643522270045692627934181233681493010805737081490),uint256(7032911557007665883565814451145302157294733802321693546602543678410123456538));
        vk.IC[4] = Pairing.G1Point(uint256(4754563931564727860411800943031814528258166870488245311575897677265368003364),uint256(6512596298047656325187956258602951539984011683582869459493796369022141707840));
        vk.IC[5] = Pairing.G1Point(uint256(15855196139631826576059064043084023198565154178348676577118681443324382936827),uint256(10554745695288974077299457203832647524113655165350391293373960088327293166820));
        vk.IC[6] = Pairing.G1Point(uint256(7550394699098510308139443013486759465767095447060055386469366966108891989480),uint256(9267767914708582908245080634972153745013769246070425256553731843811001728625));
        vk.IC[7] = Pairing.G1Point(uint256(15288338194106384296345027114409413154803455603201615597573509240724305732678),uint256(9023982590369942454855797527033559556342384376296470240139980725407312798978));
        vk.IC[8] = Pairing.G1Point(uint256(10597770041500039060592689063089188238350358325533629914936352684192705658591),uint256(3111108158824035729878560915741490431407259916243784035964902891142638465074));
        vk.IC[9] = Pairing.G1Point(uint256(10766379750363354942943379440332927715905483342668414302000123891785406904646),uint256(7455604055930715742781333021704018896431397528578804131992466594214871501172));
        vk.IC[10] = Pairing.G1Point(uint256(16135499144160589087298518351349134860731154782700790944855794295122908442500),uint256(16461814474828806187602112473248153761435866164229925874683590184509865199718));

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
