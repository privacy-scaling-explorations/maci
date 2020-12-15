// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

interface IMACI {
    function getStateRootSnapshot(uint256 _timestamp)
        external
        view
        returns (uint256);
}
