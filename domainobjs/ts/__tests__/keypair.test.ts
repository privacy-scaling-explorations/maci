import { expect } from "chai";
import { genKeypair, genPrivKey } from "maci-crypto";

import { Keypair, PrivKey } from "..";

describe("keypair", () => {
  describe("constructor", () => {
    it("should generate a random keypair if not provided a private key", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();

      expect(k1.equals(k2)).to.eq(false);

      expect(k1.privKey.rawPrivKey).not.to.eq(k2.privKey.rawPrivKey);
    });

    it("should generate the correct public key given a private key", () => {
      const rawKeyPair = genKeypair();
      const k = new Keypair(new PrivKey(rawKeyPair.privKey));
      expect(rawKeyPair.pubKey[0]).to.eq(k.pubKey.rawPubKey[0]);
      expect(rawKeyPair.pubKey[1]).to.eq(k.pubKey.rawPubKey[1]);
    });
  });

  describe("equals", () => {
    it("should return false for two completely different keypairs", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();
      expect(k1.equals(k2)).to.eq(false);
    });

    it("should return false for two keypairs with different private keys", () => {
      const privateKey = new PrivKey(genPrivKey());
      const privateKey2 = new PrivKey(genPrivKey());
      const k1 = new Keypair(privateKey);
      const k2 = new Keypair(privateKey2);
      expect(k1.equals(k2)).to.eq(false);
    });
    it("should throw when the private keys are equal but the public keys are not", () => {
      const privateKey = new PrivKey(genPrivKey());
      const k1 = new Keypair(privateKey);
      const k2 = new Keypair(privateKey);
      k2.pubKey.rawPubKey[0] = BigInt(9);
      expect(() => k1.equals(k2)).to.throw();
    });
    it("should return true for two identical keypairs", () => {
      const k1 = new Keypair();
      const k2 = k1.copy();
      expect(k1.equals(k2)).to.eq(true);
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const k1 = new Keypair();

      // shallow copy
      const k2 = k1;

      expect(k1.privKey.rawPrivKey.toString()).to.eq(k2.privKey.rawPrivKey.toString());
      k1.privKey.rawPrivKey = BigInt(0);
      expect(k1.privKey.rawPrivKey.toString()).to.eq(k2.privKey.rawPrivKey.toString());

      // deep copy
      const k3 = new Keypair();
      const k4 = k3.copy();
      expect(k3.privKey.rawPrivKey.toString()).to.eq(k4.privKey.rawPrivKey.toString());

      k3.privKey.rawPrivKey = BigInt(0);
      expect(k3.privKey.rawPrivKey.toString()).not.to.eq(k4.privKey.rawPrivKey.toString());
    });
  });

  describe("genEcdhSharedKey", () => {
    it("should produce a shared key", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(k1.privKey, k2.pubKey);
      expect(sharedKey).to.not.eq(null);
    });
  });

  describe("serialization/deserialization", () => {
    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();
        expect(json).to.not.eq(null);
      });
      it("should produce a JSON object with the correct keys", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();
        expect(Object.keys(json)).to.deep.eq(["privKey", "pubKey"]);
      });
      it("should preserve the data correctly", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();

        expect(k1.privKey.serialize()).to.eq(json.privKey);
        expect(k1.pubKey.serialize()).to.eq(json.pubKey);
      });
    });

    describe("fromJSON", () => {
      it("should produce a Keypair instance", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();
        const k2 = Keypair.fromJSON(json);
        expect(k2).to.be.instanceOf(Keypair);
      });
      it("should preserve the data correctly", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();
        const k2 = Keypair.fromJSON(json);
        expect(k1.equals(k2)).to.eq(true);
      });
    });
  });
});
