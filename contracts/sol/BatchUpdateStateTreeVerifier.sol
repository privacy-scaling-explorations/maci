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
        vk.alpha1 = Pairing.G1Point(uint256(9976305239002436138171851795814711943935939207831817584681744633434910234321),uint256(18681277790263736449030637748287921558819036686082130900186088162570419350992));
        vk.beta2 = Pairing.G2Point([uint256(6172358453539424550318766594929473338937239355339728982755559104553110325453),uint256(6534959472169165993383739793804533670942826673929337824331067453137717239264)], [uint256(1357945654924306550840047330430955070010768537081932998786542386363936812547),uint256(12960907516811357123788010152867257007291102114995113697699987562030032056433)]);
        vk.gamma2 = Pairing.G2Point([uint256(6290991024219259041278637283097745406110121457394116376430150608403040078623),uint256(5021000866263210574587840496673121010467387975180223653009538198713074705827)], [uint256(3487824452908817355339150955086876574017461854296472904614712555221358568080),uint256(6326688943549353158834205377487105135083064295245283863533043986077765598278)]);
        vk.delta2 = Pairing.G2Point([uint256(13645654101630401467009033171410878089244502627800959290135267697025198395542),uint256(14164117295798395846771911139696846857162222520960275131691708907753912405987)], [uint256(963270346615257122851454121640169728877105634008720753765247909467478775227),uint256(2304045829254713052088551085966286739531281455978144747509652857496218681693)]);
        vk.IC[0] = Pairing.G1Point(uint256(20461461764406654026930363685822598216515693042126679855400120855077581974213),uint256(8114289557303239378052546947514988777239860982887683722494353371354718428795));
        vk.IC[1] = Pairing.G1Point(uint256(11778356128310562225506956490163375418299596757291560842895409831046374035510),uint256(12956010121975327291092117231362091246084998168181211137836764445702136849406));
        vk.IC[2] = Pairing.G1Point(uint256(21365896868334131243402401563591525011039884272103300208849476483669646104520),uint256(1271370134424127898711414494548965098507278534955958311492865203782085076992));
        vk.IC[3] = Pairing.G1Point(uint256(5743624020268165537132841132770071313107549695417786714321650891747578337048),uint256(2005068762197545866708137085841032548273224581379102706353471875338883618102));
        vk.IC[4] = Pairing.G1Point(uint256(21698476641786819107222402104952628389550080951399896387118511228566398136391),uint256(21831160427328194463218310201021607243115722699891990082831151030610291583995));
        vk.IC[5] = Pairing.G1Point(uint256(4306138726384982592124943234408764742639063098052999891607733075063426910651),uint256(17583698730958313125311043544941391813497549936209036916438524069663688367758));
        vk.IC[6] = Pairing.G1Point(uint256(19411897344207571776347732532992429055773524902921863323310644255535111288257),uint256(14219749777675294646909726839417128530754895980972541850759733316408752013327));
        vk.IC[7] = Pairing.G1Point(uint256(15299328373301499881075672526063840593238737244484701556478279545981700259249),uint256(18894213876825110310497204079884917307934933864319402823799836456356266123487));
        vk.IC[8] = Pairing.G1Point(uint256(7015067898957324141229862126413000705262124407681183323835462797727380093048),uint256(20068901247789982319643674566635973332206240988464038714215862858951815570146));
        vk.IC[9] = Pairing.G1Point(uint256(15863020548566818652067581902019854455662250425231389475396710335112348831792),uint256(20452399464450610453227058376223035385586319728265562257271547958109510891642));
        vk.IC[10] = Pairing.G1Point(uint256(15614983622479761884252438341778014497898147583357092722715724474093035816414),uint256(8180120784881285515428912619078012485227633680384099606889571791688732404497));
        vk.IC[11] = Pairing.G1Point(uint256(6618735705564265276348880770981711584996034692488621812510820716398139688979),uint256(3344404569026323680487784631966764424451258741514690447783120277040511617536));
        vk.IC[12] = Pairing.G1Point(uint256(5605565173170798859649685388020817442498102054896675525246361478984107125238),uint256(16869015632057410446274722941933294159192863678512356391806892839769556366133));
        vk.IC[13] = Pairing.G1Point(uint256(14021043600724619392184624065727063546720569799002318752147536975919825540569),uint256(14899141742976289550826484555225948335756700918148166960289975047597382341779));
        vk.IC[14] = Pairing.G1Point(uint256(4894972502209857414688542712022836104563774727189765892294594035034300298756),uint256(8621000344101648700122788442408418481503488344681937706505619622662089170203));
        vk.IC[15] = Pairing.G1Point(uint256(20727023201206270726919417850511915707484288727415778558895713028550843556212),uint256(12744811130945593323912818104940740849821298174358266022922364733330031974781));
        vk.IC[16] = Pairing.G1Point(uint256(13041685462345983561782749720019228742325722173026540586357719849200835297667),uint256(1006038503205011808604203329002057570442208099892453382293652276589511908065));
        vk.IC[17] = Pairing.G1Point(uint256(4046833081942446677595832231468371605255090227027232855842288523044639762224),uint256(1540491693408357553296298240311353674991024984914234986350652889228176652017));
        vk.IC[18] = Pairing.G1Point(uint256(12680569496164470163617335024229491420131201715810450569207573798333510772312),uint256(5621383288822466871854074981784182726073680970386021167852098051023589378863));
        vk.IC[19] = Pairing.G1Point(uint256(21458027783599373732311286284559544824256910488932917924467387948254419016367),uint256(4572376514927045149509026179345508272943495846474706979159123927232232548196));
        vk.IC[20] = Pairing.G1Point(uint256(21083228465599727520128551268415081647525136604835809936757141616607477462250),uint256(18340568609154193811957548774721472902025248982850486731750240242159507924118));

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
