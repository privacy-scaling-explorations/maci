// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
import { SnarkConstants } from "./SnarkConstants.sol";

library PoseidonT3 {
    function poseidon(uint256[2] memory input) public pure returns (uint256) {}
}

library PoseidonT4 {
    function poseidon(uint256[3] memory input) public pure returns (uint256) {}
}

library PoseidonT5 {
    function poseidon(uint256[4] memory input) public pure returns (uint256) {}
}

library PoseidonT6 {
    function poseidon(uint256[5] memory input) public pure returns (uint256) {}
}

/*
 * A SHA256 hash function for any number of input elements, and Poseidon hash
 * functions for 2, 3, 4, 5, and 12 input elements.
 */
contract Hasher is SnarkConstants {
    function sha256Hash(uint256[] memory array) public pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(array))) % SNARK_SCALAR_FIELD;
    }

    function hash2(uint256[2] memory array) public pure returns (uint256) {
        return PoseidonT3.poseidon(array);
    }

    function hash3(uint256[3] memory array) public pure returns (uint256) {
        return PoseidonT4.poseidon(array);
    }

    function hash4(uint256[4] memory array) public pure returns (uint256) {
        return PoseidonT5.poseidon(array);
    }

    function hash5(uint256[5] memory array) public pure returns (uint256) {
        return PoseidonT6.poseidon(array);
    }

    function hashLeftRight(uint256 _left, uint256 _right)
    public
    pure
    returns (uint256)
    {
        uint256[2] memory input;
        input[0] = _left;
        input[1] = _right;
        return hash2(input);
    }
}
