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
        vk.alpha1 = Pairing.G1Point(uint256(3848848841837370301535904520020801306368688664403481036784462884145448456257),uint256(19309647824760643186407237632995710564693585007962801984352534100475121814221));
        vk.beta2 = Pairing.G2Point([uint256(20439152298310834656765679478597476560828675425477094262475757820867620409482),uint256(6762221063039919332393462195538429029046848426657133072385711828750921128491)], [uint256(17754694144161742506410877470941045716618954776823886452517101922600574551597),uint256(5579837409961064949198775848010094726452060934896773900165664622479185271198)]);
        vk.gamma2 = Pairing.G2Point([uint256(1005503236211625675201688583657090334420651245433944593707567036747109767481),uint256(6545630958738570721609013677012719472533372475035673046898183202307750118731)], [uint256(19225821452296291225472304309507130607710599081490189758551508960162806910302),uint256(5783703645206528306900153794190072904116687596642676622215733311817393773191)]);
        vk.delta2 = Pairing.G2Point([uint256(943453545414744609151989452864465101190776203118691182897984549920918302489),uint256(20132922424824937316645411459548840010521617879119663383258335119464562296559)], [uint256(15208710598377313968442645609021345057030498193913225442066385229938561937128),uint256(3657621663402823454548763949450964023989182400063197531880495422130828874872)]);
        vk.IC[0] = Pairing.G1Point(uint256(15230796174282947115710376096523353871301988985992877251114366550135204942897),uint256(12360088205250487148742971590987057633214475582659648670196212763637073736083));
        vk.IC[1] = Pairing.G1Point(uint256(1647167032011642341778697245615793015684976025943219757530558690672145941509),uint256(11368296532618909767228137010302081245347252075593141063437354088907106924848));
        vk.IC[2] = Pairing.G1Point(uint256(3454664509985105051515475251245908610979355576193922559048784053929291901331),uint256(17231404559107620804826944467394832492117899052969724709476602757392435482149));
        vk.IC[3] = Pairing.G1Point(uint256(5736914312502883254903858927814945484329169799666216431519822170339444315304),uint256(21560765105844080391994318529089748173488503745148281995991242343994448568706));
        vk.IC[4] = Pairing.G1Point(uint256(6353087401701734426684371564404720193706108797305355350298531988765240806900),uint256(19771910996724347234368164373973269919917422967658734729287303925437699690558));
        vk.IC[5] = Pairing.G1Point(uint256(17295694809236026932433693359372235882034808510646242800996184543516642146267),uint256(17707250303018647732738061264085901143726259272998337368896792006543693133653));
        vk.IC[6] = Pairing.G1Point(uint256(15636218747751964769358389030592914278975662876896774607260855863670818661364),uint256(6063405698666310946568197782627635043692027796392334278559281082694002133222));
        vk.IC[7] = Pairing.G1Point(uint256(19727552510846486601841307018102803926615682831097100098093820362019361978323),uint256(1537788598575604322058671317081718814971276028513798329419462485318859631345));
        vk.IC[8] = Pairing.G1Point(uint256(15462495701198180076210931559602387471879409718334370894005303499268746294330),uint256(11815339680439126816224236941982612945372719646172052351723602717791571747131));
        vk.IC[9] = Pairing.G1Point(uint256(6702311270824981836320473076034692924517396249194539468697899731397057044262),uint256(2819447636826730683057773015576914468502216032822656758381105983006563965112));
        vk.IC[10] = Pairing.G1Point(uint256(17431278579465564809629916643391567239848180518567167769981239765602144092446),uint256(10701764342450636420345014741178412060632231481721764176855215034990484171522));

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
