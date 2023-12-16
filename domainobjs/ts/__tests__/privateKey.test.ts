import { expect } from "chai";
import { SNARK_FIELD_SIZE, genRandomBabyJubValue } from "maci-crypto";

import { Keypair, PrivKey } from "..";

describe("privateKey", function test() {
  this.timeout(90000);

  describe("constructor", () => {
    it("should create a private key", () => {
      const priv = genRandomBabyJubValue();
      const k = new PrivKey(priv);
      expect(k).to.not.eq(null);
    });
    it("should create the same private key object for the same raw key", () => {
      const priv = genRandomBabyJubValue();
      const k1 = new PrivKey(priv);
      const k2 = new PrivKey(priv);
      expect(k1.rawPrivKey.toString()).to.eq(k2.rawPrivKey.toString());
    });
  });

  describe("serialization", () => {
    describe("serialize", () => {
      it("should serialize the private key", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const s = k.serialize();
        expect(s.startsWith("macisk.")).to.eq(true);
        const d = `0x${s.slice(7)}`;
        expect(priv.toString()).to.eq(BigInt(d).toString());
      });

      it("should always return a key with the same length", () => {
        for (let i = 0; i < 100; i += 1) {
          const k = new Keypair();
          const s = k.privKey.serialize();
          expect(s.length).to.eq(71);
        }
      });
    });

    describe("deserialize", () => {
      it("should deserialize the private key", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const s = k.serialize();
        const k2 = PrivKey.deserialize(s);
        expect(k.rawPrivKey.toString()).to.eq(k2.rawPrivKey.toString());
      });
    });

    describe("isValidSerializedPrivKey", () => {
      it("should return true for a valid serialized private key", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const s = k.serialize();
        expect(PrivKey.isValidSerializedPrivKey(s)).to.eq(true);
      });
      it("should return false for an invalid serialized private key", () => {
        const s = "macisk.0x1234567890";
        expect(PrivKey.isValidSerializedPrivKey(s)).to.eq(false);
      });
    });

    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const json = k.toJSON();
        expect(json).to.not.eq(null);
      });
      it("should produce a JSON object with the correct keys", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const json = k.toJSON();
        expect(Object.keys(json)).to.deep.eq(["privKey"]);
      });
      it("should preserve the data correctly", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const json = k.toJSON();
        expect(k.serialize()).to.eq(json.privKey);
      });
    });

    describe("fromJSON", () => {
      it("should produce a PrivKey instance", () => {
        const priv = genRandomBabyJubValue();
        const k = new PrivKey(priv);
        const json = k.toJSON();
        const k2 = PrivKey.fromJSON(json);
        expect(k2).to.be.instanceOf(PrivKey);
      });
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const k = new Keypair();
      const sk1 = k.privKey;

      // shallow copy
      const sk2 = sk1;

      expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());
      sk1.rawPrivKey = BigInt(0);
      expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());

      // deep copy
      const k1 = new Keypair();
      const sk3 = k1.privKey;
      const sk4 = sk3.copy();
      expect(sk3.rawPrivKey.toString()).to.eq(sk4.rawPrivKey.toString());
      sk4.rawPrivKey = BigInt(0);
      expect(sk3.rawPrivKey.toString()).not.to.eq(sk4.rawPrivKey.toString());
    });
  });

  describe("asCircuitInputs", () => {
    it("should generate a value that is < SNARK_FIELD_SIZE", () => {
      const k = new Keypair();
      const sk = k.privKey;
      const circuitInputs = sk.asCircuitInputs();
      expect(BigInt(circuitInputs) < SNARK_FIELD_SIZE).to.eq(true);
    });
  });
});
