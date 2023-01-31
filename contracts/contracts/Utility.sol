// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import {DomainObjs, IPubKey, IMessage} from "./DomainObjs.sol";
import {Hasher} from "./crypto/Hasher.sol";
import {SnarkConstants} from "./crypto/SnarkConstants.sol";


contract CommonUtilities is SnarkConstants {
     /*
     * Hashes an array of values using SHA256 and returns its modulo with the
     * snark scalar field. This function is used to hash inputs to circuits,
     * where said inputs would otherwise be public inputs. As such, the only
     * public input to the circuit is the SHA256 hash, and all others are
     * private inputs. The circuit will verify that the hash is valid. Doing so
     * saves a lot of gas during verification, though it makes the circuit take
     * up more constraints.
     */
    function sha256Hash(uint256[] memory array) public pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(array))) % SNARK_SCALAR_FIELD;
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


