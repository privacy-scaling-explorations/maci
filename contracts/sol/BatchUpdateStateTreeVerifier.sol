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

        uint256 inputSize = 4 * 6;
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
        Pairing.G1Point[20] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(2615423696431572534565359708279499983605313153547506735501387382453112377931), uint256(11559373275533721406089312980597651530316033925704718666036783802468528680565));
        vk.beta2 = Pairing.G2Point([uint256(21288993437364821098564536102068299452245306229167222691719402455518394961379), uint256(14096100341710210786702887395626908281828362278518254315704641124642733439000)], [uint256(9484053788158155671822613605584990265620074084304608646947852951045807262187), uint256(8926352889567951298119667922428490273852495021852089335629399893927650538703)]);
        vk.gamma2 = Pairing.G2Point([uint256(1599897032274138091470145877293108472690878654547206393798047359566149999847), uint256(6005770375044341262547900239057684165450183602109986830161745175076316431415)], [uint256(10167013562626505006597207114862806175832605914139899578796190904606725696103), uint256(333863404608079584870414926595310738484787587431722219139253300342280911948)]);
        vk.delta2 = Pairing.G2Point([uint256(8270053837197598468837996937171292930432789526802786045833444671992322631453), uint256(19304655166140938430056920528848550484697359989726319154940968307393146963232)], [uint256(8976930055825950121993808306621125454634871339446889629869603645442230507260), uint256(11743036723295621651473127399664098700409977334508061554595583279748502508386)]);
        vk.IC[0] = Pairing.G1Point(uint256(2425358288286154120494690705776398946160795628853486418340091902343474706089), uint256(14131857404281725493404014077436101779409120780201944841585349202797452367575));
        vk.IC[1] = Pairing.G1Point(uint256(4164742856851938621591335368726194160549360749639662656220350886383618876036), uint256(6144080738176084411944861334793604055219895477848285344950142659733205936177));
        vk.IC[2] = Pairing.G1Point(uint256(10884004159631116999375354738391515016163546369062942694544826345959911780201), uint256(1894639180599599459786466957313882420185478965745654047496640326761482363379));
        vk.IC[3] = Pairing.G1Point(uint256(8794170770382201553054571457485354149262507421728780513938780182248888978177), uint256(13160289748155551577446657978528879364823752228090831504082550382653562131453));
        vk.IC[4] = Pairing.G1Point(uint256(9112789337179201942867680334989570804229873307471877808945462697367443420818), uint256(12600527234261779226315263964340452979230220009197910097954084844776869851320));
        vk.IC[5] = Pairing.G1Point(uint256(4565037723588295340543222866264999800714773874302002015623117124075268668316), uint256(4017026600812584474851369745471528443359724982876508146114413920379367146982));
        vk.IC[6] = Pairing.G1Point(uint256(3829456344228748068861946576438664626302692922841290561225002583902243458108), uint256(18017957756943629023784071547878801673952719655760208661081193616637904387735));
        vk.IC[7] = Pairing.G1Point(uint256(16509925175407414290851300489311066700763407432885385603639984961276546222598), uint256(10874512807204528246429774330722008371871895534168328359217474517976073347657));
        vk.IC[8] = Pairing.G1Point(uint256(5634313343083739783178920665393154175303969776346310342221808272922116594254), uint256(2629806720333183185350755118887833594942142355737158711367758804230226228768));
        vk.IC[9] = Pairing.G1Point(uint256(916860315638158523331528285405489612510164944295041510035269425642248369439), uint256(20626658127336841795580458162798470406034450460760790304875691557509830823381));
        vk.IC[10] = Pairing.G1Point(uint256(21548255733191619106520699009892807322165518530263974043224251750518098218030), uint256(9228211059938219101423997822695143527927746626583957153778516201770700361787));
        vk.IC[11] = Pairing.G1Point(uint256(2903363866812311689447987605284111207750044022316084568295066298205536984194), uint256(8589827277265671543376227738737384570301540302156928182627087991557096194839));
        vk.IC[12] = Pairing.G1Point(uint256(65600006623772640286490770018276997395588193979395146033065576328622492107), uint256(8576742526843280494005723330308277540806638334810984219713779524042563344803));
        vk.IC[13] = Pairing.G1Point(uint256(20809012722771713640609205778494474978338052620903982046361799670521747630483), uint256(14678169472971528426943981714663892082545306639657531532379019320631118918540));
        vk.IC[14] = Pairing.G1Point(uint256(11536403834234536274198072576148129967611308226854653513077824748709950713688), uint256(3904291565454019394280260748370917012035420302827638039329008671782375195769));
        vk.IC[15] = Pairing.G1Point(uint256(4220364074442363832221209753339225110694213091493013405405674627222632528390), uint256(18950855248993591662046858680984340251640778437837027236917583829778142171317));
        vk.IC[16] = Pairing.G1Point(uint256(2765179614022556472597751347752494460261729195348171580391624581378489894943), uint256(15142584900936597507689944665982920982090165438361344420479586017564557304094));
        vk.IC[17] = Pairing.G1Point(uint256(19891163686553176961604912476662798282843215538666414752200867349467055449650), uint256(5844227708323555052843526708712959723986480398034176279230031084729102640902));
        vk.IC[18] = Pairing.G1Point(uint256(19572814591504002452618288698670835430718121339857481319400726045717831782053), uint256(16096328351591153795288746846004848721061059464077911702142839805400194334265));
        vk.IC[19] = Pairing.G1Point(uint256(21292872320524453175314085147700634046403432793171488440626741567743499405019), uint256(15682781936391527268968844211078330592950340337071727400025517787298178806401));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[19] memory input
    ) public view returns (bool r) {

        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        VerifyingKey memory vk = verifyingKey();

        require(20 == vk.IC.length, "verifier-invalid-input-length");

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.A.X < PRIME_Q, "verifier-aX-gte-prime-q");
        require(proof.A.Y < PRIME_Q, "verifier-aY-gte-prime-q");

        require(proof.B.X[0] < PRIME_Q, "verifier-cX0-gte-prime-q");
        require(proof.B.Y[0] < PRIME_Q, "verifier-cY0-gte-prime-q");

        require(proof.B.X[1] < PRIME_Q, "verifier-cX1-gte-prime-q");
        require(proof.B.Y[1] < PRIME_Q, "verifier-cY1-gte-prime-q");

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
