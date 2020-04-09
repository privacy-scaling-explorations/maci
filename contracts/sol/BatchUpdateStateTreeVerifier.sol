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
        vk.alfa1 = Pairing.G1Point(uint256(20513903879672485265713169303631099357515377434095112298887800390956493298460), uint256(13979725065861338133006927862907541038585812595747088844484586936801345903051));
        vk.beta2 = Pairing.G2Point([uint256(2997519294162847173763776124899943980097412248858139254602390673854918556129), uint256(21100463162729702598250622368017345164067812786037778622079916484610353300002)], [uint256(10191747351729760991726919263030983913769583781111171829471911930847853204745), uint256(14418733071506232623743460891956405057838117986513077656623524224364804935395)]);
        vk.gamma2 = Pairing.G2Point([uint256(9417367351755996642853115215587786277074826121792607952145566410735877249771), uint256(3682946741362495031912866868091312356734928590494030564991395436927487757598)], [uint256(6721308495647038203157041440731016180593678074366692786120845704532267858395), uint256(20384077905229730366191847326400780096142259484998605008668767218957761012572)]);
        vk.delta2 = Pairing.G2Point([uint256(902106690176511306429330308807798080956821219131156522982805593346515686123), uint256(18550178864147381826757540675590392220769891123227854068954793188663105223727)], [uint256(6638990977169342645556750554966073776380944881566767019488113686880714040782), uint256(63113206148660041329947805666047822829423720403216938189914703076610994096)]);
        vk.IC[0] = Pairing.G1Point(uint256(4916515947346277364488783650423138319026281177884738537782181724989691007331), uint256(13670727129592160227312474883356226812777522122487806061882815902802356441625));
        vk.IC[1] = Pairing.G1Point(uint256(2571515319815948109801200575097888702803779681737002959800059850489874344088), uint256(4576999204061020535479214662143766543454179853426921416174204172477758919474));
        vk.IC[2] = Pairing.G1Point(uint256(1123058532656152562159548541643806662980272838981863721497114175885791315779), uint256(11336298865415710353404417851393905134852668155160271783311220390463404342253));
        vk.IC[3] = Pairing.G1Point(uint256(7455325316373333617058549121728438781981797714732891547739065519329669681967), uint256(12069123887436752310275748379447858837458357527268527394982287551362393986755));
        vk.IC[4] = Pairing.G1Point(uint256(19572796954812928345389876872804045584038802852302412631221131357405119976297), uint256(11095516388037316818084409018486278886878310409595545211665204046542667958565));
        vk.IC[5] = Pairing.G1Point(uint256(14539700332662076260688938145807413290659682370727569420411402637582614317464), uint256(20569813427928556482291752195991943953800859593135433300063344071964952096582));
        vk.IC[6] = Pairing.G1Point(uint256(9773539196908194995027603310857459028507452497942267012297949383203446090003), uint256(4948545548512867931163358291670458843075564772856616116395139319561867988148));
        vk.IC[7] = Pairing.G1Point(uint256(17177576642580497228009826694122563069675096453723199905695613002558869704552), uint256(21870420417079720638804031532258089305444566087850261870038149151674062925562));
        vk.IC[8] = Pairing.G1Point(uint256(17491008897206561301284542922031875875270741075873574015133935745430690079035), uint256(10055159747675247595685344688948391709827204488833127274988196645264554468450));
        vk.IC[9] = Pairing.G1Point(uint256(19260029931719258463652185969929023941322120364319263751957652581416045173924), uint256(9996312470005782864619250713902254291747224540427140921038203414727189007792));
        vk.IC[10] = Pairing.G1Point(uint256(9092832960349177332799670257213233983965256039340932247992595992765029010369), uint256(14309274949971526386752288273465944174033369068518788754552751763739535974125));
        vk.IC[11] = Pairing.G1Point(uint256(261923151244990922471123210337132481397225095156900455265497530512971306333), uint256(2202872459338635208918862615232542168178190645648183103503891511129263731588));
        vk.IC[12] = Pairing.G1Point(uint256(15058631682106775562229551827747725565646580633505423013093957422641963591029), uint256(16470852414375309608664348712151595440697471428167711485718121403157928323077));
        vk.IC[13] = Pairing.G1Point(uint256(18635324614852901988747552238679230092905674245879436859190062188082089789162), uint256(14976741254032558766340604554313707425778072658908519139352109146534117523777));
        vk.IC[14] = Pairing.G1Point(uint256(732382593611929396938233718073247811463368058685727465588157101289758218237), uint256(20005093946489156987031114501048570177089103316941048615616959593501841175236));
        vk.IC[15] = Pairing.G1Point(uint256(15206977805332505877899233379349635173557829783483701699080636046871240367347), uint256(1302289734844120709660724673037175549376558280030776734602803099862114404761));
        vk.IC[16] = Pairing.G1Point(uint256(11552518214899316977960090309696172605600797369119229315828130254442614327870), uint256(9596412993699448565711922374977037695083832441914674240988190501650096075300));
        vk.IC[17] = Pairing.G1Point(uint256(11318414225448353051857422144878371307840167824804420017308963936966851840244), uint256(19867345508863212954075794832454725111479596226623389739516406318869042533303));
        vk.IC[18] = Pairing.G1Point(uint256(2381648930949704965824919631127680843572758519630035924079543227630754298137), uint256(7985209002333020154604545815259134485987810253230815863308151777524777021973));
        vk.IC[19] = Pairing.G1Point(uint256(18931117938167762715588681781159856611083837664258635742017119786770291390315), uint256(18607538181317986504965929014812670664447613478572853593573055753507999523586));

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
