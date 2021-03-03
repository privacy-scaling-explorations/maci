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

contract QuadVoteTallyVerifierMedium {

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
        vk.alpha1 = Pairing.G1Point(uint256(1003538123340708802881805431717695929418034623140585493380122282168675452900),uint256(9353952924647574532954773674129748142882841401549021808544200465808812731916));
        vk.beta2 = Pairing.G2Point([uint256(12363621530380585205620462041136618227297801446875147238272129125799632053363),uint256(16448431571204535208315379501756594705136526748898469241524915087271301050578)], [uint256(916678303106696059286682367185089962391817843842590193540437466337480878840),uint256(8317049045271912197462517083918626617342138739339345369147649326659217556172)]);
        vk.gamma2 = Pairing.G2Point([uint256(14648357783567945296774096086454128386219653761821000814450023515472805357116),uint256(4311950491986243589690965354263855697804587550722614146086184328560663955098)], [uint256(14190943826350282785507920612070496295552716646042263903050861782257662064535),uint256(3630521647521390928369402312450253399656506310462888578882901105519700536819)]);
        vk.delta2 = Pairing.G2Point([uint256(12613178147670856492460508658509015993394992557629034572896556196538698677547),uint256(12596462600533560466430176841914738122980248188259062638870889353939286257761)], [uint256(17596589190413323751423291403395298182328419365040491349722451997606016264352),uint256(10776838606371162931798166455601276187721392443376145428738213496958853062833)]);
        vk.IC[0] = Pairing.G1Point(uint256(932700603672334809160346552132472614032030687026388115859710969257271281893),uint256(591316994186018477868232075170133421412547801992656979683206456745659988002));
        vk.IC[1] = Pairing.G1Point(uint256(17593973774233475160327549697998525302848990007896443719146031640555232611027),uint256(12985137401845502834536761130993614031600944550284551802335298992163417067987));
        vk.IC[2] = Pairing.G1Point(uint256(10446689716068221445134305838120019658673620432425149508993895604017874587595),uint256(12854105000971510370329985038092928600261633689508838232613012351890655414258));
        vk.IC[3] = Pairing.G1Point(uint256(10085245789160921133416411321438743615170479070345228826404597228239082592439),uint256(4548831749034953413255483672423836091526756318615787268081291173093088239970));
        vk.IC[4] = Pairing.G1Point(uint256(11297500928124231333946763177564491101443239594295281384387657882109689544384),uint256(17452856765125707642541840539753512119201248917464951090439399350850594302221));
        vk.IC[5] = Pairing.G1Point(uint256(19165895171591366579366345722437649052331182142348408612663027579507281841684),uint256(1958123983067403810884981238466850497285019471591100511981799346739081132259));
        vk.IC[6] = Pairing.G1Point(uint256(8014491513402079556448209124446816233168811459291773744934977367072659235766),uint256(7343125461908339002625837956956555685629009944565195969804780178456584558985));
        vk.IC[7] = Pairing.G1Point(uint256(479742469169151588095218267508919274066323533536320225944973864906725830091),uint256(97084158927204639554058627368620608155227427160735287222139317283751422030));
        vk.IC[8] = Pairing.G1Point(uint256(21423671521476022783477782971976707183302765370785365859253988294124993047544),uint256(7277567667389622233758955025286047207283031550491302609511777769873483020896));
        vk.IC[9] = Pairing.G1Point(uint256(11487565967589026482473578106388113241796814410172767123680440607464646544792),uint256(14970566648830906880180171033371448380197865958081723835128076815257164357435));
        vk.IC[10] = Pairing.G1Point(uint256(3471629716903392272985669029368372856104633910703229829102702091118757831604),uint256(2406111483102163515866323478385029143811052478135775133774043419695284058547));

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
