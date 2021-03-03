// SPDX-License-Identifier: MIT

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

pragma solidity ^0.6.12;

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
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
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
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
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
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract BatchUpdateStateTreeVerifierMedium {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[33] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha1 = Pairing.G1Point(uint256(896522547621038095617675708881514086427669920162969120659901081448513327813),uint256(12186676637960156660667404174130103200877928614848607701981753268664860028484));
        vk.beta2 = Pairing.G2Point([uint256(18993910864327606383045031619110676233458003986741571515613173363081239364117),uint256(4864488344901279550964742917483266327571442270034610081658841799619824504257)], [uint256(17758594176531193991369424109440476510276713618065710555282598092516710705138),uint256(6694483475280493704579469704238643538022085004357313759373802384806105512008)]);
        vk.gamma2 = Pairing.G2Point([uint256(21740823130253734374481042217590401998360032806985245651820273771858080377036),uint256(10739989060506072438765829646916143405431370023238207770105771292105489482822)], [uint256(4892431775730183577381033124681441792690846696139251572687334378650272266882),uint256(18472256976268696167298954683318992193761771522591007931170282202665755691705)]);
        vk.delta2 = Pairing.G2Point([uint256(943202817436749817238329236487301696559555326258669030591974224657658339672),uint256(12970882482371795670530128615567548878916494561588810608903972314988935615429)], [uint256(3591522203758770549433843751342829062483515463115035373170659781243958704691),uint256(11521035721432988027447408816746411705821068569102492124364771324621567390450)]);
        vk.IC[0] = Pairing.G1Point(uint256(10562821774963459764590846759215309413405789780453904885140241123052929888653),uint256(4808473940477443133126327014046132585387049829417835771390503713392184118125));
        vk.IC[1] = Pairing.G1Point(uint256(2836383605973723333426178563196632752815202937430897204995403900646857910466),uint256(16440518973402225556773537426196087549363751877606216353179028951215893405596));
        vk.IC[2] = Pairing.G1Point(uint256(1647799811277631832067039303593781327861210021936795071032449170903927312033),uint256(15329521315244109115412746762915962460789826312517897838533689767663209640159));
        vk.IC[3] = Pairing.G1Point(uint256(280835327475291435928251940805470509157017993497514207901237272799776184380),uint256(3077213345845047335229183431121710753288116595840858737842695870562218587426));
        vk.IC[4] = Pairing.G1Point(uint256(1665588629176014847675272010065860256179024644770659115950911011300983160308),uint256(18447872838572864900198979548165100978909657686602063447890313899816814883559));
        vk.IC[5] = Pairing.G1Point(uint256(17115382629017551696746338976242532205053974988339640584303132638359603470212),uint256(488325631193402311768067749914632781490651571674120988653217859856863809714));
        vk.IC[6] = Pairing.G1Point(uint256(2699405174855480475663319696251967814729898298745309276672105691024130569706),uint256(7299703637714283411144692980229941907723810335170554917802853924372262682666));
        vk.IC[7] = Pairing.G1Point(uint256(2762825058322918338331393134945206412609644887414744975122575605851493163282),uint256(19829814648819823545742943125516121770462362800419060301229693862039736091643));
        vk.IC[8] = Pairing.G1Point(uint256(6177450633682238529732429027488001126274692349324981399606275380683664114771),uint256(6608653975811424651830365008783126849964288401597191694382449526449521249693));
        vk.IC[9] = Pairing.G1Point(uint256(12147367403861837660559617255582647993993947732823979298922219429328778447751),uint256(1817935766747511719365078570183713046604034961770786754488247475697327601878));
        vk.IC[10] = Pairing.G1Point(uint256(6323249457041031405127666602526887364048811597816431817170683647595433039861),uint256(19098169904265153513074871955480862565390209504726397426666165514830560341202));
        vk.IC[11] = Pairing.G1Point(uint256(20402296905867168896518445733978507583249722382668315448384209554914111485860),uint256(9066595557283533083407005763204257318241036648164061783979970768057262319654));
        vk.IC[12] = Pairing.G1Point(uint256(8593089705123494084961973802472462226938709560538726280342316052462651044459),uint256(16107606334845228843477290190137694530393997835200107898771350547974569814691));
        vk.IC[13] = Pairing.G1Point(uint256(9520193392265554551296684146233198401601772539552087791170193126594822993923),uint256(16049414108212375206836214445153696948706793471535398978123270160818028519037));
        vk.IC[14] = Pairing.G1Point(uint256(21465645024744559577365287392497669575667490735360234709301789253858389799878),uint256(21307978770252050689065672593840328593501602218486214184075137718623073674449));
        vk.IC[15] = Pairing.G1Point(uint256(6051186065861172478424429426828265415263628108882723626866906282748722475186),uint256(8575514313825031691560947433958750025553924516901970034389907671661445243407));
        vk.IC[16] = Pairing.G1Point(uint256(19719109420465558884861080893306507166227670710622345292483953870136295906774),uint256(21606091679164487116243976337398401547914836162419597666675757392315785593133));
        vk.IC[17] = Pairing.G1Point(uint256(6269338125861511799508824944533131528577715184336132133584285657240696025550),uint256(5632946909615115565811318739108028510780429684302093053817627009046174152169));
        vk.IC[18] = Pairing.G1Point(uint256(11959955047086654405544734409782602351155153509690898961257385044410199127423),uint256(12556820068633956795473034083123022723719808990149193930392607086111955593826));
        vk.IC[19] = Pairing.G1Point(uint256(13299406381296860508118340709779294101530754506735576915230938700104762742437),uint256(11935309122767029044801440299591711355196857459895737626941346047309882095497));
        vk.IC[20] = Pairing.G1Point(uint256(13302527357809190779028801483234912180812456106344851562173208617620943363659),uint256(4886937564277237191908823498669634364347642176834523794557145124473571485569));
        vk.IC[21] = Pairing.G1Point(uint256(6386006312378361432059867135179861501658817123894391475205305273071301040985),uint256(19006881328437448788452830825136387297151470883244101647906012480328122681737));
        vk.IC[22] = Pairing.G1Point(uint256(6559734582749665463408849975936466504724422746688387844828809941342129183167),uint256(18725931979350750023025364028592168372108728272474126950559170082803098410818));
        vk.IC[23] = Pairing.G1Point(uint256(5742495397035350521638104170739596712707777120075620603559317964611878542879),uint256(17716774253786049037003704237580729007829543061949722805011572944372815297601));
        vk.IC[24] = Pairing.G1Point(uint256(7831695707212865259332418293657689354423981446663515815406988023533749439501),uint256(20116989832233272498091559385048736887159448499043066365587385424387559366310));
        vk.IC[25] = Pairing.G1Point(uint256(12662372995467504261200077320293163708187777780889845787703337838190206871255),uint256(2051304632687363167984559709937167097630595543446962307172250671630470350290));
        vk.IC[26] = Pairing.G1Point(uint256(8180900416651614849018940459185196049230278639192250954097985964200553056280),uint256(2514920927082539717373597126305869289106447129269514034753911777476811968255));
        vk.IC[27] = Pairing.G1Point(uint256(12566377395527936848019354717499369797520487437959684773305081298151283901040),uint256(17568226582522386518398247860757178183744463244782888170120589886854312346996));
        vk.IC[28] = Pairing.G1Point(uint256(1342091863738658611563834864474029438927558109100245134497866895607370617618),uint256(18019745184856462406484109850928194000979103724353199912850135877491865579359));
        vk.IC[29] = Pairing.G1Point(uint256(12151013290481896631701826145632464105300952703454688470678672843646384819514),uint256(1779184764637254345553299362913380735545678610142029547070108797451011044222));
        vk.IC[30] = Pairing.G1Point(uint256(12878434213507956222008225201951356426519726307363760594610788152515951804515),uint256(9054841636568992466651815324971578299756223761292109100809775474370383971746));
        vk.IC[31] = Pairing.G1Point(uint256(21218773710187082388069505624490027861745841715856272405315435711478672497334),uint256(9746318881239667589266567715635734968860355511956912918612306369761288897423));
        vk.IC[32] = Pairing.G1Point(uint256(17043986429643649895659541733956620424079489371169083666386984985022604558977),uint256(20049070655220599970990245659911224281901896610372329470461737892373718962114));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
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
        //for (uint256 i = 0; i < input.length; i++) {
        for (uint256 i = 0; i < 32; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        return Pairing.pairing(
            Pairing.negate(proof.A),
            proof.B,
            vk.alpha1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
