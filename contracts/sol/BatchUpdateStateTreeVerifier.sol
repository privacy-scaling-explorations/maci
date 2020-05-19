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
        Pairing.G1Point[24] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(10570051052888003353849523352765816932851644813318359978373536459140219523319), uint256(7033329124274752861912233406454700158875581514011733582563888707989000309937));
        vk.beta2 = Pairing.G2Point([uint256(13808423767159715643117367494769067153872924443622825321140926309799248777616), uint256(15367923175206623573375141800725829552412371400388732586975889192543527186622)], [uint256(5854708365792332761759408212247705404638033005545879131125467869003185792970), uint256(7941784395016479125110887601630720525156320370723725002463097205122934990779)]);
        vk.gamma2 = Pairing.G2Point([uint256(20762094322905028840984979551551969288378416883302063543096144313303348416276), uint256(2072369924379164675022530959753323067409701941451683689482861488184172623986)], [uint256(19165910689724444424958689017497367378007415721095893902723652636150351615056), uint256(11308135520949339698693898352325883607420784042035213208561262064124003658558)]);
        vk.delta2 = Pairing.G2Point([uint256(4238774849467113980257771579269914016509552194939183659803687670775474742962), uint256(3295307173754222547676961614231867222131723530581816583667149586223509365375)], [uint256(15514254251320110057744591724774179816917281952247178593445071382432567886110), uint256(13879628367268832121058375794182025405383563724725365113871173650614659174242)]);
        vk.IC[0] = Pairing.G1Point(uint256(7290248099374013759812893599144556174971451233962809365148222982340390517929), uint256(13127271959059467228125803497986275426597287297163048240103615426171712491313));
        vk.IC[1] = Pairing.G1Point(uint256(11599786382573878376940786055571351636254327977420793923380444034408020857148), uint256(1629781888455706182161762750679767047236666507575772342641253632611052711759));
        vk.IC[2] = Pairing.G1Point(uint256(19450665413098478033857152383000682859993806833260780120471037533441920125832), uint256(13688163566528349803045434286190120078830380827913677552944675441342565604099));
        vk.IC[3] = Pairing.G1Point(uint256(18167975721783126511803498152612440592160196587982206825297879996170535684420), uint256(15908013325852566229390775307447770813306301343681359280905142164727557529591));
        vk.IC[4] = Pairing.G1Point(uint256(9543457973763630587428500600355995312862701535806952097152907355953950133957), uint256(14043937590017462548239018055271229605514882799397199330648000892868192961766));
        vk.IC[5] = Pairing.G1Point(uint256(19209710949912837922434805576728847061549352432778048806114060367960473672310), uint256(361644872716692932738423793646448463834571790691834405929883459334260079745));
        vk.IC[6] = Pairing.G1Point(uint256(9679109491815751831975769484188555805211915423212940006275766325625875080743), uint256(10467513368230239620483892466094278471005042256393235728487704810820041301920));
        vk.IC[7] = Pairing.G1Point(uint256(9008228084798714913517393910156828507725270107147396944875424820141244180954), uint256(7943456341733242583334858345608019386380608294852853355225982572293900113494));
        vk.IC[8] = Pairing.G1Point(uint256(17576906424143201993845903923582889240765825118808985352028460344184338524362), uint256(8565289359346744755598819139472041506353700796239330705033819584308502574119));
        vk.IC[9] = Pairing.G1Point(uint256(15925526927492249000927356371876271414330471640792075708258756225697654806406), uint256(9871757622293252939002427737414678270976542265380083804377812289413457650565));
        vk.IC[10] = Pairing.G1Point(uint256(10349830153124080380772615006571118348019716701022545646497341374949969154341), uint256(4692694015596063709681034944213779938956343851752266426998604482508855353443));
        vk.IC[11] = Pairing.G1Point(uint256(11586607088806328971735703307412733205985443148551736374559401716968498935833), uint256(13548592705001075641501985922232722155745616522967092455570258771034650248339));
        vk.IC[12] = Pairing.G1Point(uint256(13862322589327698313395909384911260691056047063509205930440038643637829171717), uint256(15460229154726221222883327174890422305146734012449095626780431078181039641951));
        vk.IC[13] = Pairing.G1Point(uint256(13383189339952839269949067204091944545065637833476453775733176082460626607901), uint256(19680587201936338057180386217529013917913414995882591778898115156389681704712));
        vk.IC[14] = Pairing.G1Point(uint256(20382837434178642823176061479803880070596128271392719811993157951569568842683), uint256(9804092135199359982202884429016384266019491248577583771242123111491272908168));
        vk.IC[15] = Pairing.G1Point(uint256(15075731068883428769200651536094923228174611761162082394894017399679976743136), uint256(11357445254022775317313142501306123029941602811478988853776070898420486136665));
        vk.IC[16] = Pairing.G1Point(uint256(9600938640058467418361141769830571770180863279892643526313562618684730944734), uint256(18449230466296075827394674884524948207360462708098953076063430085064468929507));
        vk.IC[17] = Pairing.G1Point(uint256(20932685550540717586684566319798345233720500107693626085460068103768421309912), uint256(14437271837349639657753512935048653826959975540304476907292929863019087598906));
        vk.IC[18] = Pairing.G1Point(uint256(6742037653858231023442596525251286506204541482979679783593062122549394356885), uint256(2449505202438310924228206988633583999620912243440013871704171892752924985663));
        vk.IC[19] = Pairing.G1Point(uint256(9416981337352165171725135494837037650368047772119687628585229493121690038021), uint256(18576873511783915377842904545829648558413408398656373470169688467162187342901));
        vk.IC[20] = Pairing.G1Point(uint256(4734025990325131234389607904201782841798054749621079036892740232826407644082), uint256(10193514457330537801155353276742977104417686164356081115538713998164252899065));
        vk.IC[21] = Pairing.G1Point(uint256(8066155517369900988094552452771076975127605999511669722295599502801279636496), uint256(5470449694934200903973827943698770819340093622871706984904353536964908210751));
        vk.IC[22] = Pairing.G1Point(uint256(12904758065794639613479449476695140152742160287558134958352961981273023613219), uint256(10334273033465848223250613865211970833327249837905052691988028941677912328936));
        vk.IC[23] = Pairing.G1Point(uint256(10489781129101588902062878202892057925875718807182277840380611087119399540551), uint256(3111518022351206327374594164708785156296906437987443931614180707273378590997));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[23] memory input
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
