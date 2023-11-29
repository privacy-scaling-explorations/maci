import { Keypair, PrivKey } from "../";
import { genKeypair } from "maci-crypto";
import { expect } from "chai";

describe("keypair", () => {
    it("the Keypair constructor should generate a random keypair if not provided a private key", () => {
        const k1 = new Keypair();
        const k2 = new Keypair();

        expect(k1.equals(k2)).to.be.false;

        expect(k1.privKey.rawPrivKey).not.to.eq(k2.privKey.rawPrivKey);
    });

    it("the Keypair constructor should generate the correct public key given a private key", () => {
        const rawKeyPair = genKeypair();
        const k = new Keypair(new PrivKey(rawKeyPair.privKey));
        expect(rawKeyPair.pubKey[0]).to.eq(k.pubKey.rawPubKey[0]);
        expect(rawKeyPair.pubKey[1]).to.eq(k.pubKey.rawPubKey[1]);
    });

    it("should return false for two completely different keypairs", () => {
        const k1 = new Keypair();
        const k2 = new Keypair();
        expect(k1.equals(k2)).to.be.false;
    });

    it("should return false for two keypairs with different private keys", () => {
        const k1 = new Keypair();
        const k2 = new Keypair();
        k2.privKey.rawPrivKey = BigInt(0);
        expect(k1.equals(k2)).to.be.false;
    });
    it("should return false for two keypairs with different public keys", () => {
        const k1 = new Keypair();
        const k2 = new Keypair();
        k2.pubKey.rawPubKey[0] = BigInt(0);
        expect(k1.equals(k2)).to.be.false;
    });

    it("should return true for two identical keypairs", () => {
        const k1 = new Keypair();
        const k2 = k1.copy();
        expect(k1.equals(k2)).to.be.true;
    });
});
