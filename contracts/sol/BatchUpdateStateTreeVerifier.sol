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
        Pairing.G1Point alfa1;
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
        vk.alfa1 = Pairing.G1Point(uint256(20348928669904335179479708743022171079203207749267073015571269262430787950654), uint256(7960828250396222055956545822508949606463252034995704757053044361799447940823));
        vk.beta2 = Pairing.G2Point([uint256(9244143059048397437560072561303954180052618094457237028092861127427790670978), uint256(15735862211191550073512367340819650708307906448623746843893186589688979727195)], [uint256(13567382252823540530796862740301889072578044312732673741398197528162759423098), uint256(20214610923124716984633261996202727345992913497777974340546890421784640070470)]);
        vk.gamma2 = Pairing.G2Point([uint256(7526997548689293674592890819182616461275694298600942758279235701495573918381), uint256(9725307081698294665635646901993524360480299957156240196479120554128011859610)], [uint256(17541466337544235968502624735740054399036754023265341120550367000661869500818), uint256(16784038441225125790688076100349997188792099632250852206535247075875788415573)]);
        vk.delta2 = Pairing.G2Point([uint256(2624958208051038968663859433532423417193919029749652143297545826254851970117), uint256(4969107309070927412402520886950660478350355885883978657326495813685667437629)], [uint256(9329726674563537062155262601988460028203964205132728550361329003957006688806), uint256(19733321904040306626885156138406070793387979629790724741178883636757950614359)]);
        vk.IC[0] = Pairing.G1Point(uint256(11567136519975771608211386660495697529163352092711715238835693780155671482630), uint256(2481366190884650119080107871265206422334979093080892952153910779430818355605));
        vk.IC[1] = Pairing.G1Point(uint256(20151533536455608190617500643711405827104574511091112910644257730216658917229), uint256(3875812747068672753086295054742456858405151644162045990103233644681029791788));
        vk.IC[2] = Pairing.G1Point(uint256(6150278653464441544034230426668394407407067740591775667356602232426508754768), uint256(8769485530735133725601507302883888792315154645991619858142965037997286283126));
        vk.IC[3] = Pairing.G1Point(uint256(5595164314936557576711130950843963333330049288253622712984328394753944641898), uint256(19900113897672431779294864577817595963657888177000218437878060125935690249089));
        vk.IC[4] = Pairing.G1Point(uint256(8852807802677771297409490324237588331026233887818859792788159309806158254189), uint256(15725441363736449702299139472043821071089859389995967219434048378441220505266));
        vk.IC[5] = Pairing.G1Point(uint256(20755229153338038199531110508725826369349669421172619983820769872668232620779), uint256(14446843308510458332069035330271896689844024270772340107948773861868362042302));
        vk.IC[6] = Pairing.G1Point(uint256(3461391941383559011087862015760890470991596549219048181582973315866462627135), uint256(2758299084309894372668982435970661200321032023821099566235111856626259030214));
        vk.IC[7] = Pairing.G1Point(uint256(2074846394388870782571997331336214760818184508287717725843275731364146782313), uint256(16075068094479753329742925386458296514955896455916019149847888847094538529320));
        vk.IC[8] = Pairing.G1Point(uint256(1448221134563754616005440783292665915405978839746244945569761893881451489143), uint256(734067624453952475618926260317914330988616155175023150509997275802393751523));
        vk.IC[9] = Pairing.G1Point(uint256(15478767330657993265976778148327265211974428087218845449363933806751164882087), uint256(3848950637006346880104121785398124105699935803237520764603245665840336073218));
        vk.IC[10] = Pairing.G1Point(uint256(15806964190829978717086557776024522713180959753314859371134267247740826712108), uint256(5692626760475892236318063364132217496433544461966884350869403949603973933622));
        vk.IC[11] = Pairing.G1Point(uint256(5398891454783583457457751319908297746082051510404039944768642762790158886408), uint256(11084858936266991296403167017586946047164677092865169263987017431475847798272));
        vk.IC[12] = Pairing.G1Point(uint256(19955267269362753915382310020182634192396608179842932693543230467569071371593), uint256(620682105116035299586126526357176044872565007258553795255792477414088939882));
        vk.IC[13] = Pairing.G1Point(uint256(9909386729107349202264124918658720685690280230351137880125889039362903055308), uint256(13928627751758066778512448489181739346129034063908202486150322953086765036247));
        vk.IC[14] = Pairing.G1Point(uint256(20755428161373223348585835989276284894501075503964236895192741923599872052330), uint256(5131606835761394730085017487152648411805988285852791859773435594945240797886));
        vk.IC[15] = Pairing.G1Point(uint256(9815185363967806665711112133840380651981398721299762242195047610509595405361), uint256(14438710829070804849452973533892334186144564688337812494668314339326767622433));
        vk.IC[16] = Pairing.G1Point(uint256(13099226644535173432323948502602275953135756158196962914573274311269989196067), uint256(15585620777204933708510850863482940460323890141262564288777372130989400380736));
        vk.IC[17] = Pairing.G1Point(uint256(4834479037215960577669799044281999680822957107567354787112840607922518161422), uint256(19953076455379878766675619697461987403979470567959757776000092282210611955994));
        vk.IC[18] = Pairing.G1Point(uint256(9695736222473506809277227057493567681807460573031043456235883011736098671869), uint256(19786107993138779939435647269975528340995521769720553616729873000977056396425));
        vk.IC[19] = Pairing.G1Point(uint256(5890194796173310122010898965060495763095101973825269129118824982611666945205), uint256(12817558639016173835401618116229483271322852540958931939965974890983593518652));
        vk.IC[20] = Pairing.G1Point(uint256(19558326241523537770262890190162426021380183585075602688034516111209439815870), uint256(11705046864843985223419841050262282620102081007589379756050816158596433801114));

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
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
