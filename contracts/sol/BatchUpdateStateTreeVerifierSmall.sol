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

contract BatchUpdateStateTreeVerifierSmall {

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
        vk.IC[0] = Pairing.G1Point(uint256(6033387956244310351411854714573989532903083913320351048364228715901037042829),uint256(20832087335927682624992374646623856562469015727323048513556165258326303219106));
        vk.IC[1] = Pairing.G1Point(uint256(10742719171013247747075631856929518468106142701228716453527669339853178499094),uint256(3806135718450409404696743614853850008645236430113831375257212679707677819851));
        vk.IC[2] = Pairing.G1Point(uint256(2211750792357930698616723770639881165288524548201150012012785638870312218989),uint256(848877323432199432137953373125934738781763599943199519328963633190751568965));
        vk.IC[3] = Pairing.G1Point(uint256(12591516068675783753658255946493191385916398039817614038585864933917192017839),uint256(18680162685225695153403190284136768092287822058486878549438390557509866963760));
        vk.IC[4] = Pairing.G1Point(uint256(15487748454455026444604641279151428608459371240982770027689888049123094936946),uint256(16986229101831467073855587278317591410298732353219762838028754328723679500614));
        vk.IC[5] = Pairing.G1Point(uint256(15109282662910417980572730251950134951102808969471369961519834985213994651433),uint256(4133666350433044280003148889415000306156792964038448482332518824141124211747));
        vk.IC[6] = Pairing.G1Point(uint256(19913855048979036570262271757789043369604485533666400012925036482929039531097),uint256(12772736885756145218464729002654578894652356008563283922789804287605265307166));
        vk.IC[7] = Pairing.G1Point(uint256(21157942090635830232553151080700038504914684509942769617403054514811092109549),uint256(4024574525014524797423465563817563630620173474082285040060706862072035071283));
        vk.IC[8] = Pairing.G1Point(uint256(9515751941509935963937147362550252127899178810850387644212842092958293477479),uint256(5890878390914951479531269673911696682823715480145973570260959223831972356550));
        vk.IC[9] = Pairing.G1Point(uint256(13706248756523602776213805121507320981805364227115081123622033714193961321390),uint256(20376510185312235406745228531969354491969035021423207413389038576666877712557));
        vk.IC[10] = Pairing.G1Point(uint256(12891951333097436184236613349259292913836562559079734576185541628183177587976),uint256(8590920650530663326643019285446622955770603226909282980313585524135861988213));
        vk.IC[11] = Pairing.G1Point(uint256(1700713257547093128838290366301736443831191467747672044943417184245674455108),uint256(3680386337195780309508614956451486579973776914753431340594614722080022309970));
        vk.IC[12] = Pairing.G1Point(uint256(17950923901969963168669919020621378369094175916221509710362483450632874305605),uint256(16608892311051502534442471415189711389703596277876642627802371158835323248185));
        vk.IC[13] = Pairing.G1Point(uint256(3896316708708860128319557869675700601014849812722927925153449196154029135105),uint256(7573079554110264057860412650603143675855191522741018678387423373011303193543));
        vk.IC[14] = Pairing.G1Point(uint256(1468274440174709421712699124070258264654730762251786526472347887461573488029),uint256(12371665050140195256114291962377231431862536630802447363245949831935809893024));
        vk.IC[15] = Pairing.G1Point(uint256(3665296772139181666073148069036188054462524431358035997696541122761907181373),uint256(9048445796521116258173904849367228928037922696606486880638108569585710869620));
        vk.IC[16] = Pairing.G1Point(uint256(12630349423212526199890514514485476633266158594673198240839441413320598145376),uint256(21805242822068665069179064849435026531372410471478477115838274120695925735762));
        vk.IC[17] = Pairing.G1Point(uint256(4908311197649005216910651072958285455676588378746327917701373705664207482422),uint256(9713993289891990122354553386828021127504743433685762873465760635580604216676));
        vk.IC[18] = Pairing.G1Point(uint256(5268194776997459828680755562147444985214906699790888830251190275401428552234),uint256(5678971172823057367570207299198555266495014892939832842881007301737064720199));
        vk.IC[19] = Pairing.G1Point(uint256(12299846874796893869796181844260700513798148529193985214122993716016081006939),uint256(5448687138115528991067971634212513902081967122821870984208541042047345047502));
        vk.IC[20] = Pairing.G1Point(uint256(8394978222897866147872979636598955522390456844315802957106151136736792002063),uint256(4249011391159525890127844466685766921236141814327996866772062410388515244761));

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
