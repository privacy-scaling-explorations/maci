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
        Pairing.G1Point[20] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(21088486135616917881449120656449395952063844779200556322088959095967198677397), uint256(21357270172255871209017576823080881717375763555978885390507931548830942519872));
        vk.beta2 = Pairing.G2Point([uint256(12060326137058188132756279060129820973136115455407804185041238939605163251972), uint256(19714803025332969276132225424739104849492855433147628336148006528223917986112)], [uint256(8778708979973849147929378235272155702146949503807592150608829947376636498218), uint256(14233684158794956320989212639578724172575172962177822347084070812910630891620)]);
        vk.gamma2 = Pairing.G2Point([uint256(11696581343298894543706975131476957525232038092879160331199113066348017855472), uint256(14169068040431746869837743643092856982612009402680044242653920323194331039696)], [uint256(2819354528078488991343272522823019673317033485556846946445994447672229114359), uint256(12464853891689739424119362995706144664014840560404474300361576358182096391042)]);
        vk.delta2 = Pairing.G2Point([uint256(5278414202280673283238475780579022571252151350397758759428562194103352642252), uint256(3339871825831141917131536451055094826041536732997157699481003899758328040879)], [uint256(594481446758078947209667484686755708368202658608783813853164838476970842226), uint256(125828690067914406283733129486071525978999932238344730246226234095653753161)]);
        vk.IC[0] = Pairing.G1Point(uint256(20984594901440004788498562416283659370668736185078650830568529611927042760760), uint256(7245877846044599704903098095579026698716288423730074079426357777577684052821));
        vk.IC[1] = Pairing.G1Point(uint256(2236957407049709176570443325420626325247665267244935003987224173009264540562), uint256(7813585573831184639772530522390342157225208082607539375508327412902116539422));
        vk.IC[2] = Pairing.G1Point(uint256(15091000586826395018286937777501199781914809567224726354333624323611942447719), uint256(21842603695771603700638861383687318816655399056981601799135277283624315982816));
        vk.IC[3] = Pairing.G1Point(uint256(15745347022577923857892873840268365380519384945263562322748470491645740403668), uint256(8823004834528579609515732835835626384767609449898711625201235329412500384620));
        vk.IC[4] = Pairing.G1Point(uint256(19702281807134110350305348462270138136502707996009745135564348340312550129372), uint256(17153149602649251971574381654537723798964694959774894178764278265011986448896));
        vk.IC[5] = Pairing.G1Point(uint256(5634460882923642378447072830039273601550360379507458956949181375482705266946), uint256(19602639772361686412931095351415924126727918611296896367907738715649249522117));
        vk.IC[6] = Pairing.G1Point(uint256(1167078200845218584442327317579162228134921787657677827379855274446810331887), uint256(17560733387917829545939088690949339880370335690702677560586731269192851281));
        vk.IC[7] = Pairing.G1Point(uint256(12802344522537333035411500575498823729951647052981959830715474175834801749476), uint256(14759426930991772123431366183234703593154814590378337898394038438694140171336));
        vk.IC[8] = Pairing.G1Point(uint256(3560298183456414044920544350216496826043943748385106986549879870300448584175), uint256(4552651495960316611569411053383062842898115722311265445864090591406419748572));
        vk.IC[9] = Pairing.G1Point(uint256(5411126666548044855679013038670681903044957056464104084703793634733254687342), uint256(12197641150213653819857690103145286066117401945030338683546861973758820462990));
        vk.IC[10] = Pairing.G1Point(uint256(11635630525299964041193729300524987028517604046405688848564979454613865037818), uint256(14155103438275985518705735911151495821574738886759173442754188718816632283463));
        vk.IC[11] = Pairing.G1Point(uint256(7293611896898378702020652396402413050210006513145095499920493565267013059049), uint256(7526004502463624320723640144562254050639887987247948928726846189280139757213));
        vk.IC[12] = Pairing.G1Point(uint256(18805272593046921737767220564742752851783007687938983160452068131439208336154), uint256(4056065282184509212141353056406540971758060836599401379084216444713237693617));
        vk.IC[13] = Pairing.G1Point(uint256(12610612835841442121514132337925503811688376709191272716300775003177547025125), uint256(12472137753609118710465553808340287547573302844063453313178762585103317653052));
        vk.IC[14] = Pairing.G1Point(uint256(10519373261325664339544293981545221001268635378153127250896603024223939201221), uint256(8442340008356998924583220928184666650268912672470006062339641981083848068066));
        vk.IC[15] = Pairing.G1Point(uint256(3715919015065191142149493708521066487066276082242245454399685921402567104457), uint256(12859934914556212342725023544408699583448326873167530631441278386209109871206));
        vk.IC[16] = Pairing.G1Point(uint256(4232137844344111248195557175897256437450411446695970572041525290985678112896), uint256(20846663279065254464050851710992555326119629406105686605215374148397122049170));
        vk.IC[17] = Pairing.G1Point(uint256(619974419042869822730022907009702298859339896524778808361832381932576888226), uint256(15776319590953796600684957669534364285270845047563829435833284677581790350252));
        vk.IC[18] = Pairing.G1Point(uint256(8887263568838342853626681865666244609065945248308281035814660286789298730871), uint256(9998235471336423584849720452516926073327588229598605290589713146810293523575));
        vk.IC[19] = Pairing.G1Point(uint256(14205945541310354498801433431038156331474722461224867480767820758171752567760), uint256(2687972084468412873931886406513189876174581034857847219045518471297365019699));

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
