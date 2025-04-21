import { generateKeypair, generatePrivateKey } from "@maci-protocol/crypto";
import { expect } from "chai";

import { Keypair, PrivateKey } from "..";

describe("keypair", function test() {
  this.timeout(900000);
  describe("constructor", () => {
    it("should generate a random keypair if not provided a private key", () => {
      const keypair1 = new Keypair();
      const keypair2 = new Keypair();

      expect(keypair1.equals(keypair2)).to.eq(false);

      expect(keypair1.privateKey.raw).not.to.eq(keypair2.privateKey.raw);
    });

    it("should always generate a valid keypair", () => {
      for (let i = 0; i < 100; i += 1) {
        expect(() => new Keypair()).to.not.throw();
      }
    });

    it("should generate the correct public key given a private key", () => {
      const rawKeypair = generateKeypair();
      const keypair = new Keypair(new PrivateKey(rawKeypair.privateKey));
      expect(rawKeypair.publicKey[0]).to.eq(keypair.publicKey.raw[0]);
      expect(rawKeypair.publicKey[1]).to.eq(keypair.publicKey.raw[1]);
    });
  });

  describe("equals", () => {
    it("should return false for two completely different keypairs", () => {
      const keypair1 = new Keypair();
      const keypair2 = new Keypair();
      expect(keypair1.equals(keypair2)).to.eq(false);
    });

    it("should return false for two keypairs with different private keys", () => {
      const privateKey = new PrivateKey(generatePrivateKey());
      const privateKey2 = new PrivateKey(generatePrivateKey());
      const keypair1 = new Keypair(privateKey);
      const keypair2 = new Keypair(privateKey2);
      expect(keypair1.equals(keypair2)).to.eq(false);
    });
    it("should throw when the private keys are equal but the public keys are not", () => {
      const privateKey = new PrivateKey(generatePrivateKey());
      const keypair1 = new Keypair(privateKey);
      const keypair2 = new Keypair(privateKey);
      keypair2.publicKey.raw[0] = BigInt(9);
      expect(() => keypair1.equals(keypair2)).to.throw();
    });
    it("should return true for two identical keypairs", () => {
      const keypair1 = new Keypair();
      const keypair2 = keypair1.copy();
      expect(keypair1.equals(keypair2)).to.eq(true);
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const keypair1 = new Keypair();

      // shallow copy
      const keypair2 = keypair1;

      expect(keypair1.privateKey.raw.toString()).to.eq(keypair2.privateKey.raw.toString());
      keypair1.privateKey.raw = BigInt(0);
      expect(keypair1.privateKey.raw.toString()).to.eq(keypair2.privateKey.raw.toString());

      // deep copy
      const k3 = new Keypair();
      const k4 = k3.copy();
      expect(k3.privateKey.raw.toString()).to.eq(k4.privateKey.raw.toString());

      k3.privateKey.raw = BigInt(0);
      expect(k3.privateKey.raw.toString()).not.to.eq(k4.privateKey.raw.toString());
    });
  });

  describe("generateEcdhSharedKey", () => {
    it("should produce a shared key", () => {
      const keypair1 = new Keypair();
      const keypair2 = new Keypair();
      const sharedKey = Keypair.generateEcdhSharedKey(keypair1.privateKey, keypair2.publicKey);
      expect(sharedKey).to.not.eq(null);
    });
  });

  describe("serialization/deserialization", () => {
    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const keypair1 = new Keypair();
        const json = keypair1.toJSON();
        expect(json).to.not.eq(null);
      });
      it("should produce a JSON object with the correct keys", () => {
        const keypair1 = new Keypair();
        const json = keypair1.toJSON();
        expect(Object.keys(json)).to.deep.eq(["privateKey", "publicKey"]);
      });
      it("should preserve the data correctly", () => {
        const keypair1 = new Keypair();
        const json = keypair1.toJSON();

        expect(keypair1.privateKey.serialize()).to.eq(json.privateKey);
        expect(keypair1.publicKey.serialize()).to.eq(json.publicKey);
      });
    });

    describe("fromJSON", () => {
      it("should produce a Keypair instance", () => {
        const keypair1 = new Keypair();
        const json = keypair1.toJSON();
        const keypair2 = Keypair.fromJSON(json);
        expect(keypair2).to.be.instanceOf(Keypair);
      });
      it("should preserve the data correctly", () => {
        const keypair1 = new Keypair();
        const json = keypair1.toJSON();
        const keypair2 = Keypair.fromJSON(json);
        expect(keypair1.equals(keypair2)).to.eq(true);
      });
    });
  });
});
