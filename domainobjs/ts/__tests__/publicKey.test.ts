import { expect } from "chai";
import { SNARK_FIELD_SIZE, unpackPubKey } from "maci-crypto";

import { Keypair, PubKey } from "..";

describe("public key", () => {
  describe("constructor", () => {
    it("should create a public key", () => {
      const k = new Keypair();
      const pk = new PubKey(k.pubKey.rawPubKey);
      expect(pk).to.not.eq(null);
    });
    it("should create the same public key object for the same raw key", () => {
      const k = new Keypair();
      const pk1 = new PubKey(k.pubKey.rawPubKey);
      const pk2 = new PubKey(k.pubKey.rawPubKey);
      expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());
    });
    it("should fail to create a public key if the raw key is invalid", () => {
      expect(() => new PubKey([BigInt(0), BigInt(SNARK_FIELD_SIZE)])).to.throw();
      expect(() => new PubKey([BigInt(SNARK_FIELD_SIZE), BigInt(0)])).to.throw();
      expect(() => new PubKey([BigInt(SNARK_FIELD_SIZE), BigInt(SNARK_FIELD_SIZE)])).to.throw();
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const k = new Keypair();
      const pk1 = k.pubKey;

      // shallow copy
      const pk2 = pk1;

      expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());
      pk1.rawPubKey = [BigInt(0), BigInt(0)];
      expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());

      // deep copy
      const k1 = new Keypair();
      const pk3 = k1.pubKey;
      const pk4 = pk3.copy();
      expect(pk3.rawPubKey.toString()).to.eq(pk4.rawPubKey.toString());
      pk4.rawPubKey = [BigInt(0), BigInt(0)];
      expect(pk3.rawPubKey.toString()).not.to.eq(pk4.rawPubKey.toString());
    });
  });

  describe("serialization", () => {
    describe("serialize", () => {
      it("should serialize into a string", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;

        const s = pk1.serialize();
        expect(s.startsWith("macipk.")).to.eq(true);

        const unpacked = unpackPubKey(BigInt(`0x${s.slice(7).toString()}`));

        expect(unpacked[0].toString()).to.eq(pk1.rawPubKey[0].toString());
        expect(unpacked[1].toString()).to.eq(pk1.rawPubKey[1].toString());
      });
      it("should serialize into an invalid serialized key when the key is [bigint(0), bigint(0)]", () => {
        const pk1 = new PubKey([BigInt(0), BigInt(0)]);
        const s = pk1.serialize();
        expect(s).to.eq("macipk.z");
      });
    });

    describe("deserialize", () => {
      it("should deserialize the public key", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const s = pk1.serialize();
        const pk2 = PubKey.deserialize(s);
        expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());
      });
      it("should deserialize into an invalid serialized key when the key is equal to macipk.z", () => {
        const pk1 = PubKey.deserialize("macipk.z");
        expect(pk1.rawPubKey.toString()).to.eq([BigInt(0), BigInt(0)].toString());
      });
    });

    describe("isValidSerializedPubKey", () => {
      const k = new Keypair();
      const s = k.pubKey.serialize();
      it("should return true for keys that are serialized in the correct format", () => {
        expect(PubKey.isValidSerializedPubKey(s)).to.eq(true);
      });

      it("should return false for keys that are not serialized in the correct format", () => {
        expect(PubKey.isValidSerializedPubKey(`${s}ffffffffffffffffffffffffffffff`)).to.eq(false);
        expect(PubKey.isValidSerializedPubKey(s.slice(1))).to.eq(false);
      });
    });

    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const json = pk1.toJSON();
        expect(json).to.not.eq(null);
      });
      it("should produce a JSON object with the correct keys", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const json = pk1.toJSON();
        expect(Object.keys(json)).to.deep.eq(["pubKey"]);
      });
      it("should preserve the data correctly", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const json = pk1.toJSON();

        expect(pk1.serialize()).to.eq(json.pubKey);
      });
    });
    describe("fromJSON", () => {
      it("should produce a public key", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const json = pk1.toJSON();
        const pk2 = PubKey.fromJSON(json);
        expect(pk2).to.not.eq(null);
      });
      it("should produce the same public key object for the same raw key", () => {
        const k = new Keypair();
        const pk1 = k.pubKey;
        const json = pk1.toJSON();
        const pk2 = PubKey.fromJSON(json);
        expect(pk1.rawPubKey.toString()).to.eq(pk2.rawPubKey.toString());
      });
    });
  });

  describe("asContractParam", () => {
    it("should produce an object with the correct values", () => {
      const k = new Keypair();
      const pk1 = k.pubKey;
      const obj = pk1.asContractParam();
      expect(obj.x).to.eq(pk1.rawPubKey[0].toString());
      expect(obj.y).to.eq(pk1.rawPubKey[1].toString());
    });
  });

  describe("asCircuitInputs", () => {
    it("should produce an array with the two points of the public key", () => {
      const k = new Keypair();
      const pk1 = k.pubKey;
      const arr = pk1.asCircuitInputs();
      expect(arr).to.be.instanceOf(Array);
      expect(arr.length).to.eq(2);
    });
  });

  describe("asArray", () => {
    it("should produce an array with the two points of the public key", () => {
      const k = new Keypair();
      const pk1 = k.pubKey;
      const arr = pk1.asArray();
      expect(arr).to.be.instanceOf(Array);
      expect(arr.length).to.eq(2);
      expect(arr).to.deep.eq(pk1.rawPubKey);
    });
  });

  describe("hash", () => {
    it("should produce a hash", () => {
      const k = new Keypair();
      const pk1 = k.pubKey;
      const h = pk1.hash();
      expect(h).to.not.eq(null);
    });
  });

  describe("equals", () => {
    it("should return false for public keys that are not equal", () => {
      const k1 = new Keypair();
      const pk1 = k1.pubKey;
      const k2 = new Keypair();
      const pk2 = k2.pubKey;
      expect(pk1.equals(pk2)).to.eq(false);
    });
    it("should return true for public keys that are equal", () => {
      const k1 = new Keypair();
      const pk1 = k1.pubKey;
      const pk2 = pk1.copy();
      expect(pk1.equals(pk2)).to.eq(true);
    });
  });
});
