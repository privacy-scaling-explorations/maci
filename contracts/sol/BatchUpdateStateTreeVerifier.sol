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
        vk.alfa1 = Pairing.G1Point(uint256(20458051560877048291969281152570633326467100781778339812565540981628329892600), uint256(9380260339161604231908556902338079425569319514493138287621021800785060818382));
        vk.beta2 = Pairing.G2Point([uint256(10802765598975323746387049026958059635399986449344826631159966009921555938340), uint256(11390708880814116697805241005606663377731554090935914956954310201604631751638)], [uint256(5270124374410770621725318526223033856232291109825754210624875632879519703552), uint256(10068724067316914682772300749249027798119684148234448505766055805182360341701)]);
        vk.gamma2 = Pairing.G2Point([uint256(21868442538769087676630855852536548568176028166651987551617183588800399936655), uint256(24276685884424077904952615733832643492697929967944324982846732072134194813)], [uint256(13534593912998412755943179997417247328212881788021354101372751911803014489989), uint256(20499322881620017974292043531745263205356680383621452390753770940670393585362)]);
        vk.delta2 = Pairing.G2Point([uint256(6681269673461164962732190678087557252948810452459871326140751341401027164782), uint256(20879211051606002547944057580964987613561289840416586305339516340863930294996)], [uint256(16482152490814587075115760711435840528578006242933646000410676286389413950856), uint256(11526869171940858813310279174234104618124648258235593493079696441724714311877)]);
        vk.IC[0] = Pairing.G1Point(uint256(2587884951613907207273118461014494169357673156040439940817450282898483267466), uint256(19777830698802464280750018819742250935000582568637219685002492316451951028982));
        vk.IC[1] = Pairing.G1Point(uint256(2094923211250869760637964814690068883744745471178018056716561314338200251074), uint256(8192072316526872391526530665578606037619705709263247848966141666925761208535));
        vk.IC[2] = Pairing.G1Point(uint256(2749664706067267007852045839882984535316931939770074244951055507400202656078), uint256(17098654031473510591402563455343187658776140339332649180832091110492661325448));
        vk.IC[3] = Pairing.G1Point(uint256(12855549374157167033721716732712470398934227917704747571322748892920268761197), uint256(12795079530657311808614429922275881255653009018966209251439721865310363035817));
        vk.IC[4] = Pairing.G1Point(uint256(3221524152419540769019468443731334874983928607431659665816517650312729836145), uint256(16895590062066803975290177885302884539671184727566139797128361872947899604665));
        vk.IC[5] = Pairing.G1Point(uint256(20414202185000625411509932041228194212060027357834928223766405404837584634928), uint256(14540029337821181159353233415404835640820618579648921792831126630473101186824));
        vk.IC[6] = Pairing.G1Point(uint256(4964095435670764903796445467026403730070695379415062933102041488913207275861), uint256(2449161013952440191392116428768024877834422201872670109228262262049695105048));
        vk.IC[7] = Pairing.G1Point(uint256(11989536623936553012959053930151465551843666946116521387181100020945029256139), uint256(3705814491571642977858199277932813649316984673163615719085493813037852445002));
        vk.IC[8] = Pairing.G1Point(uint256(2554611702621537218046387572021130712602518910848892154904851244663537913758), uint256(20871167292183463793049519903527918726117603852033267981226618850483516065224));
        vk.IC[9] = Pairing.G1Point(uint256(13855715995094789058723082594497842607130033957053901957280215086015562797679), uint256(20343803161194261053356848570299778762935430234659407831185870481360262214388));
        vk.IC[10] = Pairing.G1Point(uint256(19635604638300239325670248708994829393283575198329419529202372080536016016752), uint256(16133147090531577058700014068401788336159899517196369152339918101421791731242));
        vk.IC[11] = Pairing.G1Point(uint256(5993461270891507544314675613968428504579172296102352148946294744743609395533), uint256(13604782986205268512742295299597666175195661688286686366463009291711015544493));
        vk.IC[12] = Pairing.G1Point(uint256(18118963355629792695196045980975566140307119551411071372962754578059955200194), uint256(10707688060268950123917445205496563250848802028923094290001329776619561778930));
        vk.IC[13] = Pairing.G1Point(uint256(2037073388248715136114125967107276736732861984211539795042235676439588745487), uint256(3890845178471439754161401074655026576523952469662181526305021965999358272967));
        vk.IC[14] = Pairing.G1Point(uint256(1106890945831936305422846163670662959403660411012666983240716027650103188879), uint256(16535533723358363736689429875853164555490011044978016257268558115648046932113));
        vk.IC[15] = Pairing.G1Point(uint256(11711254303503630355929487551241426769760789688231168009081463342584837883700), uint256(18643185287209621478705690298450601957065378120145704287161034553899104617781));
        vk.IC[16] = Pairing.G1Point(uint256(19240796476724722649675308498067813636997032738679271765185522465115923719709), uint256(9256398748548469032225108034809976117062460422694155005185342565022723682732));
        vk.IC[17] = Pairing.G1Point(uint256(14199157710764601371757454291064322423103170230892419739424624273298687707593), uint256(17784052572523365804104261278484153476876784294626172805735370808989749359108));
        vk.IC[18] = Pairing.G1Point(uint256(13207768941642028825218731909194763022780985025194835455066906861020818895152), uint256(18377580419126928438093339897681717233957896615839990787637091847495846522912));
        vk.IC[19] = Pairing.G1Point(uint256(9008797563670785044467409042331488118928494793012415395497841105263317478885), uint256(7321182597496291723394304466858038905191094929031654210516490978144703585551));
        vk.IC[20] = Pairing.G1Point(uint256(10322627556526059607271689074367352095068061161047778405566727900256041844009), uint256(10845986714726479075011956547326862953636207464328925247918116863223243950938));

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
