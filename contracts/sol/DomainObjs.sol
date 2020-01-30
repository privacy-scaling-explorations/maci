pragma experimental ABIEncoderV2;
pragma solidity ^0.5.0;

import { Hasher } from "./Hasher.sol";

contract DomainObjs is Hasher {
    struct PubKey {
        uint256 x;
        uint256 y;
    }

    struct StateLeaf {
        PubKey pubKey;
        uint256 voteOptionTreeRoot;
        uint256 voiceCreditBalance;
        uint256 nonce;
    }

    function hashStateLeaf(StateLeaf memory _stateLeaf) public pure returns (uint256) {
        uint256[] memory plaintext = new uint256[](5);
        plaintext[0] = _stateLeaf.pubKey.x;
        plaintext[1] = _stateLeaf.pubKey.y;
        plaintext[2] = _stateLeaf.voteOptionTreeRoot;
        plaintext[3] = _stateLeaf.voiceCreditBalance;
        plaintext[4] = _stateLeaf.nonce;

        return hashMulti(
            plaintext,
            0
        );
    }
}
