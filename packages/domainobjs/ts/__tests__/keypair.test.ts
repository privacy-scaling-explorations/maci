import { genKeypair, genPrivKey } from "@maci-protocol/crypto";
import { expect } from "chai";

import { Keypair, PrivateKey } from "..";

describe("keypair", function test() {
  this.timeout(900000);
  describe("constructor", () => {
    it("should generate a random keypair if not provided a private key", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();

      expect(k1.equals(k2)).to.eq(false);

      expect(k1.privateKey.rawPrivKey).not.to.eq(k2.privateKey.rawPrivKey);
    });

    it("should always generate a valid keypair", () => {
      for (let i = 0; i < 100; i += 1) {
        expect(() => new Keypair()).to.not.throw();
      }
    });

    it("should generate the correct public key given a private key", () => {
      const rawKeyPair = genKeypair();
      const k = new Keypair(new PrivateKey(rawKeyPair.privateKey));
      expect(rawKeyPair.publicKey[0]).to.eq(k.publicKey.rawPubKey[0]);
      expect(rawKeyPair.publicKey[1]).to.eq(k.publicKey.rawPubKey[1]);
    });
  });

  describe("equals", () => {
    it("should return false for two completely different keypairs", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();
      expect(k1.equals(k2)).to.eq(false);
    });

    it("should return false for two keypairs with different private keys", () => {
      const privateKey = new PrivateKey(genPrivKey());
      const privateKey2 = new PrivateKey(genPrivKey());
      const k1 = new Keypair(privateKey);
      const k2 = new Keypair(privateKey2);
      expect(k1.equals(k2)).to.eq(false);
    });
    it("should throw when the private keys are equal but the public keys are not", () => {
      const privateKey = new PrivateKey(genPrivKey());
      const k1 = new Keypair(privateKey);
      const k2 = new Keypair(privateKey);
      k2.publicKey.rawPubKey[0] = BigInt(9);
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

      expect(k1.privateKey.rawPrivKey.toString()).to.eq(k2.privateKey.rawPrivKey.toString());
      k1.privateKey.rawPrivKey = BigInt(0);
      expect(k1.privateKey.rawPrivKey.toString()).to.eq(k2.privateKey.rawPrivKey.toString());

      // deep copy
      const k3 = new Keypair();
      const k4 = k3.copy();
      expect(k3.privateKey.rawPrivKey.toString()).to.eq(k4.privateKey.rawPrivKey.toString());

      k3.privateKey.rawPrivKey = BigInt(0);
      expect(k3.privateKey.rawPrivKey.toString()).not.to.eq(k4.privateKey.rawPrivKey.toString());
    });
  });

  describe("genEcdhSharedKey", () => {
    it("should produce a shared key", () => {
      const k1 = new Keypair();
      const k2 = new Keypair();
      const sharedKey = Keypair.genEcdhSharedKey(k1.privateKey, k2.publicKey);
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
        expect(Object.keys(json)).to.deep.eq(["privateKey", "publicKey"]);
      });
      it("should preserve the data correctly", () => {
        const k1 = new Keypair();
        const json = k1.toJSON();

        expect(k1.privateKey.serialize()).to.eq(json.privateKey);
        expect(k1.publicKey.serialize()).to.eq(json.publicKey);
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
