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
        vk.alfa1 = Pairing.G1Point(uint256(18742202967927624544954649721086381135777867715426019373709093687940634111473), uint256(1629691675004146750486969354766661126203356448671046401057413474346945440867));
        vk.beta2 = Pairing.G2Point([uint256(583957145304069060797609800770881901259593371039432821330482161666120148154), uint256(1287212523504052344711601968680787674586654508622874544289559123760783873894)], [uint256(5799960875016360383809578358999761673420740249111131822847791878596871276146), uint256(11870139640619459387020627187317467563816159121773188538908280067051845106936)]);
        vk.gamma2 = Pairing.G2Point([uint256(16513040071259436064289391649941403773523862867515749604434794935867585970438), uint256(21791532770553564401161205722229609375851095793544694084993985360332274028173)], [uint256(16329169088466189792382955028240543421782584403765446632788930447467026561891), uint256(14180164528381594413849116427587480684655266063116088020983028795107814879650)]);
        vk.delta2 = Pairing.G2Point([uint256(4324213750744372068024774561843023932156428600082335662392442074727060752060), uint256(13348230561063846636413029781966146551345841139128249935882683722358637472341)], [uint256(533339404757877617712318705566665417264588462742201838266287917163194174713), uint256(2020500226546046444125265510203705336792119929475484737694180343665907708890)]);
        vk.IC[0] = Pairing.G1Point(uint256(14485807295748514943908199099458956022541055306354653921953212608385902856381), uint256(845368379646087085680251546327339473378660653420210819593242167417781939199));
        vk.IC[1] = Pairing.G1Point(uint256(7874160269675866861999236755938890590340587526445519879779988346650694542055), uint256(21674326532888706895434800390185521433943660317598680124533844732331173748693));
        vk.IC[2] = Pairing.G1Point(uint256(15490039380278855984805019864164400553107850592385891174523919763008542033094), uint256(18446699487364011382582767015015518122695882138037493808647108439145059060068));
        vk.IC[3] = Pairing.G1Point(uint256(16213345068697450852220227438238246789710619398267324881083633944932393483663), uint256(10208527981862667632809442202052379695436366307482818998398926364434639170999));
        vk.IC[4] = Pairing.G1Point(uint256(16274642710169280741311996944459121694263917228066176480072686955331979693189), uint256(5413659672295888909583263714016249080900293654248572892221203224042310289581));
        vk.IC[5] = Pairing.G1Point(uint256(10753605588502665060490033804031701513536088869675375471648813681532784575902), uint256(16051917977807908637824311467451697605851363329936593059395379902190770215265));
        vk.IC[6] = Pairing.G1Point(uint256(9024471287551381699403661593970689967969935479915039902771888994702434450826), uint256(13171377095314285564056302104294753155871859933333984452629091541854612968278));
        vk.IC[7] = Pairing.G1Point(uint256(15696040768202029094797163495909851846198619912836432255556827878629901124041), uint256(8393605173137948746927754536912225505128918055834510705454811634708648678052));
        vk.IC[8] = Pairing.G1Point(uint256(20338262903838626668137209406139862073934225436763727375486185233027707374461), uint256(15331343894090054644419851412143687861670962570717709903180326311069589725777));
        vk.IC[9] = Pairing.G1Point(uint256(1814453270291172552928066095882821524954809589093055400436787081381059858211), uint256(6191257524821477079679229652936156985205829475979670239662641144562065791956));
        vk.IC[10] = Pairing.G1Point(uint256(19068427344168151186326974305438049995859341975983170541271583298819281643815), uint256(19196755515920356787661665141477031461077722009523047210515468796586997093123));
        vk.IC[11] = Pairing.G1Point(uint256(11062728266859736730765871714374200816753625280584694231985224966548964645300), uint256(11822467330717875685566001245123512288211060074805676699683662174108144904942));
        vk.IC[12] = Pairing.G1Point(uint256(16333906633452320886844314611504941502569796975421100548500176286872104535158), uint256(712464232021338136328531954972982246491009213124227128735057729817343095729));
        vk.IC[13] = Pairing.G1Point(uint256(5620178389635281320657872545552505810032192485098419098215437451861825895312), uint256(16237207800823557692578292746860749387572067980539303243324448568028569347514));
        vk.IC[14] = Pairing.G1Point(uint256(2278471765542634934582480255680748780822683005027153124087924664471853240228), uint256(11654852953386151650871336623125910335500115931801066814680171315164540041112));
        vk.IC[15] = Pairing.G1Point(uint256(632008605588126463685804238669627485408419596042031481210627966860027182034), uint256(7817868333504375644496652304426525082097328605571966017283150331161681433668));
        vk.IC[16] = Pairing.G1Point(uint256(11943043143728282912160506080309341845638402079026736589534927420103122944515), uint256(12669712190123175626623754431772481159175906666092784351260589942508621178853));
        vk.IC[17] = Pairing.G1Point(uint256(19084020945634312107735938555281741145094443278504432802615864137248065833271), uint256(7462196475019354104113783958269504104902932463142447616631995048944219960853));
        vk.IC[18] = Pairing.G1Point(uint256(19763038542082127172866970556322121185706924484474770637183030494516959790546), uint256(13464818277497926493543707758977425548543930084183951477526657381353680905285));
        vk.IC[19] = Pairing.G1Point(uint256(2414799810118881848790191200685820966089705334610413728091916285872844382725), uint256(14736025754310734023405678160630399279813765115756916001185540334617060246661));

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
