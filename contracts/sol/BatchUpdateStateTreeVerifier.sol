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
        vk.alpha1 = Pairing.G1Point(uint256(17133464088378687077088482264559260263983148865902404429977722280234511381298),uint256(13785688003513399409060194302143834374230384335029440050591372860926238142193));
        vk.beta2 = Pairing.G2Point([uint256(2840484440438769946495296280122215248778207395743243463056927142949692947992),uint256(17893260557868532777170757032257510671949880325894417303584532948507645228680)], [uint256(9836656668462968607190121393344221140197393090610503892255635775752104592205),uint256(12486599733786832744178685220875326743182566177554272371383407722520744824831)]);
        vk.gamma2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634),uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531),uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
        vk.delta2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634),uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531),uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
        vk.IC[0] = Pairing.G1Point(uint256(7474583716888807541946522122527135464184780376105103314685958157149902006394),uint256(8768944334239736600077876916670113908017445142214258398864530175216375495980));
        vk.IC[1] = Pairing.G1Point(uint256(13957054292008782594744264518765918371118895530729327377152151761673223252221),uint256(18201584481899450892208638870860396722263220898231585278241208811555898490575));
        vk.IC[2] = Pairing.G1Point(uint256(21588155445535917396724196838425982275827615265026881056856827888872817209689),uint256(7405197454564765270158520370387232820283806846693318695091820975277630731660));
        vk.IC[3] = Pairing.G1Point(uint256(1521750963302980056582484012256944362021153496441877669439973753609755170761),uint256(13866014510441208141272015346742547326801753333798095955330446759385047725802));
        vk.IC[4] = Pairing.G1Point(uint256(1318249344472794288858639108275477474184211830594486669765923261908614176559),uint256(16374775896592398200652059023556723509085738213880865358018812722544268335247));
        vk.IC[5] = Pairing.G1Point(uint256(21550442491680843431071513292712955668221308615738363011151625109813265681948),uint256(14093312072108194239478560980333551742766158867209361509388867069885219156240));
        vk.IC[6] = Pairing.G1Point(uint256(3710562219723047459680659061787584351597339165753035004488250060619230629335),uint256(10592491717287292679022622868383376604709256338279175027131439508423117650072));
        vk.IC[7] = Pairing.G1Point(uint256(1946685864659042273065794404633655420133895795084649368613726918289119660079),uint256(17448157210059048908382677290427384199083177248552472621016402645955354754642));
        vk.IC[8] = Pairing.G1Point(uint256(19552914623224855299196533156348396485913589750392682376171222360955673315826),uint256(1497774165109208007478055628640409822634075235984989009485364285854435249197));
        vk.IC[9] = Pairing.G1Point(uint256(8663588637707897864579439050985609813904943570816974947933379046056392730428),uint256(7123528742604557524158923748543783396526447661649426842783394614081871676153));
        vk.IC[10] = Pairing.G1Point(uint256(6386458894257814304181581810228051887438410178546460832546930323340364967750),uint256(8274975352990996740918259501802613190819205239432556539489486119318098879973));
        vk.IC[11] = Pairing.G1Point(uint256(2296491330622409167720832620120597761120342329353205115442636218985673351246),uint256(18614532574150731582051353040945900592008710527222003871697023935327034434048));
        vk.IC[12] = Pairing.G1Point(uint256(2976782750861120667700095552068075149696979524178413999765224635517155834841),uint256(12557985911110186844066779484891156127067318212330197745522021742701125774726));
        vk.IC[13] = Pairing.G1Point(uint256(4658111353811033878949057332873703085505504665911937773308203109677032743318),uint256(18641665869729675094727974280414501505647721785031425827374685715070853020444));
        vk.IC[14] = Pairing.G1Point(uint256(6114171221506708404588458819155265521532489549911877342975666495474732347711),uint256(19623940489146247947156481850923773412770178494772606418097330580035169596301));
        vk.IC[15] = Pairing.G1Point(uint256(6963578219185066827410721324216649975739433810064534768087710031348420935113),uint256(14749564936647253058055570196381305235560158021810834757273066566902920041089));
        vk.IC[16] = Pairing.G1Point(uint256(14185103112026261874898216572592914896668258259083592573913220363099595450822),uint256(16342688309087670057924732473611850396247461969887737469953184026925193666128));
        vk.IC[17] = Pairing.G1Point(uint256(18862038697762152743116583980889923364964660523362286578054532129714124183316),uint256(14715508400218135982372782086826880132007787860953574648691578214814970723321));
        vk.IC[18] = Pairing.G1Point(uint256(5669403353212037933645258248315752938569950128365255316787965926848525804086),uint256(18714942085085705112896633819557952421021543391987947503628111553532336407936));
        vk.IC[19] = Pairing.G1Point(uint256(6260720954267349214950333798502495124948216942560574129858109160182848716849),uint256(21760174632778859932843827278184742531094963981755878318573081915850531393934));
        vk.IC[20] = Pairing.G1Point(uint256(16550361722470815060277830813345935982114253014765104174287733431150753808965),uint256(20943090408369750208720165445848471105817912537173755733627072238883460882727));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[20] memory input
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
            vk.alpha1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
