import { SNARK_FIELD_SIZE, generatePrivateKey } from "@maci-protocol/crypto";
import { expect } from "chai";

import { Keypair, PrivateKey } from "..";

describe("privateKey", function test() {
  this.timeout(90000);

  describe("constructor", () => {
    it("should create a private key", () => {
      const privateKey = generatePrivateKey();
      const key = new PrivateKey(privateKey);
      expect(key).to.not.eq(null);
    });
    it("should create the same private key object for the same raw key", () => {
      const privateKey = generatePrivateKey();
      const key1 = new PrivateKey(privateKey);
      const key2 = new PrivateKey(privateKey);
      expect(key1.raw.toString()).to.eq(key2.raw.toString());
    });
  });

  describe("serialization", () => {
    describe("serialize", () => {
      it("should serialize the private key", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const serializedKey = key.serialize();
        expect(serializedKey.startsWith("macisk.")).to.eq(true);

        const body = `0x${serializedKey.slice(7)}`;
        expect(privateKey.toString()).to.eq(BigInt(body).toString());
      });

      it("should always return a key with the same length", () => {
        for (let i = 0; i < 100; i += 1) {
          const keypair = new Keypair();
          const serialized = keypair.privateKey.serialize();

          expect(serialized.length).to.eq(71);
        }
      });
    });

    describe("deserialize", () => {
      it("should deserialize the private key", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const serialized = key.serialize();
        const key2 = PrivateKey.deserialize(serialized);
        expect(key.raw.toString()).to.eq(key2.raw.toString());
      });
    });

    describe("isValidSerialized", () => {
      it("should return true for a valid serialized private key", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const serialized = key.serialize();

        expect(PrivateKey.isValidSerialized(serialized)).to.eq(true);
      });

      it("should return false for an invalid serialized private key", () => {
        const s = "macisk.0x1234567890";
        expect(PrivateKey.isValidSerialized(s)).to.eq(false);
      });
    });

    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const json = key.toJSON();
        expect(json).to.not.eq(null);
      });

      it("should produce a JSON object with the correct keys", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const json = key.toJSON();
        expect(Object.keys(json)).to.deep.eq(["privateKey"]);
      });

      it("should preserve the data correctly", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const json = key.toJSON();
        expect(key.serialize()).to.eq(json.privateKey);
      });
    });

    describe("fromJSON", () => {
      it("should produce a PrivateKey instance", () => {
        const privateKey = generatePrivateKey();
        const key = new PrivateKey(privateKey);
        const json = key.toJSON();
        const key2 = PrivateKey.fromJSON(json);
        expect(key2).to.be.instanceOf(PrivateKey);
      });
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const keypair = new Keypair();
      const secretKey1 = keypair.privateKey;

      // shallow copy
      const secretKey2 = secretKey1;

      expect(secretKey1.raw.toString()).to.eq(secretKey2.raw.toString());
      secretKey1.raw = BigInt(0);
      expect(secretKey1.raw.toString()).to.eq(secretKey2.raw.toString());

      // deep copy
      const keypair1 = new Keypair();
      const secretKey3 = keypair1.privateKey;
      const secretKey4 = secretKey3.copy();
      expect(secretKey3.raw.toString()).to.eq(secretKey4.raw.toString());
      secretKey4.raw = BigInt(0);
      expect(secretKey3.raw.toString()).not.to.eq(secretKey4.raw.toString());
    });
  });

  describe("asCircuitInputs", () => {
    it("should generate a value that is < SNARK_FIELD_SIZE", () => {
      const keypair = new Keypair();
      const secretKey = keypair.privateKey;
      const circuitInputs = secretKey.asCircuitInputs();
      expect(BigInt(circuitInputs) < SNARK_FIELD_SIZE).to.eq(true);
    });
  });
});
