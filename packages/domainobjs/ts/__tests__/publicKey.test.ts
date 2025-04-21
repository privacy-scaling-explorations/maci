import { SNARK_FIELD_SIZE, unpackPublicKey } from "@maci-protocol/crypto";
import { expect } from "chai";

import { Keypair, PublicKey } from "..";

describe("public key", () => {
  describe("constructor", () => {
    it("should create a public key", () => {
      const keypair = new Keypair();
      const publicKey = new PublicKey(keypair.publicKey.raw);
      expect(publicKey).to.not.eq(null);
    });

    it("should create the same public key object for the same raw key", () => {
      const keypair = new Keypair();
      const publicKey1 = new PublicKey(keypair.publicKey.raw);
      const publicKey2 = new PublicKey(keypair.publicKey.raw);
      expect(publicKey1.raw.toString()).to.eq(publicKey2.raw.toString());
    });

    it("should fail to create a public key if the raw key is invalid", () => {
      expect(() => new PublicKey([BigInt(0), BigInt(SNARK_FIELD_SIZE)])).to.throw();
      expect(() => new PublicKey([BigInt(SNARK_FIELD_SIZE), BigInt(0)])).to.throw();
      expect(() => new PublicKey([BigInt(SNARK_FIELD_SIZE), BigInt(SNARK_FIELD_SIZE)])).to.throw();
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const keypair = new Keypair();
      const publicKey1 = keypair.publicKey;

      // shallow copy
      const publicKey2 = publicKey1;

      expect(publicKey1.raw.toString()).to.eq(publicKey2.raw.toString());
      publicKey1.raw = [BigInt(0), BigInt(0)];
      expect(publicKey1.raw.toString()).to.eq(publicKey2.raw.toString());

      // deep copy
      const keypair1 = new Keypair();
      const publicKey3 = keypair1.publicKey;
      const publicKey4 = publicKey3.copy();
      expect(publicKey3.raw.toString()).to.eq(publicKey4.raw.toString());
      publicKey4.raw = [BigInt(0), BigInt(0)];
      expect(publicKey3.raw.toString()).not.to.eq(publicKey4.raw.toString());
    });
  });

  describe("serialization", () => {
    describe("serialize", () => {
      it("should serialize into a string", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;

        const serialized = publicKey1.serialize();
        expect(serialized.startsWith("macipk.")).to.eq(true);

        const unpacked = unpackPublicKey(BigInt(`0x${serialized.slice(7).toString()}`));

        expect(unpacked[0].toString()).to.eq(publicKey1.raw[0].toString());
        expect(unpacked[1].toString()).to.eq(publicKey1.raw[1].toString());
      });
    });

    describe("deserialize", () => {
      it("should deserialize the public key", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const serialized = publicKey1.serialize();
        const publicKey2 = PublicKey.deserialize(serialized);
        expect(publicKey1.raw.toString()).to.eq(publicKey2.raw.toString());
      });
    });

    describe("isValidSerialized", () => {
      const keypair = new Keypair();
      const serialized = keypair.publicKey.serialize();
      it("should return true for keys that are serialized in the correct format", () => {
        expect(PublicKey.isValidSerialized(serialized)).to.eq(true);
      });

      it("should return false for keys that are not serialized in the correct format", () => {
        expect(PublicKey.isValidSerialized(`${serialized}ffffffffffffffffffffffffffffff`)).to.eq(false);
        expect(PublicKey.isValidSerialized(serialized.slice(1))).to.eq(false);
      });
    });

    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const json = publicKey1.toJSON();
        expect(json).to.not.eq(null);
      });

      it("should produce a JSON object with the correct keys", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const json = publicKey1.toJSON();
        expect(Object.keys(json)).to.deep.eq(["publicKey"]);
      });

      it("should preserve the data correctly", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const json = publicKey1.toJSON();

        expect(publicKey1.serialize()).to.eq(json.publicKey);
      });
    });

    describe("fromJSON", () => {
      it("should produce a public key", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const json = publicKey1.toJSON();
        const publicKey2 = PublicKey.fromJSON(json);
        expect(publicKey2).to.not.eq(null);
      });

      it("should produce the same public key object for the same raw key", () => {
        const keypair = new Keypair();
        const publicKey1 = keypair.publicKey;
        const json = publicKey1.toJSON();
        const publicKey2 = PublicKey.fromJSON(json);
        expect(publicKey1.raw.toString()).to.eq(publicKey2.raw.toString());
      });
    });
  });

  describe("asContractParam", () => {
    it("should produce an object with the correct values", () => {
      const keypair = new Keypair();
      const publicKey1 = keypair.publicKey;
      const obj = publicKey1.asContractParam();
      expect(obj.x).to.eq(publicKey1.raw[0].toString());
      expect(obj.y).to.eq(publicKey1.raw[1].toString());
    });
  });

  describe("asCircuitInputs", () => {
    it("should produce an array with the two points of the public key", () => {
      const keypair = new Keypair();
      const publicKey1 = keypair.publicKey;
      const array = publicKey1.asCircuitInputs();

      expect(array).to.be.instanceOf(Array);
      expect(array.length).to.eq(2);
    });
  });

  describe("asArray", () => {
    it("should produce an array with the two points of the public key", () => {
      const keypair = new Keypair();
      const publicKey1 = keypair.publicKey;
      const array = publicKey1.asArray();

      expect(array).to.be.instanceOf(Array);
      expect(array.length).to.eq(2);
      expect(array).to.deep.eq(publicKey1.raw);
    });
  });

  describe("hash", () => {
    it("should produce a hash", () => {
      const keypair = new Keypair();
      const publicKey1 = keypair.publicKey;
      const hash = publicKey1.hash();
      expect(hash).to.not.eq(null);
    });
  });

  describe("equals", () => {
    it("should return false for public keys that are not equal", () => {
      const keypair1 = new Keypair();
      const publicKey1 = keypair1.publicKey;
      const keypair2 = new Keypair();
      const publicKey2 = keypair2.publicKey;
      expect(publicKey1.equals(publicKey2)).to.eq(false);
    });

    it("should return true for public keys that are equal", () => {
      const keypair1 = new Keypair();
      const publicKey1 = keypair1.publicKey;
      const publicKey2 = publicKey1.copy();
      expect(publicKey1.equals(publicKey2)).to.eq(true);
    });
  });
});
