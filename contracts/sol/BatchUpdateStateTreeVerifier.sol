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
        vk.alfa1 = Pairing.G1Point(uint256(21760378442992579783709716290592517912524870949144233413606117706340676470315), uint256(6461783494806915618186111383349491104073076044284955867688198297022971483620));
        vk.beta2 = Pairing.G2Point([uint256(20950832869766562489899561427810465052936020364551749164333382682891489638508), uint256(19436355369668687516481766990218891327919311962593401810813287956728020968857)], [uint256(7070719373647757310674134256777339249355165328948478287107071459948473449566), uint256(18068226495557114377259202790542179079108010379456566059085339356294681394292)]);
        vk.gamma2 = Pairing.G2Point([uint256(6516419880767227381665560639806247820147454109823247224969330229562772172705), uint256(2041527909679096972152054931204954230548009298749868554609292719855323365900)], [uint256(6487457347006520396490514387598658068660721465632160256490903307938589513338), uint256(14371721005830622736795052051881780898712691960599154699958874799340518886356)]);
        vk.delta2 = Pairing.G2Point([uint256(13919504564703615827645657401909573313861045276499864208118314961884612959243), uint256(6251584869702072381554677107614066312771440862837929094922453690380269758812)], [uint256(20141456152545976946203816694969155991650703049361089091517142249885910268968), uint256(14153281521106387602645024086853332157020183656765505309626785765644217667557)]);
        vk.IC[0] = Pairing.G1Point(uint256(4376238061809058632664224756704910544360481509417349932868322591736570232448), uint256(19589469793111871319941622557427092513565492962319844970518040625427464985102));
        vk.IC[1] = Pairing.G1Point(uint256(10502183716405049450232532618887688383077776270503316280820884026539429781012), uint256(6042310560085668065610885851540571166727731464728188701681818726064112266756));
        vk.IC[2] = Pairing.G1Point(uint256(19357523820409459392026971892425136798428767956465129441966215321699324635590), uint256(2296477118976203155274616365583446057855720374052843448266805652863890897432));
        vk.IC[3] = Pairing.G1Point(uint256(101622722730319706788410070003626653216254432906750484069360118245454042772), uint256(10843036046883716489431709256888015264777996713629196792606623101973932860538));
        vk.IC[4] = Pairing.G1Point(uint256(15153050012060969856993420904595510124622531089474368844686664037915576211632), uint256(18482177505710801562872196202543688567662982515453311537906549212736301252820));
        vk.IC[5] = Pairing.G1Point(uint256(4455932961054965437712596592960052143760424194583775189090076972920999340750), uint256(9098036703454490816135897508928642763607717352471497030333063838409577423342));
        vk.IC[6] = Pairing.G1Point(uint256(16710884166707019641652819714973995846645010729757373232416779181114559567748), uint256(5017176118007115110463922290327751403938360116660624629352075521773591643882));
        vk.IC[7] = Pairing.G1Point(uint256(10030229217230998909971576837078056764980062666886931777996370128126980524831), uint256(5812141424232645895192139416702906279214036153308933612742251750394457807802));
        vk.IC[8] = Pairing.G1Point(uint256(2102876223068753241655114235412595778315631397281526274579872234652972514522), uint256(1804252320919696303667228942748676891998029178110510376107937070799855486223));
        vk.IC[9] = Pairing.G1Point(uint256(11072555240242075610687882893951648578114405444837510199314567522549740297940), uint256(10358305868341571340978568865865683982101529944715448489218029910884068119000));
        vk.IC[10] = Pairing.G1Point(uint256(1989111774840340949135451070219898480906308125809292766938011821091393434010), uint256(13215689489033787362071176303452641582034673965602764378133331477919263819538));
        vk.IC[11] = Pairing.G1Point(uint256(16019622656898857953874452348978814610349007011448076562068756990478879549287), uint256(9704243068939085221498133850706880826604808878170699493684291187547374763630));
        vk.IC[12] = Pairing.G1Point(uint256(3512249421507294468220376685400470017979267205435775139188323007750075823058), uint256(20373539062229698282004333936142732898944915213962239895103366033694390935397));
        vk.IC[13] = Pairing.G1Point(uint256(11542886023437648114751145243964307412315921379388287652801854697714370298420), uint256(16751843480878152564266365593719266596794133616050272675955310098540947467560));
        vk.IC[14] = Pairing.G1Point(uint256(15579084296464308181118101570995540357902593286671591196559949114820390182274), uint256(18651251080997323712479940956180579976309768370390263651232907132009356144675));
        vk.IC[15] = Pairing.G1Point(uint256(14628324522095493381694103795823999180924450324410833686317223601215978220871), uint256(12733868285543043713949528378326016868174208368163200538950673211262775840418));
        vk.IC[16] = Pairing.G1Point(uint256(14579763577506040020316061597144706505316065470601963584593022693287553716581), uint256(14369230526716555862524267078109406667613835487560505386658750016708888990981));
        vk.IC[17] = Pairing.G1Point(uint256(7053184674571970684962598096115024777788363403483821645297042292292809676193), uint256(16105825374387776763360632789131854298648139038436566091905693181302558767327));
        vk.IC[18] = Pairing.G1Point(uint256(15166060052935575817331951190427192218118656371845397518458981603852750277067), uint256(6449471879324459677781505052169828266489881576680874212931994685491879062018));
        vk.IC[19] = Pairing.G1Point(uint256(15231354462006976509391035115974335584006303733608685243034076698709055637215), uint256(9966302524520520481842045681012547377841862413947384687671992348967836245483));
        vk.IC[20] = Pairing.G1Point(uint256(6829393222485973650829236317073220754198296804049691772703017461428119431059), uint256(9743249117650760908118845276848545888232995181123812548569010551226816145120));

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
