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
        vk.alfa1 = Pairing.G1Point(uint256(19559029138295522066251881339476149019652376354639890357416982087390563005635), uint256(8928108276059845665565957297644595341302958589138426492835258825928094185657));
        vk.beta2 = Pairing.G2Point([uint256(5828895856855946733664610223604976121573903066828789089944465162505437270483), uint256(3823602179438196504347532065318076379546249849861365352858339409858182673700)], [uint256(483936346597528750969670770407272839553348231937396017876132445270381177197), uint256(12423259868403608381264305739698715570241648188970470486455999429365316169541)]);
        vk.gamma2 = Pairing.G2Point([uint256(13856261066332659761120272167165035705426311351734785230087298262756443978911), uint256(2756054928407031217570310815492772210185928652399513659337557567532194637291)], [uint256(8456123382302187274005343738127140133535427755536822952169161468572645493969), uint256(21745806437209508297405088736218890981628652636702770768594446100909612166260)]);
        vk.delta2 = Pairing.G2Point([uint256(13413104702527656834259631322880330152823998934265403079671284141292142320439), uint256(12548138295851402184654250911528178068158514666817086825030535243948699398270)], [uint256(10400232499198361945130314258457700369308133576787493187528550518769553050266), uint256(11256934653646110761372102844419254527862164279754902253453417238509116321427)]);
        vk.IC[0] = Pairing.G1Point(uint256(20587478867148540535622281255449580374571714335024067019641966371079973042521), uint256(10341612874967395971607766022799845378372488633756524477567233426765911619270));
        vk.IC[1] = Pairing.G1Point(uint256(6243102933409268014087476853176843440045301573450130920659163483653125638895), uint256(21598382930422025191116116803721940288082307020331946813359675615962007690552));
        vk.IC[2] = Pairing.G1Point(uint256(19629085930328164828961785128882157448577359402822662453501498181428917341637), uint256(9882008266744406292855288156207620162177764715307374373805079544149613683019));
        vk.IC[3] = Pairing.G1Point(uint256(17695082915554226516894317508522375497664582557706842498790288602425504931015), uint256(9168483001466909419456839505437786728195151671242968124213931632041167987945));
        vk.IC[4] = Pairing.G1Point(uint256(5355299630908486462443797476064052338955465756748633052877912630352739670728), uint256(12860085448161373248355955532982941974760271096687922792781870000814662903074));
        vk.IC[5] = Pairing.G1Point(uint256(20503542975295292359969468252430596889278330669591200030361401198967594426994), uint256(7250821400824147117835212270914992879684776831159172579485688078670060721091));
        vk.IC[6] = Pairing.G1Point(uint256(19777486294028599958579512313256364177300926658581889837062215793490599453155), uint256(6104910531819628341122525610918583597735304002263318069555238538604021999350));
        vk.IC[7] = Pairing.G1Point(uint256(11459739065014249561327417449092686928365339438225484257822008805960924636860), uint256(20320548036724520950288871545222072317833932890887194676225928222104991558868));
        vk.IC[8] = Pairing.G1Point(uint256(12805759293528330301344436735166892172936993059549012883756719664629113824013), uint256(18019308124649274948795713853802992683390033250872635425071927208993413580188));
        vk.IC[9] = Pairing.G1Point(uint256(20915841858963650648580769961404581516207428656634188756956130390765071222501), uint256(3265338540741057540099630045038134544830018914144980849936106909144748375812));
        vk.IC[10] = Pairing.G1Point(uint256(8852132680261962519836040940787705623905772532127980897403080099738211415094), uint256(17322100321652741586745683659133249652626224648416103738301120999182321921701));
        vk.IC[11] = Pairing.G1Point(uint256(14276363941877110492606188688740963411902913732594155767000340724294461420041), uint256(6463868275928417142198282551275408210121596218261843460805981533290974302763));
        vk.IC[12] = Pairing.G1Point(uint256(2994365294481103355396737853614886982806636938286948594811871094763915323152), uint256(20398673125593558710225667757507285352848888080644598984869807991955747645374));
        vk.IC[13] = Pairing.G1Point(uint256(11440150572255054918618050099930506329206688117293138067664429177076025146820), uint256(20458423768749084305291418649117377037658183833435015389923161579410691632567));
        vk.IC[14] = Pairing.G1Point(uint256(14609589477684601869626043168066590823643545641662623909976513206161703578019), uint256(13147443408162502655097362416476587344109001369824937318066618173150702759134));
        vk.IC[15] = Pairing.G1Point(uint256(15783468156997958457196438988437452378667470005926784920828332564855958621736), uint256(16239283735429757045420523044660411072817492325404358194124433373031894684614));
        vk.IC[16] = Pairing.G1Point(uint256(12737522974956811755062049050052782544028765251418575547049334481502318084623), uint256(13884407990105316734190764739656460603609836489882516372765827980315913218130));
        vk.IC[17] = Pairing.G1Point(uint256(4554935633716594010248505988248408220851949871248290214248234539772568826827), uint256(11534193001884680862435766404848700019374748735704422346316270468714308079312));
        vk.IC[18] = Pairing.G1Point(uint256(4850658777758274234416621616069930465924335942260336968110240308470569865902), uint256(985661902473192211811405295979751708250488475599446438906924058749582996022));
        vk.IC[19] = Pairing.G1Point(uint256(14915453885833702618370896086149547945747649207294678132253848288455186560794), uint256(21828008505268693309024031698808988513109178744685105458395070063301470453926));

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
