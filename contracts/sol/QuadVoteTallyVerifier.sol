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
        Pairing.G1Point alfa1;
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
        vk.alfa1 = Pairing.G1Point(uint256(2966519648266249529415350274116154867473496155757000182396572398383971119548), uint256(3897821655368773600075248319221030785263181269784121537889421794756327765821));
        vk.beta2 = Pairing.G2Point([uint256(15155727980519192849814995493395891292341439603054356383040087693963613149315), uint256(19044163779341516544368983300106720316029016542628737850828608485774786753400)], [uint256(9951150885681078814434924480699124133766080440799606798223559675675111372394), uint256(4930955139319244389378012333611126099213069513114439529588550931754467543617)]);
        vk.gamma2 = Pairing.G2Point([uint256(10285768176237451986373570738652987854634671029310064289617517653515224901950), uint256(19552545711560364999370027499331786710786107565157119620628999265344113581735)], [uint256(1331294033740023430316478433689310935403973657034530571795641842190161353010), uint256(19552586746246161150927900266842616051450952952792755681894927253633585636026)]);
        vk.delta2 = Pairing.G2Point([uint256(7659298948633303015736092017105627085318788812757786323355013230849965429672), uint256(20209673975466006264926966521142355581537551739152694053681843210914690033243)], [uint256(21146708984612385435062462714587550434255653755001324771304296551696623974508), uint256(13684472135615879594301837635951107344516921513621132686457993592589347801890)]);
        vk.IC[0] = Pairing.G1Point(uint256(21286003736398213386528961763183330968302446950078424622813769122466292090673), uint256(19763215001341845370789013460332139365542928371512176924563750539659499989211));
        vk.IC[1] = Pairing.G1Point(uint256(12733286678021961726504291225499877749346666642095995411947596582275659197046), uint256(19276507880893888826855237699327243380313219600381812015623049991607706258635));
        vk.IC[2] = Pairing.G1Point(uint256(9094959053747943999150093809083382732993812782464158553967495765446093482985), uint256(21541397131027887685084476581227276214970495646922355569655429206685482200593));
        vk.IC[3] = Pairing.G1Point(uint256(6494754960722184610709297042296919682480372684308371055572807162712375845743), uint256(12772084384576425058598222052937160291484025086672050478170990764915491412499));
        vk.IC[4] = Pairing.G1Point(uint256(5427823883788460208051182032966156551211573226366836745183855698036832092738), uint256(4790299192888717655631891255136467127506819703365493916959702353309803468637));
        vk.IC[5] = Pairing.G1Point(uint256(7713911357650345905220380462735515595527053704537164023615475414966684706034), uint256(5322108548141846720291431417350033478795919601640158391100029241660730647387));
        vk.IC[6] = Pairing.G1Point(uint256(8021295256137878421277914027563107388039685430211834819878728079086169746990), uint256(19890517125099310126497615410724702332331694112758901373315849950808326132665));
        vk.IC[7] = Pairing.G1Point(uint256(6741150571346173696160343058721486661550457581084120149816983624047106890747), uint256(19099222720645692552928361370481787037946262686696066843003820636133618973139));
        vk.IC[8] = Pairing.G1Point(uint256(18519164766351055318766663873784171504380119008948677350946024147443363322504), uint256(19659677970879317305776118157086083121184392521782629038964244186435392657906));
        vk.IC[9] = Pairing.G1Point(uint256(5539199737924480762064571291597456123426454008815705311405594162381477911482), uint256(13922320688500122247376815052205028151134519484650521865697643453401151166755));
        vk.IC[10] = Pairing.G1Point(uint256(13496452291787985921427296127837759427979731101342067844248854971021795645797), uint256(20082105386515986139047067142766241466117736871311573110657575403324195802158));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[10] memory input
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
