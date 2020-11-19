// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

library PoseidonT3 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT4 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT5 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

library PoseidonT6 {
    function poseidon(uint256[] memory input) public pure returns (uint256) {}
}

/*
 * Poseidon hash functions for 2, 3, 4, 5, and 12 input elements.
 */
contract Hasher {
    function hash2(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT3.poseidon(array);
    }

    function hash3(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT4.poseidon(array);
    }

    function hash4(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT5.poseidon(array);
    }

    function hash5(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT6.poseidon(array);
    }

    ///*
     //* Hash 11 values using a combination of hash5 and hashLeftRight.
     //*/
    //function hash11(uint256[] memory array) public pure returns (uint256) {
        ///*
           //To hash 11 elements [a ... k]:
           //hashLeftRight(
                //hashLeftRight(
                   //hash5([a, b, c, d e]),
                   //hash5([f, g, h, i j])
                //),
                //k
           //)
         //*/
        //uint256[] memory input11 = new uint256[](11);
        //uint256[] memory first5 = new uint256[](5);
        //uint256[] memory second5 = new uint256[](5);
        //for (uint256 i = 0; i < array.length; i++) {
            //input11[i] = array[i];
        //}

        //for (uint256 i = array.length; i < 11; i++) {
            //input11[i] = 0;
        //}

        //for (uint256 i = 0; i < 5; i++) {
            //first5[i] = input11[i];
            //second5[i] = input11[i + 5];
        //}

        //uint256[] memory first2 = new uint256[](2);
        //first2[0] = PoseidonT6.poseidon(first5);
        //first2[1] = PoseidonT6.poseidon(second5);
        //uint256[] memory second2 = new uint256[](2);
        //second2[0] = PoseidonT3.poseidon(first2);
        //second2[1] = input11[10];
        //return PoseidonT3.poseidon(second2);
    //}

    function hash12(uint256[] memory array) public pure returns (uint256) {
        /*
           To hash 12 elements [a ... l]:
           m: hashLeftRight(
                n: hashLeftRight(
                   o: hash5([a, b, c, d e]),
                   p: hash5([f, g, h, i j])
                ),
                q: hashLeftRight(k, l)
           )

           TODO: change to:
           m: hash4(
               n: hash5([a, b, c, d e]),
               o: hash5([f, g, h, i j]),
               k,
               l
           )

         */

        uint256[] memory input12 = new uint256[](12);
        for (uint256 i = 0; i < array.length; i++) {
            input12[i] = array[i];
        }

        // If fewer than 12 elements are given, use the value 0
        for (uint256 i = array.length; i < 12; i++) {
            input12[i] = 0;
        }

        uint256[] memory n = new uint256[](5);
        n[0] = input12[0];
        n[1] = input12[1];
        n[2] = input12[2];
        n[3] = input12[3];
        n[4] = input12[4];

        uint256[] memory o = new uint256[](5);
        o[0] = input12[5];
        o[1] = input12[6];
        o[2] = input12[7];
        o[3] = input12[8];
        o[4] = input12[9];

        uint256[] memory m = new uint256[](4);
        m[0] = PoseidonT6.poseidon(n);
        m[1] = PoseidonT6.poseidon(o);
        m[2] = input12[10];
        m[3] = input12[11];

        return PoseidonT5.poseidon(m);
    }

    function hashLeftRight(uint256 _left, uint256 _right)
        public
        pure
        returns (uint256)
    {
        uint256[] memory input = new uint256[](2);
        input[0] = _left;
        input[1] = _right;
        return hash2(input);
    }
}
