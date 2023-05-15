# Anonymity in MACI

## Introduction
In basic MACI protocol, a coordinator is the only point in the system which can decrypt all votes and connect voters to their votes. If the coordinator is corrupted, revealing the votes to mallicious participants can endanger the voters and defeat the purpose of the encryption and key deactivation to avoid blackmailing. This modification of the protocol is based on the proposal by Kobi Gurkan in the post [MACI anonymization - using rerandomizable encryption](https://ethresear.ch/t/maci-anonymization-using-rerandomizable-encryption/7054). We utilize El Gamal encryption along with the rerandomization to enable key deactivation and generation of the new keys without visible connection to the previously deactivated key. Using this protocol upgrade, a full anonymity of the voters and their votes is obtained. Before getting into details of the implementation, we will first introduce some of the basic concepts.

### El Gamal encryption
In 1985, Taher Elgamal created an asymmetric cryptographic algorithm based on the Diffie-Hellman key exchange. Similar to the ECDH algorithm, the security of ElGamal is based on the difficult or practically unfeasable computation of the discrete logarithm.

Let $G$ be a generator point on the elliptic curve over a finite field $F_p$ (where $p$ is a a large prime number). Let $pr_A$ and $pr_B$ be the private keys of participants $A$ and $B$. Then $pub_A = a * G$ and $pub_B = b * G$ are their respective public keys. Let person $A$ be the participant who will encrypt the data fot the participant B. Participant $A$ performs to following algorithm:

1) choose an arbitrary $k$ from the interval $(1,p)$;

2) calculate $c_1: = y * G$;

3) assigns a point on the elliptic curve $M$ to the message $m$, where the participant $A$ chooses $y$ so that the point $M$ is a point on the elliptic curve;

4) calculate $c_2 := M + pub_B * y$;

5) send $c_1$ and $c_2$ to participant $B$.

Person $B$ needs to decrypt the data. For this purpose, person $B$ should do the following:

1) calculate $pub_B * y = pr_B * G * y = pr_B * c_1$;

2) decrypts the message $M = c_2 + (pub_B * y)^{-1}~$;

### Re-randomization

We usually use re-randomization when we want to convey the same message, but two cipher texts cannot be connected to each other. That function randomizes an existing cipher text such that it’s still decryptable using the original key for which it was encrypted.

Following the notation introduced in the previous section on El Gamal algorithm, we want the input parameters to be $c_1$ and $c_2$ and the output parameters to be $c_1'$ and $c_2'$ to hide the same message.

For this purpose, participant $A$ performs the following algorithm:

1) choose an arbitrary $z$ from the interval $(1,p)$;

2) calculate $c_1' :=z * G + c_1$;

3) calculate $c_2' := c_2 + pub_B * z$;

5) output $c_1'$ and $c_2'$.


### Nullifier

The nullifier is a unique value that represents a commitment for the performed action, ensuring that the action can be performed only once. It can be seen as a receipt for the transaction, standing as a proof of payment to prevent double spending.


## Protocol modifications
The original MACI protocol allows the voter to vote and change the public key in one transaction. The problem can be found in a fact that the coordinator can internaly track key changes and still obtain the information on how each participant has voted. In order to achieve full anonymity, it is necessary to modify the existing protocol by obscuring the link between the deactivated and newly generated keys. The goal can be achieved by utilizing ElGamal encryption and rerandomization of the ciphertext, combined with new zero knowledge inclusion proofs and nullifiers.

### Key deactivation
The key deactivation can be performed as an action which adds a public key to a deactivated keys set The set of deactivated keys is public, and kept on the smart contract. The user sends a message for key deactivation to the smart contract, signed using the key that will be deactivated. The coordinator verifies the message and checks if the key has already been deactivated. If the key can be deactivated, the coordinator's output is a message bit 1, or 0 otherwise. The coordinator encrypts the status of the verification using ElGamal encryption, and adds the key, along the status to the set of deactivated keys.

Deactivation of the old key in this manner requires addition of a new message type (type 3).

### New key generation
User generates a new key, based on the old deactivated key, by providing new public key and the proof of inclusion of the old public key in the set of deactivated keys, creating an obscured but provable relation with some of the deactivated keys. To prevent the double-spending, the user provides a nullifier. A nullifier is a hash of the old private key and creates a unique connection between the deactivation of the old key and generation of the new one. As the connection with the old key still has to be obscured, but provably correct, the ZK proof of inclusion of the old public key, with its status, in deactivated keys set has to be extended to testify that the hashed value behind the nullifier is indeed the private key of the deactivated key. Proving that the status is correct but without disclosing which encrypted value matches the status is achieved using rerandomization of the ciphertext. The set of all nullifiers is privately controlled by the coordinator.

To support this method for generating new keys, a new message type has to be defined (type 4).