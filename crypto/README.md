# maci-crypto

This module implements abstractions over cryptographic functions which MACI
employs.

## Types and interfaces

**`PrivKey`**: A private key.

**`PubKey`**: A public key.

**`EcdhSharedKey`**: An Elliptic-curve Diffie–Hellman shared key.

**`Plaintext`**: An array of unencrypted values.

**`Ciphertext`**: Encrypted `Plaintext`. This data structure abstracts over the
initialisation vector and encrypted data.

**`Signature`**: A signature. This data structure abstracts over the`R8` and
`S` values.

## Functions

**`genPrivKey: PrivKey`**

Returns a securely random private key.

**`genPubKey = (privKey: PrivKey): PubKey `**

Generates the public key associated with the given private key.

**`genEcdhSharedKey = (privKey: PrivKey, pubKey: PubKey): EcdhSharedKey`**

Generates an ECDH shared key.

**`encrypt = (plaintext: Plaintext, sharedKey: EcdhSharedKey): Ciphertext`**

Encrypts the plaintext with the given key and returns the
associated ciphertext.

**`decrypt = (ciphertext: Ciphertext, sharedKey: EcdhSharedKey): Plaintext`**

Decrypts the ciphertext using the given key.

**`sign = (privKey: PrivKey, message: Plaintext): Signature`**

Produces a signature of the given message using the private key.

**`verifySignature = (message: Plaintext, signature: Signature, publicKey: PubKey): boolean`**

Checks whether the given signature is valid.
