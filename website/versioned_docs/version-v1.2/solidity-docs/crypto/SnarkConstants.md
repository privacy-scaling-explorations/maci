# SnarkConstants

This contract contains constants related to the SNARK
components of MACI.

### SNARK_SCALAR_FIELD

```solidity
uint256 SNARK_SCALAR_FIELD
```

The scalar field

### PAD_PUBKEY_X

```solidity
uint256 PAD_PUBKEY_X
```

The public key here is the first Pedersen base
point from iden3's circomlib implementation of the Pedersen hash.
Since it is generated using a hash-to-curve function, we are
confident that no-one knows the private key associated with this
public key. See:
https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
Its hash should equal 6769006970205099520508948723718471724660867171122235270773600567925038008762.

### PAD_PUBKEY_Y

```solidity
uint256 PAD_PUBKEY_Y
```

### NOTHING_UP_MY_SLEEVE

```solidity
uint256 NOTHING_UP_MY_SLEEVE
```

The Keccack256 hash of 'Maci'
