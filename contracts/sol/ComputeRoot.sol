pragma solidity ^0.5.0;

import { SnarkConstants } from "./SnarkConstants.sol";
import { MiMC } from "./MiMC.sol";
import { Hasher } from "./Hasher.sol";

contract ComputeRoot is Hasher {

    function computeEmptyRoot(uint8 _treeLevels, uint256 _zeroValue) public pure returns (uint256) {
        // Limit the Merkle tree to MAX_DEPTH levels
        require(
            _treeLevels > 0 && _treeLevels <= 32,
            "ComputeRoot: _treeLevels must be between 0 and 33"
        );
        uint256[32] memory z;
        z[0] = _zeroValue;

        uint256 currentZero = _zeroValue;
        for (uint8 i = 1; i < _treeLevels; i++) {
            uint256 hashed = hashLeftRight(currentZero, currentZero);
            z[i] = hashed;
            currentZero = hashed;
        }

        return hashLeftRight(currentZero, currentZero);
    }

    function computeRoot(uint8 _treeLevels, uint256[] memory _leaves) public pure returns (uint256) {
        require(
            _leaves.length == 2 ** uint256(_treeLevels),
            "ComputeRoot: the number of leaves must equal 2 ^ _treeLevels"
        );

        uint256 numLeafHashers = _leaves.length / 2;
        uint256 numIntermediateHashers = numLeafHashers - 1;
        uint256[32] memory cache;

        for (uint256 i = 0; i < numLeafHashers; i ++) {
            cache[i] = hashLeftRight(_leaves[i * 2], _leaves[i * 2 + 1]);
        }

        uint256 j = numLeafHashers;
        uint256 k = 0;
        for (; j < numLeafHashers + numIntermediateHashers; j ++) {
            cache[j] = hashLeftRight(cache[k * 2], cache[k * 2 + 1]);
            k++;
        }

        return cache[j - 1];
    }
}
