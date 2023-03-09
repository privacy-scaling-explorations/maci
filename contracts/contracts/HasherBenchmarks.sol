// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Hasher } from "./crypto/Hasher.sol";

contract HasherBenchmarks is Hasher {
    function hash5Benchmark(uint256[5] memory array) public pure {
        hash5(array);
    }

    function hashLeftRightBenchmark(uint256 _left, uint256 _right) public pure {
        hashLeftRight(_left, _right);
    }
}
