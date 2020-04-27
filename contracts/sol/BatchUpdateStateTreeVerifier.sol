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
        vk.alfa1 = Pairing.G1Point(uint256(12315836352967957211510078730489691600090882658393699951298132818485924888287), uint256(12333456220737667024534302122681735760684783056494970238452084583564052289970));
        vk.beta2 = Pairing.G2Point([uint256(16237044620032970801806939650829728000204755136395912662881666259249097200170), uint256(12544977676503509508673799063040807240093900559813951586842811096845885299039)], [uint256(5845047782651371655490316534115396606209353799417359659041442069102971931511), uint256(3803822983343449646465149023415421617732388485757821718997052202655935787463)]);
        vk.gamma2 = Pairing.G2Point([uint256(15917378969064354000920311692744652229583986941907577321792800080807517652979), uint256(1596025830503063801491395998996192178185502100531744646731363696515465231507)], [uint256(10999861757044300923415712849693887836227181877261068554234069919255504235504), uint256(9569306728029540250044971525531197300974664788888421104664941561605900673518)]);
        vk.delta2 = Pairing.G2Point([uint256(17676756641689495848927951435911607817421987261505882290632037653127346952023), uint256(18668800142277554037421099115820018852435902661547273481199464085944357358210)], [uint256(16729049083375628783614014916626994794394298041791684530078354199461747837766), uint256(21664723846926316734479713637760721437493834024934831629167881519348751281615)]);
        vk.IC[0] = Pairing.G1Point(uint256(764041459816214567700777248993760357023048140879554375776702560605486072184), uint256(9607944364548719293126908576641929634910314239909570767342571213193481216777));
        vk.IC[1] = Pairing.G1Point(uint256(11841246933857547174638795359933011708086641593247257625064454871527616487733), uint256(5564206730685017302927936823453598330203430190427139713629302922874556815274));
        vk.IC[2] = Pairing.G1Point(uint256(9474716058005141086547387832733569699137540173269233046294718943253667854304), uint256(19930045772683223290356026921597648756439769160881356196835609812404603673962));
        vk.IC[3] = Pairing.G1Point(uint256(6188824237859703159483568287205706990791052090649198542817254458019986504055), uint256(18563405944217489332873533290055163334598215503719444895109205014349279023242));
        vk.IC[4] = Pairing.G1Point(uint256(17546925260700741236834977415103632674774390871125759849410188975401228918030), uint256(6987180920692410612545123270507875688877940044237728450626396111636693765403));
        vk.IC[5] = Pairing.G1Point(uint256(20744260418210692842309002189256136946223815540741244393701404695520909563791), uint256(10666705562130691172526478554850412019813896853235168828551085263483807398781));
        vk.IC[6] = Pairing.G1Point(uint256(19575978034779553102177435502610976759230585948003427225407898339122628151285), uint256(6958904955917909345280339811385354714346237887919882539280315928093832404314));
        vk.IC[7] = Pairing.G1Point(uint256(10479298117534173566973546789915890911198178410289901563093381507091315508060), uint256(6164313753860263827496083128186650987864121766866203705657696005877906607581));
        vk.IC[8] = Pairing.G1Point(uint256(10012045120213597373655504406193982367775340478709030789612395895981527074167), uint256(18041873843212623673543899531187653688850640155559785420305612655456000422964));
        vk.IC[9] = Pairing.G1Point(uint256(13979696063426365452364790922776692996617248018493629321335758575812264032728), uint256(6248768813549279116620612784511182699161982296626768241026674463124665235516));
        vk.IC[10] = Pairing.G1Point(uint256(797541865646618797486580948901115884813595433116298629220039112384728663390), uint256(9710057605447330500636545685178956919996922810686443546836122501269226942583));
        vk.IC[11] = Pairing.G1Point(uint256(18123979918165576139446403888609224160870919706561467441643038631982857413160), uint256(4339568621930777457919974934507565186294799033965429172883229914176959446796));
        vk.IC[12] = Pairing.G1Point(uint256(6280799598684281591430616630804533066116851462042934147568544695367139641583), uint256(8634428535931474738746947585346917704171048992411892176412966185557339464367));
        vk.IC[13] = Pairing.G1Point(uint256(4359584475884651352330203685770603507516275636701620644069482659616176409819), uint256(13993548067870113561901154146253161489201782360395005362909889785078203068975));
        vk.IC[14] = Pairing.G1Point(uint256(16278350881216293981528612238646051740364797650140969465719055991942978047218), uint256(14318335552848312076356137931699932933261883869385150466989023225442410001246));
        vk.IC[15] = Pairing.G1Point(uint256(20509507505666200656508400818879643579277255380473894070708643518217936916866), uint256(566566933442551987401397386965003912598486740477812365841446620656471821518));
        vk.IC[16] = Pairing.G1Point(uint256(4733951612487512134106016944135075873907511005528116403733722414970660823265), uint256(1217336313996093383853518060870632229415779446609535878906218378798580180322));
        vk.IC[17] = Pairing.G1Point(uint256(18404549376356648267119970784978094773225822220205590342269915982638283431466), uint256(6345953246418258166868451233704249345905522105417649124613070580402211502711));
        vk.IC[18] = Pairing.G1Point(uint256(19740841464601271892356978270629993937835848710942441001682290515464235864388), uint256(8707194329170204321754235252418958944676360527172233384031844975592425004077));
        vk.IC[19] = Pairing.G1Point(uint256(12100038458984669923868787066735437338169368728423529685607105286617625408784), uint256(1096147010915682645866225101308636855918961760392717557813914599453611489916));
        vk.IC[20] = Pairing.G1Point(uint256(12827414657203366010597810056537413194861552575844232326410419849988871207606), uint256(13829526399705785387671498328531546513649429674039338273395897485797954730162));

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
