import { expect } from "chai";

import { G1Point, G2Point, generateRandomBabyJubValue } from "../babyjub";
import { SNARK_FIELD_SIZE } from "../constants";
import {
  sha256Hash,
  hash2,
  hash3,
  hash4,
  hash5,
  hash12,
  hashLeftRight,
  hashN,
  hashOne,
  poseidonT3,
  poseidonT4,
  poseidonT5,
  poseidonT6,
} from "../hashing";
import {
  generatePublicKey,
  generateKeypair,
  generateEcdhSharedKey,
  generateRandomSalt,
  generatePrivateKey,
  packPublicKey,
  unpackPublicKey,
} from "../keys";

describe("Crypto", function test() {
  this.timeout(100000);

  describe("G1Point", () => {
    it("should create a new G1Point", () => {
      const g1 = new G1Point(BigInt(1), BigInt(2));
      expect(g1.x).to.eq(BigInt(1));
      expect(g1.y).to.eq(BigInt(2));
    });

    it("equals should return true for equal G1Point instances", () => {
      const g1 = new G1Point(BigInt(1), BigInt(2));
      const g2 = new G1Point(BigInt(1), BigInt(2));
      expect(g1.equals(g2)).to.eq(true);
    });

    it("equals should return false for different G1Point instances", () => {
      const g1 = new G1Point(BigInt(1), BigInt(2));
      const g2 = new G1Point(BigInt(2), BigInt(1));
      expect(g1.equals(g2)).to.eq(false);
    });

    it("asContractParam should return the G1Point instance as an object with x and y properties", () => {
      const g1 = new G1Point(BigInt(1), BigInt(2));
      const g1Obj = g1.asContractParam();
      expect(g1Obj.x).to.eq("1");
      expect(g1Obj.y).to.eq("2");
      expect(Object.keys(g1Obj).length).to.eq(2);
      expect(Object.keys(g1Obj)).to.deep.eq(["x", "y"]);
    });
  });

  describe("G2Point", () => {
    it("should create a new G2Point", () => {
      const g2 = new G2Point([BigInt(1)], [BigInt(2)]);
      expect(g2.x).to.deep.eq([BigInt(1)]);
      expect(g2.y).to.deep.eq([BigInt(2)]);
    });

    it("equals should return true for equal G2Point instances", () => {
      const g1 = new G2Point([BigInt(1)], [BigInt(2)]);
      const g2 = new G2Point([BigInt(1)], [BigInt(2)]);
      expect(g1.equals(g2)).to.eq(true);
    });

    it("equals should return false for different G2Point instances", () => {
      const g1 = new G2Point([BigInt(1)], [BigInt(2)]);
      const g2 = new G2Point([BigInt(2)], [BigInt(1)]);
      expect(g1.equals(g2)).to.eq(false);
    });

    it("asContractParam should return the G2Point instance as an object with x and y properties", () => {
      const g2 = new G2Point([BigInt(1)], [BigInt(2)]);
      const g2Obj = g2.asContractParam();
      expect(g2Obj.x).to.deep.eq(["1"]);
      expect(g2Obj.y).to.deep.eq(["2"]);
      expect(Object.keys(g2Obj).length).to.eq(2);
      expect(Object.keys(g2Obj)).to.deep.eq(["x", "y"]);
    });
  });

  describe("sha256Hash", () => {
    it("should return a hash of the input", () => {
      const res = sha256Hash([BigInt(1), BigInt(2)]);
      expect(res).to.not.eq(BigInt(0));
    });

    it("should produce the same hash for the same input", () => {
      const res1 = sha256Hash([BigInt(1), BigInt(2)]);
      const res2 = sha256Hash([BigInt(1), BigInt(2)]);
      expect(res1).to.eq(res2);
    });

    it("should produce different hashes for different inputs", () => {
      const res1 = sha256Hash([BigInt(1), BigInt(2)]);
      const res2 = sha256Hash([BigInt(2), BigInt(1)]);
      expect(res1).to.not.eq(res2);
    });

    it("should produce an output smaller than the snark field size", () => {
      const hash = sha256Hash([BigInt(1), BigInt(2)]);
      expect(hash < SNARK_FIELD_SIZE).to.eq(true);
    });

    it("should produce the correct output", () => {
      const s = sha256Hash([BigInt(0), BigInt(1)]);
      expect(s.toString()).to.eq("21788914573420223731318033363701224062123674814818143146813863227479480390499");
    });
  });

  describe("poseidon", () => {
    describe("poseidonT3", () => {
      it("should produce the same output for the same input", () => {
        const res1 = poseidonT3([BigInt(1), BigInt(2)]);
        const res2 = poseidonT3([BigInt(1), BigInt(2)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = poseidonT3([BigInt(1), BigInt(2)]);
        const res2 = poseidonT3([BigInt(2), BigInt(1)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = poseidonT3([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should only accept two inputs", () => {
        expect(() => poseidonT3([BigInt(1), BigInt(2), BigInt(3)])).to.throw();
      });
    });

    describe("poseidonT4", () => {
      it("should produce the same output for the same input", () => {
        const res1 = poseidonT4([BigInt(1), BigInt(2), BigInt(3)]);
        const res2 = poseidonT4([BigInt(1), BigInt(2), BigInt(3)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = poseidonT4([BigInt(1), BigInt(2), BigInt(3)]);
        const res2 = poseidonT4([BigInt(2), BigInt(1), BigInt(3)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = poseidonT4([BigInt(1), BigInt(2), BigInt(3)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should only accept three inputs", () => {
        expect(() => poseidonT4([BigInt(1), BigInt(2)])).to.throw();
        expect(() => poseidonT4([BigInt(1), BigInt(2), BigInt(3), BigInt(4)])).to.throw();
      });
    });

    describe("poseidonT5", () => {
      it("should produce the same output for the same input", () => {
        const res1 = poseidonT5([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        const res2 = poseidonT5([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = poseidonT5([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        const res2 = poseidonT5([BigInt(2), BigInt(1), BigInt(3), BigInt(4)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = poseidonT5([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should only accept four inputs", () => {
        expect(() => poseidonT5([BigInt(1), BigInt(2)])).to.throw();
        expect(() => poseidonT5([BigInt(1), BigInt(2), BigInt(3)])).to.throw();
        expect(() => poseidonT5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)])).to.throw();
      });
    });

    describe("poseidonT6", () => {
      it("should produce the same output for the same input", () => {
        const res1 = poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = poseidonT6([BigInt(2), BigInt(1), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should only accept five inputs", () => {
        expect(() => poseidonT6([BigInt(1), BigInt(2)])).to.throw();
        expect(() => poseidonT6([BigInt(1), BigInt(2), BigInt(3)])).to.throw();
        expect(() => poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4)])).to.throw();
        expect(() => poseidonT6([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])).to.throw();
      });
    });

    describe("hashLeftRight", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hashLeftRight(BigInt(1), BigInt(2));
        const res2 = hashLeftRight(BigInt(1), BigInt(2));
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hashLeftRight(BigInt(1), BigInt(2));
        const res2 = hashLeftRight(BigInt(2), BigInt(1));
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hashLeftRight(BigInt(1), BigInt(2));
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hashN", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = hashN(5, [BigInt(2), BigInt(1), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() => hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])).to.throw(
          "the length of the elements array should be at most 5; got 6",
        );
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hashN(5, [BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hash2", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash2([BigInt(1), BigInt(2)]);
        const res2 = hash2([BigInt(1), BigInt(2)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hash2([BigInt(1), BigInt(2)]);
        const res2 = hash2([BigInt(2), BigInt(1)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hash2([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() => hash2([BigInt(1), BigInt(2), BigInt(3)])).to.throw(
          "the length of the elements array should be at most 2; got 3",
        );
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash2([BigInt(1)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hash3", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash3([BigInt(1), BigInt(2), BigInt(3)]);
        const res2 = hash3([BigInt(1), BigInt(2), BigInt(3)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hash3([BigInt(1), BigInt(2), BigInt(3)]);
        const res2 = hash3([BigInt(2), BigInt(1), BigInt(3)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hash3([BigInt(1), BigInt(2), BigInt(3)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() => hash3([BigInt(1), BigInt(2), BigInt(3), BigInt(4)])).to.throw(
          "the length of the elements array should be at most 3; got 4",
        );
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash3([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hash4", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash4([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        const res2 = hash4([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hash4([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        const res2 = hash4([BigInt(2), BigInt(1), BigInt(3), BigInt(4)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hash4([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() => hash4([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)])).to.throw(
          "the length of the elements array should be at most 4; got 5",
        );
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash4([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hash5", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = hash5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hash5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        const res2 = hash5([BigInt(2), BigInt(1), BigInt(3), BigInt(4), BigInt(5)]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hash5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() => hash5([BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])).to.throw(
          "the length of the elements array should be at most 5; got 6",
        );
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash5([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hash12", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash12([
          BigInt(1),
          BigInt(2),
          BigInt(3),
          BigInt(4),
          BigInt(5),
          BigInt(6),
          BigInt(7),
          BigInt(8),
          BigInt(9),
          BigInt(10),
          BigInt(11),
          BigInt(12),
        ]);
        const res2 = hash12([
          BigInt(1),
          BigInt(2),
          BigInt(3),
          BigInt(4),
          BigInt(5),
          BigInt(6),
          BigInt(7),
          BigInt(8),
          BigInt(9),
          BigInt(10),
          BigInt(11),
          BigInt(12),
        ]);
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hash12([
          BigInt(1),
          BigInt(2),
          BigInt(3),
          BigInt(4),
          BigInt(5),
          BigInt(6),
          BigInt(7),
          BigInt(8),
          BigInt(9),
          BigInt(10),
          BigInt(11),
          BigInt(12),
        ]);
        const res2 = hash12([
          BigInt(2),
          BigInt(1),
          BigInt(3),
          BigInt(4),
          BigInt(5),
          BigInt(6),
          BigInt(7),
          BigInt(8),
          BigInt(9),
          BigInt(10),
          BigInt(11),
          BigInt(12),
        ]);
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hash12([
          BigInt(1),
          BigInt(2),
          BigInt(3),
          BigInt(4),
          BigInt(5),
          BigInt(6),
          BigInt(7),
          BigInt(8),
          BigInt(9),
          BigInt(10),
          BigInt(11),
          BigInt(12),
        ]);
        expect(hash).to.not.eq(BigInt(0));
      });

      it("should throw when elements is more than numElement", () => {
        expect(() =>
          hash12([
            BigInt(1),
            BigInt(2),
            BigInt(3),
            BigInt(4),
            BigInt(5),
            BigInt(6),
            BigInt(7),
            BigInt(8),
            BigInt(9),
            BigInt(10),
            BigInt(11),
            BigInt(12),
            BigInt(13),
          ]),
        ).to.throw("the length of the elements array should be at most 12; got 13");
      });

      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash12([BigInt(1), BigInt(2)]);
        expect(hash).to.not.eq(BigInt(0));
      });
    });

    describe("hashOne", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hashOne(BigInt(1));
        const res2 = hashOne(BigInt(1));
        expect(res1).to.eq(res2);
      });

      it("should produce different outputs for different inputs", () => {
        const res1 = hashOne(BigInt(1));
        const res2 = hashOne(BigInt(2));
        expect(res1).to.not.eq(res2);
      });

      it("should produce a non zero value", () => {
        const hash = hashOne(BigInt(1));
        expect(hash).to.not.eq(BigInt(0));
      });
    });
  });

  describe("utils", () => {
    describe("generateRandomSalt", () => {
      it("should produce a random salt", () => {
        const salt1 = generateRandomSalt();
        const salt2 = generateRandomSalt();
        expect(salt1).to.not.eq(salt2);
      });

      it("should produce a salt smaller than the snark field size", () => {
        const salt = generateRandomSalt();
        expect(salt < SNARK_FIELD_SIZE).to.eq(true);
      });

      it("should produce a non zero value", () => {
        const salt = generateRandomSalt();
        expect(salt).to.not.eq(BigInt(0));
      });
    });
  });

  describe("babyjub", () => {
    describe("generateRandomBabyJubValue", () => {
      it("should generate a value what is < SNARK_FIELD_SIZE", () => {
        const value = generateRandomBabyJubValue();
        expect(value < SNARK_FIELD_SIZE).to.eq(true);
      });

      it("should generate a random value", () => {
        const value1 = generateRandomBabyJubValue();
        const value2 = generateRandomBabyJubValue();
        expect(value1).to.not.eq(value2);
      });

      it("should generate a non zero value", () => {
        const value = generateRandomBabyJubValue();
        expect(value).to.not.eq(BigInt(0));
      });
    });

    describe("generatePrivateKey", () => {
      it("should generate a random private key", () => {
        const secretKey1 = generatePrivateKey();
        const secretKey2 = generatePrivateKey();
        expect(secretKey1).to.not.eq(secretKey2);
      });

      it("should generate a non zero private key", () => {
        const secretKey = generatePrivateKey();
        expect(secretKey).to.not.eq(BigInt(0));
      });
    });

    describe("generateRandomSalt", () => {
      it("should generate a salt that is < SNARK_FIELD_SIZE", () => {
        const salt = generateRandomSalt();
        expect(salt < SNARK_FIELD_SIZE).to.eq(true);
      });

      it("should generate a random salt", () => {
        const salt1 = generateRandomSalt();
        const salt2 = generateRandomSalt();
        expect(salt1).to.not.eq(salt2);
      });

      it("should generate a non zero salt", () => {
        const salt = generateRandomSalt();
        expect(salt).to.not.eq(BigInt(0));
      });
    });

    describe("packPublicKey", () => {
      it("should pack a public key into a bigint", () => {
        const publicKey = generatePublicKey(generatePrivateKey());
        const publicKeyPacked = packPublicKey(publicKey);
        expect(typeof publicKeyPacked).to.eq("bigint");
      });
    });

    describe("unpackPublicKey", () => {
      it("should unpack a Buffer into a public key", () => {
        const publicKey = generatePublicKey(generatePrivateKey());
        const publicKeyPacked = packPublicKey(publicKey);
        const publicKeyUnpacked = unpackPublicKey(publicKeyPacked);
        expect(publicKeyUnpacked).to.deep.eq(publicKey);
      });

      it("should produce a result which is < SNARK_FIELD_SIZE", () => {
        const publicKey = generatePublicKey(generatePrivateKey());
        const publicKeyPacked = packPublicKey(publicKey);
        const publicKeyUnpacked = unpackPublicKey(publicKeyPacked);
        expect(publicKeyUnpacked[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(publicKeyUnpacked[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
    });

    describe("generatePublicKey", () => {
      it("should produce a public key which is < SNARK_FIELD_SIZE", () => {
        const publicKey = generatePublicKey(generatePrivateKey());
        expect(publicKey[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(publicKey[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
    });

    describe("generateKeypair", () => {
      it("should produce a public key which is < SNARK_FIELD_SIZE", () => {
        const { publicKey } = generateKeypair();
        expect(publicKey[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(publicKey[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
    });

    describe("generateEcdhSharedKey", () => {
      it("should produce a shared key which is < SNARK_FIELD_SIZE", () => {
        const { privateKey, publicKey } = generateKeypair();
        const sharedKey = generateEcdhSharedKey(privateKey, publicKey);
        expect(sharedKey[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(sharedKey[1] < SNARK_FIELD_SIZE).to.eq(true);
      });

      it("should generate a key which is different than the both privateKey and publicKey", () => {
        const { privateKey, publicKey } = generateKeypair();
        const sharedKey = generateEcdhSharedKey(privateKey, publicKey);
        expect(sharedKey[0]).to.not.eq(privateKey);
        expect(sharedKey[1]).to.not.eq(privateKey);
        expect(sharedKey[0]).to.not.eq(publicKey[0]);
        expect(sharedKey[1]).to.not.eq(publicKey[1]);
      });

      it("should generate non zero points", () => {
        const { privateKey, publicKey } = generateKeypair();
        const sharedKey = generateEcdhSharedKey(privateKey, publicKey);
        expect(sharedKey[0]).to.not.eq(BigInt(0));
        expect(sharedKey[1]).to.not.eq(BigInt(0));
      });

      it("should produce consistent results", () => {
        const { privateKey: privateKey1, publicKey: publicKey1 } = generateKeypair();
        const { privateKey: privateKey2, publicKey: publicKey2 } = generateKeypair();

        const sharedKey1 = generateEcdhSharedKey(privateKey1, publicKey2);
        const sharedKey2 = generateEcdhSharedKey(privateKey2, publicKey1);

        expect(sharedKey1[0]).to.eq(sharedKey2[0]);
        expect(sharedKey1[1]).to.eq(sharedKey2[1]);
      });
    });
  });
});
