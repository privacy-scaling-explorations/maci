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
        vk.alpha1 = Pairing.G1Point(uint256(18891143039761523707797250510831020235912756852267214291027747867855883179228),uint256(12668722587105267727963746152358535581773394797786397375792413381578074288165));
        vk.beta2 = Pairing.G2Point([uint256(211023454125103842648467517834866808992382313449888567362353383438629143871),uint256(11397805772080980115596354890099475359429719270455185060324137910532783794866)], [uint256(10965734059658966707207642791514887372000415240269338320895531864758279662404),uint256(9026849139084537227512608635657932262002931957375613280276038054760234012002)]);
        vk.gamma2 = Pairing.G2Point([uint256(431901660049827309244205116491368555807374773382699948234094978479540833218),uint256(7191296774940460477682963317695285484674710548505424592526771505035208317966)], [uint256(7723638787005907420854325314191015680274549296682314491365141687324554095400),uint256(1969948491670480629625957211277317588272555421817386832186810863249191797152)]);
        vk.delta2 = Pairing.G2Point([uint256(16134468321433581653780143807051404548203434822190864132273172975268167384648),uint256(17023914915664881717749096812623588265767314803013671057009422301515692271181)], [uint256(12672470441631074490540294474567069699675306469704904349355688282003650807114),uint256(16822718748346635058761069798113317050814473978195413200973825606276116401426)]);
        vk.IC[0] = Pairing.G1Point(uint256(16605474836637904246201314795396985497122822776548089622792003058650579580393),uint256(6403402581581064695209156006281185874309058159934601845440075823554205869121));
        vk.IC[1] = Pairing.G1Point(uint256(19544144836289489187602970672577535317269313890756458660477272469230298784801),uint256(13009041051795422181775592931744856073645409660674593384463632755334021977430));
        vk.IC[2] = Pairing.G1Point(uint256(10364350496052239543053469384382147448387938022917352162752320220084795632797),uint256(11907731557192484966805784630426421341809033771660371112320914507137888874521));
        vk.IC[3] = Pairing.G1Point(uint256(16009021959991695296117208003268429135574139151390358442458790209729807036601),uint256(20281615735272761754427034769494378696680565927010897326573363587562908246931));
        vk.IC[4] = Pairing.G1Point(uint256(2942418842097401784940148954649512031667999358156719162023986352631423191321),uint256(6246596293592450533744413792040585435580362057453657683519353692567393906569));
        vk.IC[5] = Pairing.G1Point(uint256(13664494653887149856940641120070081842649624098892883054200442617014927045263),uint256(7415842875441435072187678378164082199068021105005689634764561507152963544685));
        vk.IC[6] = Pairing.G1Point(uint256(7365602033819802646592934932566375084047109805752726921457833652195485853870),uint256(14114907346678965846080116181879335263015688952550029172437921306208204585264));
        vk.IC[7] = Pairing.G1Point(uint256(17554736940111958800751549357117103530381306965338483917697368805244615352764),uint256(6501606255099592290614435569521299488978257669613362400526759683975550283572));
        vk.IC[8] = Pairing.G1Point(uint256(791455654249800277151761299280111265840913389296105654602090320212593321475),uint256(12717252860397002704229618468771372650924957106847791331763254870917450720598));
        vk.IC[9] = Pairing.G1Point(uint256(17591282148238079508998127742026494898916267444524855108431685690455250178943),uint256(7645767539098768342337421232016247561038095304888276181361115186189570871811));
        vk.IC[10] = Pairing.G1Point(uint256(7596864659068899195001485080474557561019638751830843043714802819122065560882),uint256(8256461108303709696241586076809814287527795855992385799707730684418158451158));
        vk.IC[11] = Pairing.G1Point(uint256(2360682127908336166461576299612914360178800802806577914238635287123452718155),uint256(17567642951525286547615318101689596977814903707604081837688541823689453358848));
        vk.IC[12] = Pairing.G1Point(uint256(16228328842048405274060207312034827843749464197504591033801468727706501937903),uint256(19816476547428923580518920334650683427099517366171446922669745597908337821488));
        vk.IC[13] = Pairing.G1Point(uint256(190226603191030027272397238213255373109611301730312441997978734417022023012),uint256(14438713315716818980040669295826590272183259817827235435982246482639748199145));
        vk.IC[14] = Pairing.G1Point(uint256(6054167862337326333971833500816471019322106901887090301784478651381937973516),uint256(15385249157226205972827305550194605520791617727160140726715091837611413500208));
        vk.IC[15] = Pairing.G1Point(uint256(16956977228297724097608004947574506741082798667614131638716809197477333334015),uint256(8218167584897442051258612761077630573130340116149504928088634457786490772912));
        vk.IC[16] = Pairing.G1Point(uint256(16963569783756988917609648052741299418281935798558850073901584227710696863841),uint256(10677056651117418224122582025218840164905418546444105569649797482161204410430));
        vk.IC[17] = Pairing.G1Point(uint256(15137281153856289260922890091638794731118099383223557392610513244134131429801),uint256(8390155209843259790166707946975944590652110998073237931714311390152459833199));
        vk.IC[18] = Pairing.G1Point(uint256(12357178303321925841869607973355163899917376843685888150318829531960077746041),uint256(8627021244844440945153258385070708968011244835787129312683985318073359855090));
        vk.IC[19] = Pairing.G1Point(uint256(19034151883848116958064428033547882593247906112117366965368350252311418597399),uint256(12687155661393380150731246142986427962547669104920950448696182865060598894847));
        vk.IC[20] = Pairing.G1Point(uint256(3932266031539870106648904779581700709314912874400111814059946694091514505320),uint256(107555848959238427816806248583009357356687773598572069259733938569065832557));

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
