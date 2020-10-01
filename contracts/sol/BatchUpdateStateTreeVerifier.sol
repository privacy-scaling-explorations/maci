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
        vk.alpha1 = Pairing.G1Point(uint256(9935137316944819600257341292685279601380605824138128976756315320032101319160),uint256(2403976027985299829426811578293308875515233629489556217441783125577332083437));
        vk.beta2 = Pairing.G2Point([uint256(13855997985630136849060354691986251497454533272277837649959186341316931766279),uint256(12669097473890778855783815392871399188940816830576870902898527889749064220443)], [uint256(2316289351077056659587493987718463344617258562610237991485086914466711121641),uint256(6969307098310691760757575738918679862310404747741902169777224148308802669261)]);
        vk.gamma2 = Pairing.G2Point([uint256(16087089537789076518377531294452357327368875582223289765014056504925687059278),uint256(6869559874301119652458350596735075774894862405704949067412927959975934819335)], [uint256(3346515581875614386594902556413443086101369445999573161962021304389759694084),uint256(10433465539865835945540400519620781544625869039256119902631174406456862577406)]);
        vk.delta2 = Pairing.G2Point([uint256(9588240874615323849628006523013668881592504702422823480269501601088633500387),uint256(21496027685127276095547861164518901049209419610698663282686623234174918071235)], [uint256(2809256310928623744459253642572466479202428186924347476880794680547816728568),uint256(4408448597623692101690826423283716336908703526077727874550824004166228423885)]);
        vk.IC[0] = Pairing.G1Point(uint256(1993206821356774794930850864657589874910219087188680006896340397560906507679),uint256(1711003629262342560488799475223236560042516696411122236702866012220105514435));
        vk.IC[1] = Pairing.G1Point(uint256(12330374904398720615671116948167623315075879446802761807869996307449028668738),uint256(11583430243455226104553936958604839197928433896051872758671993536026551661240));
        vk.IC[2] = Pairing.G1Point(uint256(9687594723375317430889245609473055695267541196085372276134877572018506204243),uint256(9276628524873127771117714206402419190654775052079836432280607179053409511625));
        vk.IC[3] = Pairing.G1Point(uint256(5219690932705666258505502479065567560234049685017255540477506583091606710401),uint256(6443326390742810400459723884141893007102279987626616409739458679458603035195));
        vk.IC[4] = Pairing.G1Point(uint256(4855039747547529100309087237221135853513812976995883190728381648602792368173),uint256(18100224024440768203942925338615462844697890335442660629933990446998972967918));
        vk.IC[5] = Pairing.G1Point(uint256(10903493986112433008116414207667801688858688398388023738654375550457250037700),uint256(11476620344659817487334056684405091976176490250610628344923520086170401354819));
        vk.IC[6] = Pairing.G1Point(uint256(3016004204341735973590474804958900587580133179500157330046987750492146923879),uint256(5161098321521494384891341654180735933790185495136170979604030459100641561819));
        vk.IC[7] = Pairing.G1Point(uint256(5313336802486092537438901334680852654341948074864474563856131635725125289862),uint256(6895730648181879739624520256545816791332633158412311015512951530240381279220));
        vk.IC[8] = Pairing.G1Point(uint256(325220639394468440817755153815787833042127075252735517240016452960715958332),uint256(15521970979122185281745088811323995334936841747787342330188118007605027421806));
        vk.IC[9] = Pairing.G1Point(uint256(9851257062151765878511858064522664435934534881710488921629933046234714694902),uint256(20527213325719972738819697141694419383464688432074956565401192376365403447739));
        vk.IC[10] = Pairing.G1Point(uint256(6836799250645905356849816621498985623199458139653688441741494730823735477304),uint256(1321302880162765015887751124290854209007720806847802758081135405178354451561));
        vk.IC[11] = Pairing.G1Point(uint256(3555656075953562060350704180066376628150824461725170384599134124568516418570),uint256(7869716627744182852556639689978068967388476768467890956684731218830990660448));
        vk.IC[12] = Pairing.G1Point(uint256(2248765146213931825605472897028134587122559955742168581035451962686261392118),uint256(3016419924349191631844403165861659052591170637516658211876305190732624316458));
        vk.IC[13] = Pairing.G1Point(uint256(7279298566349180928083536566045986948762472251917769281326407605108809167663),uint256(11028874832016041802026828300986834902661147352441088235574645203275802448269));
        vk.IC[14] = Pairing.G1Point(uint256(6945810422034610360011747141185356253444722567176271177372977316318816743817),uint256(15598633084173873329184510102618198344478556152351220476867706712949729343443));
        vk.IC[15] = Pairing.G1Point(uint256(6804575587506108555199712736571283060651128577402140648264000020341770187621),uint256(3691539627653857364811473268867162037919201046904828797522611826801971328539));
        vk.IC[16] = Pairing.G1Point(uint256(13275004917523119875214880838755844414048034863817936449193040910520967195106),uint256(2663606139826647720922582225963133862109084682375992431440334720017440141335));
        vk.IC[17] = Pairing.G1Point(uint256(6748253869586311853055209447590721537614006541655717618161971851805156401316),uint256(8995340947364582504692580818657704316212351152194837002370399285327157704374));
        vk.IC[18] = Pairing.G1Point(uint256(20272171401007813774455665481126643845693924571137387776435311390563454543510),uint256(14577783497625930457809873428910254009509412320447113356876628976514291302480));
        vk.IC[19] = Pairing.G1Point(uint256(7210052822369083985350713429241769147579126421159496778693500584422272950545),uint256(6783555145659935389830659054520488863804729519107473584554875325222267002978));
        vk.IC[20] = Pairing.G1Point(uint256(3325431092894637491019279793732152632702675854010084524061583460834525557124),uint256(19891206726515324792480827186973724739734062834474580327096891011490852391759));

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
