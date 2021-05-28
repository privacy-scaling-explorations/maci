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

contract BatchUpdateStateTreeVerifier32 {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[25] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(762983529065088482285921602366882769064650297819544502281694168799906785630),uint256(17441545250663775196355276079223465685541268322252238901425500034531403989352));
        vk.beta2 = Pairing.G2Point([uint256(18354901413389182343652231927291660122863385692410511646704489412532461434846),uint256(21752142520342440598409184971701897166878193957690193154455802041644255914460)], [uint256(10105335738274682062009816694053877119887557037897670432599092422719390445885),uint256(9460434129532687944736674754001944117698999013658937205203170941168861868532)]);
        vk.gamma2 = Pairing.G2Point([uint256(18900135801707271805846305929794850524122025596395493933068246831513040033812),uint256(12127271444858854920421723693916224068905883599689186460458285754109196580697)], [uint256(15879925683781015137565985432332634439940875003381917247054231194188858801803),uint256(14630557130317994790104833815025157600081142676743015575703714096234023653492)]);
        vk.delta2 = Pairing.G2Point([uint256(2484499379311862282089453078638110367641622142107634395651148156183170741719),uint256(8423881627210264567042359909576905269290841040463540060907817103020839159167)], [uint256(15607343826520215583391130046956403720917447089206700632130938348116784313613),uint256(6967471180269039972587306333414948996970928832248525404276706697328921464977)]);
        vk.IC[0] = Pairing.G1Point(uint256(8411256852845892730714856313175327106025238329587155043960538529931919915166),uint256(7169454856890365010592186569548985348806198423304095716912238197665278085283));
        vk.IC[1] = Pairing.G1Point(uint256(5260261017680436146407841918720278564337378711580317070040962073828403727453),uint256(8440779706151520260041485630917368624157670608438182139744819708696854427304));
        vk.IC[2] = Pairing.G1Point(uint256(7450702831877260192365156344607085839352099910174153075855579619910643161876),uint256(19460097768562563301925631188196737340844543930318917365732587597356177373294));
        vk.IC[3] = Pairing.G1Point(uint256(15239587904056431140294638064093945896754449147184213760554710056832525480046),uint256(6818456824285386522140547164959581371731502059783979635483960380388291490047));
        vk.IC[4] = Pairing.G1Point(uint256(1709292959476720141946729209982221807039668109181685112342857511641042787677),uint256(16508177039135289903061173942411631326785975536747297086852357515781996823818));
        vk.IC[5] = Pairing.G1Point(uint256(12261466350245570851624437797175499260723208226129537685883354101885860926184),uint256(5209157408377417157827448383634552568949441321813357508810032329902579615962));
        vk.IC[6] = Pairing.G1Point(uint256(10111939149760500985086072878841635156913723662829088848316623357495764983573),uint256(43040474071182761916757384705110123806624906445294574698713317350980930288));
        vk.IC[7] = Pairing.G1Point(uint256(891823271114359593910258594684745432160610276406749227600709710740688408116),uint256(7847917133384668523981785782071412159493413896871908501597068121355649591446));
        vk.IC[8] = Pairing.G1Point(uint256(8520957995237632917009453607908777508799135788134059982747053116599746914599),uint256(7519495086160528247869072232990891383216251827571317106397982133689927305963));
        vk.IC[9] = Pairing.G1Point(uint256(12638708739410284933898228848093407684932804751071456332151945131470628358788),uint256(9624231949127904706182766634107518537749662286602089553503728364716082540929));
        vk.IC[10] = Pairing.G1Point(uint256(3664763392077419734272190442299523667220364605645486468481528235295556498479),uint256(6080234250904324303257272695658222514504322587226306014814049126394148423964));
        vk.IC[11] = Pairing.G1Point(uint256(18198441847216649358581576789837775122489402617503663693821006492882992199130),uint256(9420687557340582276171294554626460575062613961562713539848261251272880958354));
        vk.IC[12] = Pairing.G1Point(uint256(20386630582642567829852509822445668883495622998293848827535447499300010035011),uint256(551658582090094110765427821511121301438862712589506829205750197816374564624));
        vk.IC[13] = Pairing.G1Point(uint256(21434688329094675754941186197099631914178781039540501253386528193148097149547),uint256(2167010884585986595093828972604684538155114229246311542094012777526207791081));
        vk.IC[14] = Pairing.G1Point(uint256(12134032833846355414507332107785572580269222771404753753172468330251228480405),uint256(8948883367984316766646415647590527809449694505449544936370452645155447063840));
        vk.IC[15] = Pairing.G1Point(uint256(4920301035112940278784752441287918338102858090244873546453286753252089666024),uint256(20314579183063447016604199858568924523837891190623527170915635872937898819649));
        vk.IC[16] = Pairing.G1Point(uint256(21259289055918830613724970262152386915520498166816585480833295329041865677317),uint256(20188116459469577981153349728548361249850664554719843294700549361142923731892));
        vk.IC[17] = Pairing.G1Point(uint256(20986621993966205162365021300120405800512264240005320392612426307316821758466),uint256(19594832518836860209938496856926762332020196510945828762078679743287254440290));
        vk.IC[18] = Pairing.G1Point(uint256(20449012740473321545027260935179004054363367756286537375488630699619083554881),uint256(17238519369725954530181621438717964268165368258923814601697796060536128373765));
        vk.IC[19] = Pairing.G1Point(uint256(10683545625485867989950833161261471870405064636920489940374038254676547092350),uint256(224956906332583468443657453626263629179549426534007522516681180446333909693));
        vk.IC[20] = Pairing.G1Point(uint256(20787356321408305890251363223402350349057159035333479564683408304771346339829),uint256(13098992196154712021531253334138318657180329232708099598537529432890182098325));
        vk.IC[21] = Pairing.G1Point(uint256(3660481567410175236304184723677972829649203320820508858060630122428119053943),uint256(19658214957479999984337871506696377084846945447069134745520580543947911825374));
        vk.IC[22] = Pairing.G1Point(uint256(20366106759428650121049227419065655521919742780615088622215182451090850497444),uint256(2094307373544588380242317412110430683959889855388934348222298360371999630721));
        vk.IC[23] = Pairing.G1Point(uint256(16737291327507953174689319453044459567220540633489791454702140420747343490474),uint256(16157311553050223119242396264960060438739207692835769549267232299670056393927));
        vk.IC[24] = Pairing.G1Point(uint256(911794003299619547184758407418106783117060650193115636350632834537864959771),uint256(13308245563194907935293197635201064226835807521914720473675520152059746923680));

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
        for (uint256 i = 0; i < 24; i++) {
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
