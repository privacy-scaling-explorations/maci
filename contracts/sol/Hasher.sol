/*
 * Hasher object to abstract out hashing logic
 * to be shared between multiple files
 *
 * This file is part of maci
 */

pragma solidity ^0.5.0;

import {PoseidonT3, PoseidonT6} from "./Poseidon.sol";

import {SnarkConstants} from "./SnarkConstants.sol";


contract Hasher is SnarkConstants {
    function hash5(uint256[] memory array) public pure returns (uint256) {
        return PoseidonT6.poseidon(array);
    }

    function hash11(uint256[] memory array) public pure returns (uint256) {
        if (array.length < 11) {
            for (i = array.length; i < 11; i++) {
                array.push(0);
            }
        }
        return
            PoseidonT3.poseidon(
                [
                    PoseidonT3.poseidon(
                        [
                            PoseidonT6.poseidon(
                                array[0],
                                array[1],
                                array[2],
                                array[3],
                                array[4]
                            ),
                            PoseidonT6.poseidon(
                                array[5],
                                array[6],
                                array[7],
                                array[8],
                                array[9]
                            )
                        ]
                    ),
                    array[10]
                ]
            );
    }

    function hashLeftRight(uint256 _left, uint256 _right)
        public
        pure
        returns (uint256)
    {
        return PoseidonT3.poseidon([_left, _right]);
    }
}
