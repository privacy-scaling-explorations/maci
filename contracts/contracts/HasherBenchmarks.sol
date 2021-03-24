// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import { Hasher } from "./crypto/Hasher.sol";

contract HasherBenchmarks is Hasher {
    function hash5Benchmark(uint256[5] memory array) public {
        hash5(array);
    }

    function hashLeftRightBenchmark(uint256 _left, uint256 _right) public {
        hashLeftRight(_left, _right);
    }
}
