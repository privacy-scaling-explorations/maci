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
        vk.alpha1 = Pairing.G1Point(uint256(9544311815141748962364876195105379806960281933668518704576770074990212151458),uint256(753054477369819687044650510910500660481212747586558731815081744828384685752));
        vk.beta2 = Pairing.G2Point([uint256(20837620465758813137841735272033718349035990287165481293233270646377562298279),uint256(11450131741172910459409999262546140325209812999274904761424256927808384329300)], [uint256(7413889717081205957226766454799444568247091744736551480096135436823803413170),uint256(18767717857330310926060910121271251723526159202717394131878167468703474226459)]);
        vk.gamma2 = Pairing.G2Point([uint256(3347108817710074738338001241856118611171930446450007519987308607166930710573),uint256(9093607017586033902745222271393754066024055858867612639995930141840364474613)], [uint256(6165222914837308278948461892288801808835150346794600864264207301234594465053),uint256(8060209925216602055733838539993767642663883872146997003271026314481736130284)]);
        vk.delta2 = Pairing.G2Point([uint256(19781296222358353286912814199294057381520495233655268581758073491044543931788),uint256(15441813332966757358665007622767656435873993749013870427858798699836248112040)], [uint256(10479770894907623494834804044098186663061940425846417308266742461618406411074),uint256(15686235373657679450584915904107324567313998249766873490575746670840280216853)]);
        vk.IC[0] = Pairing.G1Point(uint256(2977545462639543101608782132446798528679035159024046056105166121243737504055),uint256(10976552791013863974760508642652783847591166611809288370096549374809259670328));
        vk.IC[1] = Pairing.G1Point(uint256(16617117652719723525567739882546231852126896289564440288656781634351934373036),uint256(7858043334357141243829884899107161964407668676997805099432989477137316782154));
        vk.IC[2] = Pairing.G1Point(uint256(21034780521515524634732714444946311911257864754357440769235423173183712930103),uint256(14989237583681163119607720897491464874702187894252534220522903041923666715136));
        vk.IC[3] = Pairing.G1Point(uint256(10067594776052824527165810506011231130912779482663133864912723057370489845492),uint256(10820075793848169251020567601314068841841218933066087065630771339447183744397));
        vk.IC[4] = Pairing.G1Point(uint256(12318998056847047854413314288994458073238001476534821128047529278896400078509),uint256(21045525366690692356049933185363977937079390356416540417018799012434932908671));
        vk.IC[5] = Pairing.G1Point(uint256(1006362880820666291343426807174131485654423662363691446979907404834533996937),uint256(10229387861108374514909559612177121576910000345854012267697085502571775622454));
        vk.IC[6] = Pairing.G1Point(uint256(1265862285389912583354988517188240046545245531899484378775932237585919113405),uint256(19533887002306214906401588301741821164134268055785360059716974096750249574592));
        vk.IC[7] = Pairing.G1Point(uint256(9366383303037262111495176025900763714531644320956547136527308721507028908668),uint256(12342056557140844024941014535132352840593653924946843771623130612151334486161));
        vk.IC[8] = Pairing.G1Point(uint256(377648027856046402067856432085235248427633732903195773131155890402237030240),uint256(13859189692549416893530466171559207483847454708965810295259420276885186194111));
        vk.IC[9] = Pairing.G1Point(uint256(12137642909261162531614282794577276988027441374171514839983505649086044434171),uint256(18386481830849357503396854902661055139744772247970949541726767736810048014090));
        vk.IC[10] = Pairing.G1Point(uint256(11168589902532857753647687088832653482107030818840713069138157464421493318222),uint256(14379320319015633530046109708947298315994836438043323861191851455013758947415));

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
