// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;
import { Pairing } from "./Pairing.sol";

contract SnarkCommon {
    struct VerifyingKey {
        Pairing.G1Point alpha1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] ic;
    }
}
