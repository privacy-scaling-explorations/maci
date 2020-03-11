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
        vk.alfa1 = Pairing.G1Point(uint256(17578013414138514700501558651175780599894485723476183792376766061311152446100), uint256(17698498926424271874383563308983763926108910352175491450193344593861081595286));
        vk.beta2 = Pairing.G2Point([uint256(1756059516878092899338212052824312444675248459879915578650274491043066874967), uint256(8808067159306224453014498297793974537265495688298638410706997583325361013265)], [uint256(1259730771899263983471972541161231284482923041332080849521970423848781363266), uint256(19355604263264629643915351353399724960054827751566143988419088608140810973965)]);
        vk.gamma2 = Pairing.G2Point([uint256(18412767647102285130696247271564160980825249883623403170404230035330766646066), uint256(10429551492002868703642454407830947762708284024862696539860402399138104206647)], [uint256(5372814364558573587374504564995114269008794792800671321077171202075667488920), uint256(13458230737497678250795129383267018942806204364164788656473474611622259557451)]);
        vk.delta2 = Pairing.G2Point([uint256(2706566267736211152904544406230244232664710371793194091555694255634687422679), uint256(7001199012414289747130317863220186995136357694751944285975029653390218278569)], [uint256(3163098493745955221303777881307755185237527601613037983298396216999606191122), uint256(6765235367505340292723282465821892563310651659849821500605188445274670728556)]);
        vk.IC[0] = Pairing.G1Point(uint256(7069667974556403587989044537675145245694311164334728143161202598427046594182), uint256(6280260819393132249075372888538982565491189210379403413614131785501036461086));
        vk.IC[1] = Pairing.G1Point(uint256(3097491254836336887106261727550141720290600562813952131439402493756153020337), uint256(14005680413621889390390979812291632723179186309033799508405703774567934929158));
        vk.IC[2] = Pairing.G1Point(uint256(12591818792917266083381870869303792198224467579738728138511139259654221469868), uint256(17342578763201745630332254963306249109647412975973358025703510702642108105761));
        vk.IC[3] = Pairing.G1Point(uint256(2167805726162826985908525670810616405316689549767345492507584676680223040169), uint256(1137517152777682988552419178126250482159135645676090529720087849181285802054));
        vk.IC[4] = Pairing.G1Point(uint256(16686307785925794452873199684009240270383645743133474116101792388188273570045), uint256(4087741183032290393912318349112327171276817827993130213548472415629917252933));
        vk.IC[5] = Pairing.G1Point(uint256(4383836163128935871385551254543645248825288265646593013774754064161458566356), uint256(19311480924840924946916001581568520132118140098655535549631545936608144819841));
        vk.IC[6] = Pairing.G1Point(uint256(18559981555453484891227117969403714068954041276201547806120726405223626892528), uint256(17570354503176657295233654649556544633106266906095840425821165670342688579273));
        vk.IC[7] = Pairing.G1Point(uint256(11250517276424008233624373383418187405302454331327676762866854150908685490045), uint256(12676823219706649640837710213047257743103166159925842820309663963723623356397));
        vk.IC[8] = Pairing.G1Point(uint256(5924887206267599290445822338126407662061802650868282291346532349219911485238), uint256(1344920524477990204199563971884155772383870375274316818234816784080926609708));
        vk.IC[9] = Pairing.G1Point(uint256(19557850358922827872295866756225698354943748892032489948667392114850404908134), uint256(19468437728776888738614990617146990722577715298789977649937073607704154035540));
        vk.IC[10] = Pairing.G1Point(uint256(7261384600785793923475507165875010011024946051477444286619380811730182683144), uint256(160660995558937083002531755250510384930662013644664851780324981962968807530));
        vk.IC[11] = Pairing.G1Point(uint256(10068458639561624503583887695299257433943961014352711545725989482336480683332), uint256(13565267463913293308036876909896285996220795172802653704783765769297254127543));
        vk.IC[12] = Pairing.G1Point(uint256(11752453827713653845556140479566562877561889323932486804210372543234420616331), uint256(17514831292939978200265658225301246028600319074802797814305092434768220447645));
        vk.IC[13] = Pairing.G1Point(uint256(17156096183507483727822967034553381505990627706540318893862633555430755814900), uint256(3877826979492691283898507551798772289666739478565045922027968288556854212420));
        vk.IC[14] = Pairing.G1Point(uint256(19973504630527736278920568085754920021225186881588147630770138507443551672975), uint256(2190507880102055455787531072809289474363719106259478530550697269685302404971));
        vk.IC[15] = Pairing.G1Point(uint256(4685061982688355470575537030801297097013636928762380981695537573368794005391), uint256(14731229754269971160561532753202275264607590859688821328531148206788373364958));
        vk.IC[16] = Pairing.G1Point(uint256(2102180879434668890027705670933501461957665214593873825562142218435301622466), uint256(19687124575684510641826789647448884023953966806066095487163266325283456215310));
        vk.IC[17] = Pairing.G1Point(uint256(3944874632092157059985725245898835982579383881924389625197935302206591787605), uint256(7007680605986147549547241510007865886639768588780813667154513191315887798724));
        vk.IC[18] = Pairing.G1Point(uint256(1918148258471209863270632578857735514638518493993834010897892069563197143545), uint256(8446723142509317384565425468548755393346456204917221557913477316051809430188));
        vk.IC[19] = Pairing.G1Point(uint256(19057771658584719712826621030956250236340435092978833873844878435937545334838), uint256(814047914864172935087262666883717346667005923854730576985215811888858079151));

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
