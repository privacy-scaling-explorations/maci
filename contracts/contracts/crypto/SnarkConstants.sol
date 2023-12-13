// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @title SnarkConstants
/// @notice This contract contains constants related to the SNARK
/// components of MACI.
contract SnarkConstants {
  /// @notice The scalar field
  uint256 internal constant SNARK_SCALAR_FIELD =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  /// @notice The public key here is the first Pedersen base
  /// point from iden3's circomlib implementation of the Pedersen hash.
  /// Since it is generated using a hash-to-curve function, we are
  /// confident that no-one knows the private key associated with this
  /// public key. See:
  /// https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
  /// Its hash should equal
  /// 6769006970205099520508948723718471724660867171122235270773600567925038008762.
  uint256 internal constant PAD_PUBKEY_X =
    10457101036533406547632367118273992217979173478358440826365724437999023779287;
  uint256 internal constant PAD_PUBKEY_Y =
    19824078218392094440610104313265183977899662750282163392862422243483260492317;

  /// @notice The Keccack256 hash of 'Maci'
  uint256 internal constant NOTHING_UP_MY_SLEEVE =
    8370432830353022751713833565135785980866757267633941821328460903436894336785;
}
