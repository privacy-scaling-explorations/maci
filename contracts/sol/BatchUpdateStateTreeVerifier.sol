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
        vk.alfa1 = Pairing.G1Point(uint256(18478394912117614811801183794969166951738046639038079497306346115699531798525), uint256(18804065692406738129457172627828157234037551556347122187715286281216086615140));
        vk.beta2 = Pairing.G2Point([uint256(12921741986115612875387025567875515851210233730637903616583416899510891290069), uint256(5597955577016453502303977806471648115561117416381865780985431784178708516882)], [uint256(9488692798850628665469837662725008476977883494617033688080600895123779361263), uint256(2931425699746754604082147757732622150816484812411809541698361461075672700775)]);
        vk.gamma2 = Pairing.G2Point([uint256(16350794194767388683615787959710594709770928019026023558104224417688799016785), uint256(1758928835983352284476518919348912844437107969412707080774346125840012091084)], [uint256(4805703882066648633384279038169674684866489898810625738048506610514823969881), uint256(14924646288065934972545272711671645472260389074048491709534667180632380680294)]);
        vk.delta2 = Pairing.G2Point([uint256(10073268849904888846583942168877966278759640766870669531936461119859223690924), uint256(20412921756998156498328660723817785135047551400761909946049326074035020247202)], [uint256(7181308120189130669926323774444197222915301695044401506961650295890681457602), uint256(3599825694166023227595735793795199778228513107313394318477330269397168025268)]);
        vk.IC[0] = Pairing.G1Point(uint256(3701466745285787771022218707907786320328344891943948280787043864202989539130), uint256(15917677841474851047571518812841672073827541650738071283510561917517506115197));
        vk.IC[1] = Pairing.G1Point(uint256(12198905166895492398081324875389748280306421539960912077360363224094968693890), uint256(7067261521775186122974370129240261612460762084746369510710729709131471619561));
        vk.IC[2] = Pairing.G1Point(uint256(6567840477265316890579759566856446884113483949668183184743853206191463922148), uint256(20044476049424472445459173206509266257291204667204579506552790762673975182941));
        vk.IC[3] = Pairing.G1Point(uint256(15890329736228373542731021283421439357585312835382321015309389737546377539930), uint256(16724284862494567694724527894408281447982078865775337785908501696813497771168));
        vk.IC[4] = Pairing.G1Point(uint256(16605057802767736242334333304308819317549692335165798138572620135300963730087), uint256(8510518166841870849454185648897477574970999568965224063568315536213868140841));
        vk.IC[5] = Pairing.G1Point(uint256(20016653339710525370894535007316486340791891677828782741829056605252444364349), uint256(8358357265076056647450622062987784309674016370208224139101603929964949174685));
        vk.IC[6] = Pairing.G1Point(uint256(19316546593879513261995260052630229715737124460632073472714667118968048737521), uint256(14258868092947873505186375023458918449776778409723781878498543830058422861903));
        vk.IC[7] = Pairing.G1Point(uint256(14247939606013614353877855848347071740094032243387603248479769186800462267064), uint256(10593417448296292923994099857739017038363475889836899727385662283936212141636));
        vk.IC[8] = Pairing.G1Point(uint256(8185628867159488877698748609959751832106956318712703971916885000568072615747), uint256(18850156588075430117769228424935156764394355395780255923072760770432503277938));
        vk.IC[9] = Pairing.G1Point(uint256(19465014100141785105493169794680756276251059230800755490262060582093249422967), uint256(20420960450485036550860243121218008773915586778288754724073668150420714691673));
        vk.IC[10] = Pairing.G1Point(uint256(17017971373333760328022187675792399608634020681246813328854756980378672626456), uint256(7494729333381713053196545205040110539099153853456053490302979275059645552331));
        vk.IC[11] = Pairing.G1Point(uint256(6985209869555127194821879815755276631901948735587816945832065044653824715562), uint256(6340432047891960248640946347764642442369567742070022760514934698974469502831));
        vk.IC[12] = Pairing.G1Point(uint256(5647930690117871606081840126549768103460326987726251734185554471355942664823), uint256(20989089910064290063847667094576993221342921504636344945679982260509330890531));
        vk.IC[13] = Pairing.G1Point(uint256(11580546048684375937100438557356485773372327499322035664891978307277976286948), uint256(5785865794249271429852462931064836312324212415785525239943137602968274369357));
        vk.IC[14] = Pairing.G1Point(uint256(10608526287494848833704844518688929382158331422491160611937898887724773243671), uint256(2130502822105209573858081040916750042034673253012502304473587186928303806178));
        vk.IC[15] = Pairing.G1Point(uint256(17939234236320760095876734617443328909617945576496825609112037590546699887217), uint256(1895849914478650890241326126488208114947141301408952069822484647243637760099));
        vk.IC[16] = Pairing.G1Point(uint256(3890233456448772077068167941085736514644126688338421668457138620222846710511), uint256(18134814885033893345329688247422457356477978952372981818889364987820773849674));
        vk.IC[17] = Pairing.G1Point(uint256(4847396653751698693431608431007497553033326763139979475063712969721023296255), uint256(21686997406444231028487785039275522063969555982523268105540267616743823032078));
        vk.IC[18] = Pairing.G1Point(uint256(21544924188493279945850241339315959159917659036620366106092228003295681892084), uint256(10898536541664706237142916630834241717686687698589861861779117122156457354698));
        vk.IC[19] = Pairing.G1Point(uint256(12534985827139433526644040016048489521594566738685868887381240202201807059801), uint256(9501229063382041248806759150769202198099436225835736366999174668503039356337));

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
