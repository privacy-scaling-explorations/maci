// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;
import { Hasher } from "./crypto/Hasher.sol";

contract DomainObjs is Hasher {

    uint8 constant MESSAGE_DATA_LENGTH = 7;

    struct PubKey {
        uint256 x;
        uint256 y;
    }

    struct StateLeaf {
        PubKey pubKey;
        uint256 voiceCreditBalance;
    }

    function hashStateLeaf(StateLeaf memory _stateLeaf) public pure returns (uint256) {
        uint256[] memory plaintext = new uint256[](3);
        plaintext[0] = _stateLeaf.pubKey.x;
        plaintext[1] = _stateLeaf.pubKey.y;
        plaintext[2] = _stateLeaf.voiceCreditBalance;

        return hash3(plaintext);
    }

    struct Message {
        uint256 iv;
        uint256[MESSAGE_DATA_LENGTH] data;
    }

    function hashMessage(Message memory _message) public pure returns (uint256) {
        uint256[] memory n = new uint256[](5);
        n[0] = _message.iv;
        n[1] = _message.data[0];
        n[2] = _message.data[1];
        n[3] = _message.data[2];
        n[4] = _message.data[3];

        uint256[] memory m = new uint256[](4);
        m[0] = hash5(n);
        m[1] = _message.data[4];
        m[2] = _message.data[5];
        m[3] = _message.data[6];

        return hash4(m);
    }
}
