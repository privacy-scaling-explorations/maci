// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;
import { Hasher } from "./crypto/Hasher.sol";

contract DomainObjs is Hasher {

    uint8 constant MESSAGE_DATA_LENGTH = 11;

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

    /*
       Data fields:

       0. state index
       1. new pubkey X
       2. new pubkey Y
       3. vote option index
       4. new vote weight
       5. nonce
       6. salt
       7. pollId
       9. sig.R8[0]
       9. sig.R8[1]
       10. sig.S
    */

    struct Message {
        uint256 iv;
        uint256[MESSAGE_DATA_LENGTH] data;
    }

    function hashMessage(Message memory _message) public pure returns (uint256) {
        uint256[] memory plaintext = new uint256[](MESSAGE_DATA_LENGTH + 1);

        plaintext[0] = _message.iv;

        for (uint8 i=0; i < MESSAGE_DATA_LENGTH; i++) {
            plaintext[i+1] = _message.data[i];
        }

        return hash12(plaintext);
    }
}
