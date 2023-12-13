// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import { DomainObjs } from "./DomainObjs.sol";
import { Hasher } from "../crypto/Hasher.sol";
import { SnarkConstants } from "../crypto/SnarkConstants.sol";
import { Poll } from "../Poll.sol";

/// @title CommonUtilities
/// @notice A contract that holds common utilities
/// which are to be used by multiple contracts
/// namely Subsidy, Tally and MessageProcessor
contract CommonUtilities {
  error VOTING_PERIOD_NOT_PASSED();

  /// @notice common function for MessageProcessor, Tally and Subsidy
  /// @param _poll the poll to be checked
  function _votingPeriodOver(Poll _poll) internal view {
    (uint256 deployTime, uint256 duration) = _poll.getDeployTimeAndDuration();
    // Require that the voting period is over
    uint256 secondsPassed = block.timestamp - deployTime;
    if (secondsPassed <= duration) {
      revert VOTING_PERIOD_NOT_PASSED();
    }
  }
}

/// @title Utilities
/// @notice An utility contract that can be used to:
/// * hash a state leaf
/// * pad and hash a MACI message
/// * hash a MACI message and an encryption public key
contract Utilities is SnarkConstants, DomainObjs, Hasher {
  /// @notice An utility function used to hash a state leaf
  /// @param _stateLeaf the state leaf to be hashed
  /// @return ciphertext The hash of the state leaf
  function hashStateLeaf(StateLeaf memory _stateLeaf) public pure returns (uint256 ciphertext) {
    uint256[4] memory plaintext;
    plaintext[0] = _stateLeaf.pubKey.x;
    plaintext[1] = _stateLeaf.pubKey.y;
    plaintext[2] = _stateLeaf.voiceCreditBalance;
    plaintext[3] = _stateLeaf.timestamp;

    ciphertext = hash4(plaintext);
  }

  /// @notice An utility function used to pad and hash a MACI message
  /// @param dataToPad the data to be padded
  /// @param msgType the type of the message
  /// @return message The padded message
  /// @return padKey The padding public key
  /// @return msgHash The hash of the padded message and encryption key
  function padAndHashMessage(
    uint256[2] memory dataToPad,
    uint256 msgType
  ) public pure returns (Message memory message, PubKey memory padKey, uint256 msgHash) {
    uint256[10] memory dat;
    dat[0] = dataToPad[0];
    dat[1] = dataToPad[1];
    for (uint i = 2; i < 10; ) {
      dat[i] = 0;
      unchecked {
        ++i;
      }
    }
    padKey = PubKey(PAD_PUBKEY_X, PAD_PUBKEY_Y);
    message = Message({ msgType: msgType, data: dat });
    msgHash = hashMessageAndEncPubKey(message, padKey);
  }

  /// @notice An utility function used to hash a MACI message and an encryption public key
  /// @param _message the message to be hashed
  /// @param _encPubKey the encryption public key to be hashed
  /// @return msgHash The hash of the message and the encryption public key
  function hashMessageAndEncPubKey(
    Message memory _message,
    PubKey memory _encPubKey
  ) public pure returns (uint256 msgHash) {
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

    msgHash = hash5([_message.msgType, hash5(n), hash5(m), _encPubKey.x, _encPubKey.y]);
  }
}
