// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;
import { Hasher } from "./crypto/Hasher.sol";

contract IPubKey {
    struct PubKey {
        uint256 x;
        uint256 y;
    }
}

contract IMessage {
    uint8 constant MESSAGE_DATA_LENGTH = 7;

    struct Message {
        uint256 iv;
        uint256[MESSAGE_DATA_LENGTH] data;
    }
}

contract DomainObjs is IMessage, Hasher, IPubKey {
    struct StateLeaf {
        PubKey pubKey;
        uint256 voiceCreditBalance;
    }

    function hashStateLeaf(StateLeaf memory _stateLeaf) public pure returns (uint256) {
        uint256[3] memory plaintext;
        plaintext[0] = _stateLeaf.pubKey.x;
        plaintext[1] = _stateLeaf.pubKey.y;
        plaintext[2] = _stateLeaf.voiceCreditBalance;

        return hash3(plaintext);
    }
}
