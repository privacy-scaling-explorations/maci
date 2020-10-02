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

contract QuadVoteTallyVerifierSmall {

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
        vk.alpha1 = Pairing.G1Point(uint256(16290416464575632727128156692664734082652995399312449343486284301700287517168),uint256(14737786822363776333717059591384508310684076996959100363781651473793220669082));
        vk.beta2 = Pairing.G2Point([uint256(21124775582359167163875858023391112938775575668627451677540958033699708639067),uint256(9178079917236484934806400865396256827476262784548384602433801019482930859138)], [uint256(195212133533563718210563361338394148155122952338453569500618889788538019465),uint256(779406544275907503514270518396379829821986929328087095205182961901113724164)]);
        vk.gamma2 = Pairing.G2Point([uint256(181215747581614277093986488144642704195583214214231811551390707437976930184),uint256(19109569748343684404284026638803351442950058235492863312743801434306580533306)], [uint256(7844209537090266624292873037424004708112386348981015611028615119623625041920),uint256(8049585159703419767461762287481092453665819565436005005155286078293724109071)]);
        vk.delta2 = Pairing.G2Point([uint256(4037619774512839429628655433229162906044350176218736381786763905801445192085),uint256(12849880036493074942294199082160573441086544889133490781253878378850296497808)], [uint256(1614401642019863758299873922422180241939085601156801291916571109910530598146),uint256(6041524533777142958777756988412159505090165948407063790133267640115996591026)]);
        vk.IC[0] = Pairing.G1Point(uint256(10614725299562402576034737453520031743572108598830786147642564100880342855092),uint256(5618507180279436804615674736155476226206910024678055371269619599722125899080));
        vk.IC[1] = Pairing.G1Point(uint256(7377251729259704120044611952654091208184284235653816030820731712912258345354),uint256(14409973730393885711126125291069237881589547520556288152573224049927298710407));
        vk.IC[2] = Pairing.G1Point(uint256(4302325192154110153277031674052573835288747479537584527507993772892077221363),uint256(417792316457538668262869300179027834167692727276950402021926865884861333112));
        vk.IC[3] = Pairing.G1Point(uint256(10587555815214752511668405622402470397908742069189329876533484943607960438330),uint256(6758527787539497617977127313753227276837217352889451736485551170268784632158));
        vk.IC[4] = Pairing.G1Point(uint256(14329899631487373644822002187976520560636090135559762130931594222017039400385),uint256(10955199064909231803879042539656570898474385987600243999152790934829935543619));
        vk.IC[5] = Pairing.G1Point(uint256(1300593843681501769849430083221212577985036016352235630082867200259664866434),uint256(1959773359612946846837696083676065047158237605395785247022715570933379227669));
        vk.IC[6] = Pairing.G1Point(uint256(2951223466171898432584396941704580383271827024122812049581100358412878079799),uint256(10512131816787078793425548109199810383150946209131414690107879656365445344924));
        vk.IC[7] = Pairing.G1Point(uint256(21233386087767181921312312891995368881587629201368442644338887082906922305525),uint256(12966410520152716429616298616929090344311996833711770118104114978064209479310));
        vk.IC[8] = Pairing.G1Point(uint256(9424890978511421440559338696815772874478893477040854018035145224779875001887),uint256(13295362816332429806170254832204549519780192877659846781761330301210450858740));
        vk.IC[9] = Pairing.G1Point(uint256(7406704214094666834892897347225377234994429925346408845752779100894142846905),uint256(19626198935482704126415049010515017314163460562580388504785960071976487190009));
        vk.IC[10] = Pairing.G1Point(uint256(5711659955964606732591188915898479426172121335701041265398111789253719778236),uint256(13304309088713110682690733803484636199592703852318397443784171080015821577426));

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
