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
        vk.alfa1 = Pairing.G1Point(uint256(16716608736862693959661303933644817471710244266601917550156257676935602316813), uint256(16242377234191205746871378554065913865593434624385477171327585311455675718605));
        vk.beta2 = Pairing.G2Point([uint256(2127370144389273765927257799383361872460315404799585245329817230945578475989), uint256(16430432159556897010119267532689686876887747592276495023848535929538520193893)], [uint256(15878808364605656317688603688930452813378067966722568633465858104180699000875), uint256(3603246336259205681382480939511627516754361974867928051206388450909351466292)]);
        vk.gamma2 = Pairing.G2Point([uint256(21513898517799091131417198355752589280199338634334550021663264510051814206359), uint256(15809362335893938709891722086595312947182041143237290941424402504203030990774)], [uint256(15815694286374616080941430815784230366019393252192975675613519381941888831362), uint256(9126017565610852684907933761134419863276542457532213581212068756733753635061)]);
        vk.delta2 = Pairing.G2Point([uint256(4207963360474723250036867259919345071845320425611167972904992212664081452416), uint256(10519673732551017059360417559977583458326121196593116330278806619339284529732)], [uint256(8229743876530132068167026004960201517747913784582395443227696016090574698091), uint256(21512826315725253302015026057873739876147334202067804735100306877041582966932)]);
        vk.IC[0] = Pairing.G1Point(uint256(15451351573472294965560340190144579966145910003045610590120428677606276024070), uint256(10093983944601165227977323311232992924026301720743126359011338456795926320658));
        vk.IC[1] = Pairing.G1Point(uint256(5211951082611135247419339149788218761151131448652812249489052376576568674638), uint256(20704479886177403757242005671115334626932847423271613493023609499164944560227));
        vk.IC[2] = Pairing.G1Point(uint256(1318067349826215599804894022315117479522401535352444747756999444031751826618), uint256(13039427542238187052275357864965277289298200488260911129423322402674788200970));
        vk.IC[3] = Pairing.G1Point(uint256(9585883230227922820015085389363641591803648451589608471969201830330825320568), uint256(12273739626749448242750811825742441342886717400315647618783035398988749537997));
        vk.IC[4] = Pairing.G1Point(uint256(11872320308587783368504171234244200707140454935285945590642908830698738983444), uint256(10186886260144030201801368412236012170753427692373994215808919338182048876744));
        vk.IC[5] = Pairing.G1Point(uint256(17534212373434466044878508438370659670222088865334165106439278560670726221396), uint256(17863124048767897950375994652114628240698848865953810031053715555433885207088));
        vk.IC[6] = Pairing.G1Point(uint256(17965792829214382667318329242571746007973633461637447030413552683927083685216), uint256(17832407072194472645771621487277173249522201117447890458338516249292971588313));
        vk.IC[7] = Pairing.G1Point(uint256(3365108822548618652914887836913392909548562820391702260160202819228908573611), uint256(21084120430996583610722894835657965088342526342053020027981022780641389227175));
        vk.IC[8] = Pairing.G1Point(uint256(2408151883505675745158503045586192677724895247410127094607130998261829382108), uint256(4447161843769653968323548118928091705069757330996202788663713408552152151159));
        vk.IC[9] = Pairing.G1Point(uint256(10686489173640561226047509252795098741134388573769987351011028455269100141222), uint256(9738459229691304673332853941090257083627350349865229193337564581908883635824));
        vk.IC[10] = Pairing.G1Point(uint256(9145703827155974492901818490446638892049234109177449308239207904758876243996), uint256(2463989570612153904592403198361783708026713771167838320892578384511836267642));
        vk.IC[11] = Pairing.G1Point(uint256(2943604323095863856697035097524879743164772387215060284883158165824532448333), uint256(84982959334115625993335186183841533398705770146763371711561414549419914903));
        vk.IC[12] = Pairing.G1Point(uint256(18945208626151078070241765963565075389858166504597642868582279310303367019105), uint256(6154999268833250243387787979778268547240602769044036673239987371172274295796));
        vk.IC[13] = Pairing.G1Point(uint256(15864124820373446863753479993974142676599392126352022912347781055185680937666), uint256(3195129025477793614015574815286858708043736772102122668565030742429329385680));
        vk.IC[14] = Pairing.G1Point(uint256(13138525136982672192434568981313892292478839198533344095291564429429619350136), uint256(10399837868044543501134684156294163768582333232552149465621903915434458419589));
        vk.IC[15] = Pairing.G1Point(uint256(2806109138944814435902724912164991704468358191561698382059999358069389145936), uint256(15990700517223816653964481245292070344964739069589858444882070375857494236471));
        vk.IC[16] = Pairing.G1Point(uint256(2128385717816843471880910244803038257439037778641628886392714622061606684949), uint256(16921080775166587208902231581719595161472953681804244323124595368537007712953));
        vk.IC[17] = Pairing.G1Point(uint256(5499330855295316037423038350264317602906784295946799173401339383318376149719), uint256(1097539263877849767767087270532086789578822102417534551486738797251477926585));
        vk.IC[18] = Pairing.G1Point(uint256(21288728838769824814037262837401787748218965071814137036237993607974877727908), uint256(19868293731175518196101123688010076844069751308552875927332083525392147536826));
        vk.IC[19] = Pairing.G1Point(uint256(7760057571936871414102167423969978079599385639765871190056252804926844200367), uint256(11094518937440699787447935072388899736445561579379867476916768678090895005488));
        vk.IC[20] = Pairing.G1Point(uint256(18704263466073093950248797334260321157083326741105115899281643670210858881499), uint256(12294166680436226188290858312885529601084320516960970392665038466788334298712));

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
