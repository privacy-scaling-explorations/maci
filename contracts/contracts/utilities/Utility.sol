// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import {DomainObjs, IPubKey, IMessage} from "../DomainObjs.sol";
import {Hasher} from "../crypto/Hasher.sol";
import {SnarkConstants} from "../crypto/SnarkConstants.sol";
import {Poll} from "../Poll.sol";


contract CommonUtilities {
     error VOTING_PERIOD_NOT_PASSED();
    // common function for MessageProcessor, Tally and Subsidy
    function _votingPeriodOver(Poll _poll) internal {
        (uint256 deployTime, uint256 duration) = _poll
            .getDeployTimeAndDuration();
        // Require that the voting period is over
        uint256 secondsPassed = block.timestamp - deployTime;
        if (secondsPassed <= duration ) {
            revert VOTING_PERIOD_NOT_PASSED();
        }
    }
}

contract Utilities is SnarkConstants, Hasher, IPubKey, IMessage {
    function padAndHashMessage(
        uint256[2] memory dataToPad, // we only need two for now
        uint256 msgType
    ) public pure returns (Message memory, PubKey memory, uint256) {
        uint256[10] memory dat;
        dat[0] = dataToPad[0];
        dat[1] = dataToPad[1];
        for(uint i = 2; i< 10;) {
            dat[i] = 0;
            unchecked {
                ++i;
            }
        }
        PubKey memory _padKey = PubKey(PAD_PUBKEY_X, PAD_PUBKEY_Y);
        Message memory _message = Message({msgType: msgType, data: dat});
        return (_message, _padKey, hashMessageAndEncPubKey(_message, _padKey));
    }

    function hashMessageAndEncPubKey(
        Message memory _message,
        PubKey memory _encPubKey
    ) public pure returns (uint256) {
        require(_message.data.length == 10, "Invalid message");
        uint256[5] memory n;
        n[0] = _message.data[0];
        n[1] = _message.data[1];
        n[2] = _message.data[2];
        n[3] = _message.data[3];
        n[4] = _message.data[4];

        uint256[5] memory m;
        m[0] = _message.data[5];
        m[1] = _message.data[6];
        m[2] = _message.data[7];
        m[3] = _message.data[8];
        m[4] = _message.data[9];

        return
            hash5(
                [
                    _message.msgType,
                    hash5(n),
                    hash5(m),
                    _encPubKey.x,
                    _encPubKey.y
                ]
            );
    }
}


