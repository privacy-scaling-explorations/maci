// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { DomainObjs } from "./DomainObjs.sol";
import { Hasher } from "../crypto/Hasher.sol";
import { SnarkConstants } from "../crypto/SnarkConstants.sol";

/// @title Utilities
/// @notice An utility contract that can be used to:
/// * hash a state leaf
/// * pad and hash a MACI message
/// * hash a MACI message and an encryption public key
contract Utilities is SnarkConstants, DomainObjs, Hasher {
  /// @notice custom errors
  error InvalidMessage();

  /// @notice An utility function used to hash a state leaf
  /// @param _stateLeaf the state leaf to be hashed
  /// @return ciphertext The hash of the state leaf
  function hashStateLeaf(StateLeaf memory _stateLeaf) public pure returns (uint256 ciphertext) {
    uint256[3] memory plaintext;
    plaintext[0] = _stateLeaf.publicKey.x;
    plaintext[1] = _stateLeaf.publicKey.y;
    plaintext[2] = _stateLeaf.voiceCreditBalance;

    ciphertext = hash3(plaintext);
  }

  /// @notice An utility function used to pad and hash a MACI message
  /// @param dataToPad the data to be padded
  /// @return message The padded message
  /// @return padKey The padding public key
  /// @return msgHash The hash of the padded message and encryption key
  function padAndHashMessage(
    uint256[2] memory dataToPad
  ) public pure returns (Message memory message, PublicKey memory padKey, uint256 msgHash) {
    // add data and pad it to 10 elements (automatically cause it's the default value)
    uint256[10] memory dat;
    dat[0] = dataToPad[0];
    dat[1] = dataToPad[1];

    padKey = PublicKey(PAD_PUBLIC_KEY_X, PAD_PUBLIC_KEY_Y);
    message = Message({ data: dat });
    msgHash = hashMessageAndPublicKey(message, padKey);
  }

  /// @notice An utility function used to hash a MACI message and an encryption public key
  /// @param _message the message to be hashed
  /// @param _encryptionPublicKey the encryption public key to be hashed
  /// @return msgHash The hash of the message and the encryption public key
  function hashMessageAndPublicKey(
    Message memory _message,
    PublicKey memory _encryptionPublicKey
  ) public pure returns (uint256 msgHash) {
    if (_message.data.length != 10) {
      revert InvalidMessage();
    }

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

    msgHash = hash4([hash5(n), hash5(m), _encryptionPublicKey.x, _encryptionPublicKey.y]);
  }
}
