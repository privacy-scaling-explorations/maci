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
        vk.alfa1 = Pairing.G1Point(uint256(6860995018744643102673922865394101502340066241179806103040409303389020627916), uint256(19465727877545462063659157693843729554910769839029776894587735229211342047776));
        vk.beta2 = Pairing.G2Point([uint256(15709908402795092995223104192037821161327423196979863809005448297396585405656), uint256(15344664687850813504172595823362285807350868256957432760139367867726524018965)], [uint256(9796250388670650606386716471197630671995686362667249869934162262317053835435), uint256(10633265076472981084072030061776713550905378969754910285741582500236970698486)]);
        vk.gamma2 = Pairing.G2Point([uint256(7944127669861691687125753894821956236005898386935417121087657426164523148697), uint256(14543220328422151448114392112102120603436771471931373341244119491919692410998)], [uint256(15343211551145728317063050504480477587826424574293860050475138531661207558145), uint256(8628603547249378338999888971914692471562778651975447082642091142878639708329)]);
        vk.delta2 = Pairing.G2Point([uint256(4310180156826325985752134550554257526758440912510979357481351469682783814772), uint256(7448717709781162475463735732937617151361051069043091564881711578800176757372)], [uint256(6815272101068186530259949532090820842258975615268204820622967612146571195032), uint256(1913501525559901238823331926378283869558024521726064785416497491597526769507)]);
        vk.IC[0] = Pairing.G1Point(uint256(21212218295558747779354524272595168381827699558532955030452185061949353812425), uint256(15245619550197187530796485804947635333681190146508688481040426745800272535105));
        vk.IC[1] = Pairing.G1Point(uint256(18821446551601602858199628634781181083360527258876113874142194757084791707801), uint256(11622506015371692873518308155152125702000275007292222353548893600836316851276));
        vk.IC[2] = Pairing.G1Point(uint256(11138560217529532452171773339904482726835990798359532616303369819018323650032), uint256(2161318879642416684845349308940599228703221561790016917342843856757129618596));
        vk.IC[3] = Pairing.G1Point(uint256(16410527087479618996311263395074343943237545553002606938095967123363464227974), uint256(16498507813457066183737226295520461893906167167166285686287918948583688751310));
        vk.IC[4] = Pairing.G1Point(uint256(1042501801658404747674484459238298036666846778399823372103308817145281343179), uint256(11125381430825507770037164808067816851100035572350097535413834795210910548571));
        vk.IC[5] = Pairing.G1Point(uint256(1500473311854325651514137724833574236370150652040428751161994394804390237859), uint256(12267452076892938547875294820413455487966922079924262663413521734719471698812));
        vk.IC[6] = Pairing.G1Point(uint256(13118172637548965367637401205255430823297425106588196415345630929012800566617), uint256(15560752442915801841358796935921755509636977343761089659667826760084921131052));
        vk.IC[7] = Pairing.G1Point(uint256(5654745807773467743906985910171230717950260117962570770222187350268605933949), uint256(16133103777613884649334959571153353000852561434393325300285406585966767350880));
        vk.IC[8] = Pairing.G1Point(uint256(13446589540705433002111624754963019497056499566724116291207606017128900184932), uint256(7793916636713164804282721631132029398486864045992800912049519663107327603176));
        vk.IC[9] = Pairing.G1Point(uint256(12230784273355335600091361802078323568655198133396360658925873938671382212767), uint256(20451670152092642966459189860290315365492782380637798744604252581780336818832));
        vk.IC[10] = Pairing.G1Point(uint256(9534438850111543041317650324520674962373273178892616912054457870061536328627), uint256(12695157168677656142356321225271552285038045843867114899974793136910353793837));
        vk.IC[11] = Pairing.G1Point(uint256(1278518834036672499325965154646363380105248732710399776674775349199288328725), uint256(9404852678302437578034769903252157217002082223961984807348225949780426983887));
        vk.IC[12] = Pairing.G1Point(uint256(20318603336009075984418783644171799798836256363098412842439294501208216087112), uint256(9892685543446064528926243240346394726371320661284027371138358853977299473525));
        vk.IC[13] = Pairing.G1Point(uint256(12040206048557931668606721885004165072512040046259104289447199213015832948261), uint256(18454685806873472997701937784362221657689564713616204988698632503985934272983));
        vk.IC[14] = Pairing.G1Point(uint256(17559145577298698283760296656977921555348994043380813818580499905859173335148), uint256(988429703957727199497611006784347084718226164334808745167018600997741631223));
        vk.IC[15] = Pairing.G1Point(uint256(4803245576349986836801326340746761175642364640733342419595500788043069237422), uint256(11418719560244587996346629907463942951354578002320137135042563590525176224693));
        vk.IC[16] = Pairing.G1Point(uint256(16881660880579208380786596554676853696960939142551118746113417108019855664921), uint256(5916115209595580106140715131824249266314441333318499807645374967910750678521));
        vk.IC[17] = Pairing.G1Point(uint256(19673332161071239425212335598471386717628570426780650549002554648390013605171), uint256(11850911069497471991270712485973166079563261825207399295951582405936883739729));
        vk.IC[18] = Pairing.G1Point(uint256(19400674471885616522190885755179377671962320394021333376261235144332852682679), uint256(20566379678616129435600880755164839702382106956155323254612178168584197000119));
        vk.IC[19] = Pairing.G1Point(uint256(12556888435682873693879833376170489395224764458475709642795073398192150634049), uint256(7792688235035029252033801534697719182637398482157038086724942552372189472613));
        vk.IC[20] = Pairing.G1Point(uint256(17276017271544514267151369843802252304175275289395889234110785885757293906860), uint256(9201081666829307854014363495931643143455967158010902484575146408419928862533));

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
