import { mulPointEscalar } from "@zk-kit/baby-jubjub";
import { derivePublicKey, deriveSecretScalar, packPublicKey, unpackPublicKey } from "@zk-kit/eddsa-poseidon";

import assert from "assert";

import { genRandomBabyJubValue } from "./babyjub";
import { SNARK_FIELD_SIZE } from "./constants";
import { EcdhSharedKey, Keypair, Point, PrivKey, PubKey } from "./types";

/**
 * Generate a private key
 * @returns A BabyJub-compatible private key.
 */
export const genPrivKey = (): bigint => genRandomBabyJubValue();

/**
 * Generate a random value
 * @returns A BabyJub-compatible salt.
 */
export const genRandomSalt = (): bigint => genRandomBabyJubValue();

/**
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PubKey and other circuits.
 * @param privKey A private key generated using genPrivKey()
 * @returns A BabyJub-compatible private key.
 */
export const formatPrivKeyForBabyJub = (privKey: PrivKey): bigint => BigInt(deriveSecretScalar(privKey));

/**
 * Losslessly reduces the size of the representation of a public key
 * @param pubKey The public key to pack
 * @returns A packed public key
 */
export const packPubKey = (pubKey: PubKey): bigint => BigInt(packPublicKey(pubKey));

/**
 * Restores the original PubKey from its packed representation
 * @param packed The value to unpack
 * @returns The unpacked public key
 */
export const unpackPubKey = (packed: bigint): PubKey => {
  const pubKey = unpackPublicKey(packed);
  return pubKey.map((x: string) => BigInt(x)) as PubKey;
};

/**
 * @param privKey A private key generated using genPrivKey()
 * @returns A public key associated with the private key
 */
export const genPubKey = (privKey: PrivKey): PubKey => {
  // Check whether privKey is a field element
  assert(BigInt(privKey) < SNARK_FIELD_SIZE);

  const key = derivePublicKey(privKey);
  return [BigInt(key[0]), BigInt(key[1])];
};

/**
 * Generates a keypair.
 * @returns a keypair
 */
export const genKeypair = (): Keypair => {
  const privKey = genPrivKey();
  const pubKey = genPubKey(privKey);

  const keypair: Keypair = { privKey, pubKey };

  return keypair;
};

/**
 * Generates an Elliptic-Curve Diffie–Hellman (ECDH) shared key given a private
 * key and a public key.
 * @param privKey A private key generated using genPrivKey()
 * @param pubKey A public key generated using genPubKey()
 * @returns The ECDH shared key.
 */
export const genEcdhSharedKey = (privKey: PrivKey, pubKey: PubKey): EcdhSharedKey =>
  mulPointEscalar(pubKey as Point<bigint>, formatPrivKeyForBabyJub(privKey));
