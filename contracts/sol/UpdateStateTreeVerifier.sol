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

contract Verifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[29] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(10966289682349462446005066242894121943294390125329019793954082953046873637770), uint256(6327244215794243320322631376693415326758806913001740859735932806427975277913));
        vk.beta2 = Pairing.G2Point([uint256(9018329035912452078007660491679939386694168739651436930068403543548759930132), uint256(12166987171386193905958259445982507839204927140589819379583621774861537641190)], [uint256(18960741831988972367886697253004072156659148820793060413477426022907947947734), uint256(14038435878652653004451244375600572091601574779813568665498392448555314264141)]);
        vk.gamma2 = Pairing.G2Point([uint256(18182932704024690128884656812569527897468672663795549613927999865348765842006), uint256(3906965717063956158855274022781298633550703797333831924980925955698978903943)], [uint256(20173671876684742389029600356663820116227488602337446520960695883485491828303), uint256(5616528815503891546225245124286417246863247083726760933146112168543808142532)]);
        vk.delta2 = Pairing.G2Point([uint256(20648629545976287579952691811151850111656545696582649364851026358649967101773), uint256(20682369364186724898071344559640537052764380406354505981530188219640953710512)], [uint256(50418841935723512579872434717678605260059882664574793098086800063733361198), uint256(20637020082656775486180298714862757766132545629833189815562013890389603898025)]);
        vk.IC[0] = Pairing.G1Point(uint256(4178330832323047389849309390789518192015190344614251594598913971814234467557), uint256(13623869058387792332009274513798877691872847430921266940893311135610339505617));
        vk.IC[1] = Pairing.G1Point(uint256(15625612413686470236911244680957079225849921607364798474644796864485014718323), uint256(2014824215657123172593827968965727574703614806061761564098679623921955665404));
        vk.IC[2] = Pairing.G1Point(uint256(4083765604919931438302758225991699071313886810901959382331845272567710280321), uint256(10359292213215262751576219647921286479801549273041921478130863511572590762684));
        vk.IC[3] = Pairing.G1Point(uint256(3206981970955398802712005331911956757594522689376704582222922409781648780933), uint256(11645123959895409537167978789973081252238513738534156744388048857717735065690));
        vk.IC[4] = Pairing.G1Point(uint256(10638805434774973484288354494237063055254499418200130759633153042939151018074), uint256(20418266180370787758289549840705913540364461759518485057900834335455879066956));
        vk.IC[5] = Pairing.G1Point(uint256(10747254750544804709407785151842010573746108651484340482681193285941846558833), uint256(7971419982430776934033588721894574587081267713471459510344123885709873806910));
        vk.IC[6] = Pairing.G1Point(uint256(14776156011508977029607319308716123816477923961812660526400253661235993714382), uint256(15181334270798888063809384943837811221700646977997180736754300343105211539239));
        vk.IC[7] = Pairing.G1Point(uint256(13602275531268805034465054906668282731019217694666884457056966486911269451416), uint256(15466200485903632742871196638386765234729958368248662629708281496129922832102));
        vk.IC[8] = Pairing.G1Point(uint256(7065593359948098694605871247183313930752140060161188335820092473416782964485), uint256(3131254635779032450495704933316379814938142854506977279819361114676269058901));
        vk.IC[9] = Pairing.G1Point(uint256(9828508926665445412754649248305051138289436970495096597342423762899507219090), uint256(13334792713659074160385005993231030270947478930076485069408589140466589211235));
        vk.IC[10] = Pairing.G1Point(uint256(6923131856719106685162911467791180442079983577202737177232768154124328164851), uint256(1878302423082155470381937863347451510730066124680224791197150892995236641901));
        vk.IC[11] = Pairing.G1Point(uint256(16357457942393258320766233431492599655608199080908865352724400815115357331525), uint256(6686066482065520870871030950390798412169627320452157466780990881137728974533));
        vk.IC[12] = Pairing.G1Point(uint256(6665769298776741275017456909143921468425087322582060971766001751388187427163), uint256(14104554857739942432660996744092675612511666159700271604291427244046033339494));
        vk.IC[13] = Pairing.G1Point(uint256(11578158796344832080134876218148675075367197401000361263024610256656409493373), uint256(10199452315332891697703187708906058832885256781295397831274981050576163175746));
        vk.IC[14] = Pairing.G1Point(uint256(21479862250556012568642788080894525797964943969804113033132018312241523717204), uint256(5254865243621918004773526814027346408928251223000045463629462954782741057249));
        vk.IC[15] = Pairing.G1Point(uint256(18398447877187233197520248291909449293196711659553309181614156986176853186391), uint256(11053871356824631095773101634603490516444786090588884185065776748883212843553));
        vk.IC[16] = Pairing.G1Point(uint256(327747259642397937404002436789725413608788629669639474525250963913960381505), uint256(14766028556482643773012614771510968215105267571371861239703147696767997544840));
        vk.IC[17] = Pairing.G1Point(uint256(20427421027509268932408228244058137978862891398508133681910595942183497755772), uint256(7895449227088099737771293478920060693199815142728905069067071989321420572291));
        vk.IC[18] = Pairing.G1Point(uint256(18199861923985605436770001064092294826233365488520737085810736310909704673778), uint256(3825111422214944390042182890496746574059293776795088978949877773253038167354));
        vk.IC[19] = Pairing.G1Point(uint256(18701313987843249569617907462458774431135391077076516179617022431174537373365), uint256(5174642694032459174633235744846677892734746921234369094616954370773039982777));
        vk.IC[20] = Pairing.G1Point(uint256(5087071712972977032879323433717951278209859343230688713061099139989073648967), uint256(9758071800017030584296479690579383332205695441692962502302688235198584403899));
        vk.IC[21] = Pairing.G1Point(uint256(6598862491735552831484109728620819739829255357864879878964571287480045205890), uint256(1143671356608732726635438532149509930746323306669072889926628941274467291909));
        vk.IC[22] = Pairing.G1Point(uint256(14960129880790415282885751290364340673249315069780180514833279125629139213837), uint256(17113570196118378979531417597828454803801950689228028051177177003856694862066));
        vk.IC[23] = Pairing.G1Point(uint256(14631455533456999338633388940583392567291447631667827251668008328391311004656), uint256(20681270551169748747237369410136549402842453517394784877201465485974265799775));
        vk.IC[24] = Pairing.G1Point(uint256(12824044944806908295318728420296760072836009606133770333562269685749663493807), uint256(20855306604220337750801377034405434910872041807056129409008692553193346575602));
        vk.IC[25] = Pairing.G1Point(uint256(16135106473610122573408926504425488366234038275952142402512402341934557424255), uint256(14346345534447969528623069418109996759963239590193469032608668896667971841106));
        vk.IC[26] = Pairing.G1Point(uint256(19119655690402679471939869883032072844395520656164548964824356002624721152948), uint256(21770394099374643919585189593674570399617814703997702860026125476366191476436));
        vk.IC[27] = Pairing.G1Point(uint256(19354870432490366479919339216148897608279406757509087195569378969672496721537), uint256(20144444350113719460280115471210040979067811286730926981127209233519544247243));
        vk.IC[28] = Pairing.G1Point(uint256(21563804971912858305158379744675051714690830408477819090503528520232497956630), uint256(20390085268021151373806381439264541345047689561984922346146061363180412792232));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[28] memory input
    ) public view returns (bool r) {

        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        VerifyingKey memory vk = verifyingKey();

        require(29 == vk.IC.length, "verifier-invalid-input-length");

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
