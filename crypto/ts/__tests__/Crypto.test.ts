import { expect } from "chai";
import { babyJub } from "circomlib";

import { SNARK_FIELD_SIZE } from "../constants";
import {
  genPubKey,
  genKeypair,
  genEcdhSharedKey,
  encrypt,
  decrypt,
  sign,
  sha256Hash,
  hash2,
  hash3,
  hash4,
  hash5,
  hash13,
  hashLeftRight,
  hashN,
  poseidonT3,
  poseidonT4,
  poseidonT5,
  poseidonT6,
  verifySignature,
  genRandomSalt,
  G1Point,
  G2Point,
  hashOne,
  genRandomBabyJubValue,
  genPrivKey,
  packPubKey,
  unpackPubKey,
  bitToCurve,
  curveToBit,
} from "../crypto";

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
    describe("hash13", () => {
      it("should produce the same output for the same input", () => {
        const res1 = hash13([
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
        ]);
        const res2 = hash13([
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
        ]);
        expect(res1).to.eq(res2);
      });
      it("should produce different outputs for different inputs", () => {
        const res1 = hash13([
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
        ]);
        const res2 = hash13([
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
          BigInt(13),
        ]);
        expect(res1).to.not.eq(res2);
      });
      it("should produce a non zero value", () => {
        const hash = hash13([
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
        ]);
        expect(hash).to.not.eq(BigInt(0));
      });
      it("should throw when elements is more than numElement", () => {
        expect(() =>
          hash13([
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
            BigInt(14),
          ]),
        ).to.throw("the length of the elements array should be at most 13; got 14");
      });
      it("should work (and apply padding) when passed less than numElement elements", () => {
        const hash = hash13([BigInt(1), BigInt(2)]);
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
    describe("genRandomSalt", () => {
      it("should produce a random salt", () => {
        const salt1 = genRandomSalt();
        const salt2 = genRandomSalt();
        expect(salt1).to.not.eq(salt2);
      });
      it("should produce a salt smaller than the snark field size", () => {
        const salt = genRandomSalt();
        expect(salt < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should produce a non zero value", () => {
        const salt = genRandomSalt();
        expect(salt).to.not.eq(BigInt(0));
      });
    });

    describe("bitToCurve", () => {
      it("should map bit 0 to point [0, 1] on the curve", () => {
        const point = bitToCurve(BigInt(0));
        expect(point).to.deep.eq([BigInt(0), BigInt(1)]);
      });

      it("should map bit 1 to the base point of the curve", () => {
        const point = bitToCurve(BigInt(1));
        expect(point).to.eq(babyJub.Base8);
      });

      it("should throw error for bit values other than 0 or 1", () => {
        expect(() => bitToCurve(BigInt(2))).to.throw("Invalid bit value");
        expect(() => bitToCurve(BigInt(-1))).to.throw("Invalid bit value");
      });
    });
    describe("curveToBit", () => {
      it("should map point [0, 1] on the curve to bit 0", () => {
        const bit = curveToBit([BigInt(0), BigInt(1)]);
        expect(bit).to.eq(BigInt(0));
      });

      it("should map the base point of the curve to bit 1", () => {
        const bit = curveToBit(babyJub.Base8);
        expect(bit).to.eq(BigInt(1));
      });

      it("should throw error for points not on the curve", () => {
        expect(() => curveToBit([BigInt(1), BigInt(2)])).to.throw("Invalid point");
      });
    });
  });

  describe("babyjub", () => {
    describe("genRandomBabyJubValue", () => {
      it("should generate a value what is < SNARK_FIELD_SIZE", () => {
        const p = genRandomBabyJubValue();
        expect(p < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should generate a random value", () => {
        const p1 = genRandomBabyJubValue();
        const p2 = genRandomBabyJubValue();
        expect(p1).to.not.eq(p2);
      });
      it("should generate a non zero value", () => {
        const p = genRandomBabyJubValue();
        expect(p).to.not.eq(BigInt(0));
      });
    });
    describe("genPrivKey", () => {
      it("should generate a private key that is < SNARK_FIELD_SIZE", () => {
        const sk = genPrivKey();
        expect(sk < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should generate a random private key", () => {
        const sk1 = genPrivKey();
        const sk2 = genPrivKey();
        expect(sk1).to.not.eq(sk2);
      });
      it("should generate a non zero private key", () => {
        const sk = genPrivKey();
        expect(sk).to.not.eq(BigInt(0));
      });
    });
    describe("genRandomSalt", () => {
      it("should generate a salt that is < SNARK_FIELD_SIZE", () => {
        const salt = genRandomSalt();
        expect(salt < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should generate a random salt", () => {
        const salt1 = genRandomSalt();
        const salt2 = genRandomSalt();
        expect(salt1).to.not.eq(salt2);
      });
      it("should generate a non zero salt", () => {
        const salt = genRandomSalt();
        expect(salt).to.not.eq(BigInt(0));
      });
    });
    describe("packPubKey", () => {
      it("should pack a public key into a Buffer", () => {
        const pk = genPubKey(genPrivKey());
        const pkBuff = packPubKey(pk);
        expect(pkBuff).to.be.instanceOf(Buffer);
      });
    });
    describe("unpackPubKey", () => {
      it("should unpack a Buffer into a public key", () => {
        const pk = genPubKey(genPrivKey());
        const pkBuff = packPubKey(pk);
        const pkUnpacked = unpackPubKey(pkBuff);
        expect(pkUnpacked).to.deep.eq(pk);
      });
      it("should produce a result which is < SNARK_FIELD_SIZE", () => {
        const pk = genPubKey(genPrivKey());
        const pkBuff = packPubKey(pk);
        const pkUnpacked = unpackPubKey(pkBuff);
        expect(pkUnpacked[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(pkUnpacked[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
    });
    describe("genPubKey", () => {
      it("should produce a public key which is < SNARK_FIELD_SIZE", () => {
        const pk = genPubKey(genPrivKey());
        expect(pk[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(pk[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should throw when given a private key which is >= SNARK_FIELD_SIZE", () => {
        expect(() => genPubKey(SNARK_FIELD_SIZE)).to.throw();
      });
    });
    describe("genKeypair", () => {
      it("should produce a public key which is < SNARK_FIELD_SIZE", () => {
        const { pubKey } = genKeypair();
        expect(pubKey[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(pubKey[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should produce a private key which is < SNARK_FIELD_SIZE", () => {
        const { privKey } = genKeypair();
        expect(privKey < SNARK_FIELD_SIZE).to.eq(true);
      });
    });
    describe("genEcdhSharedKey", () => {
      it("should produce a shared key which is < SNARK_FIELD_SIZE", () => {
        const { privKey, pubKey } = genKeypair();
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        expect(sharedKey[0] < SNARK_FIELD_SIZE).to.eq(true);
        expect(sharedKey[1] < SNARK_FIELD_SIZE).to.eq(true);
      });
      it("should generate a key which is different than the both privKey and pubKey", () => {
        const { privKey, pubKey } = genKeypair();
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        expect(sharedKey[0]).to.not.eq(privKey);
        expect(sharedKey[1]).to.not.eq(privKey);
        expect(sharedKey[0]).to.not.eq(pubKey[0]);
        expect(sharedKey[1]).to.not.eq(pubKey[1]);
      });
      it("should generate non zero points", () => {
        const { privKey, pubKey } = genKeypair();
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        expect(sharedKey[0]).to.not.eq(BigInt(0));
        expect(sharedKey[1]).to.not.eq(BigInt(0));
      });
      it("should produce consistent results", () => {
        const { privKey: privKey1, pubKey: pubKey1 } = genKeypair();
        const { privKey: privKey2, pubKey: pubKey2 } = genKeypair();

        const sharedKey1 = genEcdhSharedKey(privKey1, pubKey2);
        const sharedKey2 = genEcdhSharedKey(privKey2, pubKey1);

        expect(sharedKey1[0]).to.eq(sharedKey2[0]);
        expect(sharedKey1[1]).to.eq(sharedKey2[1]);
      });
    });
  });
  describe("encryption/decryption", () => {
    const nonce = BigInt(123);

    describe("encrypt", () => {
      it("should encrypt a plaintext", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey, nonce);
        expect(ciphertext).to.be.instanceOf(Array);
        expect(ciphertext.length).to.eq(4);
      });

      it("should encrypt a ciphertext without passing a nonce (default to 0)", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey);
        expect(ciphertext).to.be.instanceOf(Array);
        expect(ciphertext.length).to.eq(4);
      });

      it("should produce a cihertext that is different from the plaintext", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey, nonce);
        for (let i = 0; i < plaintext.length; i += 1) {
          expect(plaintext[i] !== ciphertext[i + 1]).to.eq(true);
        }
      });
      it("should produce ciphertext that is < SNARK_FIELD_SIZE", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey, nonce);
        ciphertext.forEach((c) => {
          expect(c < SNARK_FIELD_SIZE).to.eq(true);
        });
      });
    });
    describe("decrypt", () => {
      it("should decrypt a ciphertext", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey, nonce);
        const decryptedCiphertext = decrypt(ciphertext, sharedKey, nonce, plaintext.length);
        expect(decryptedCiphertext).to.be.instanceOf(Array);
        expect(decryptedCiphertext.length).to.eq(3);
        expect(plaintext).to.deep.eq(decryptedCiphertext);
      });
      it("should fail to decrypt if given the wrong key", () => {
        const { privKey } = genKeypair();
        const pubKey = genPubKey(genPrivKey());
        const sharedKey = genEcdhSharedKey(privKey, pubKey);
        const plaintext = [BigInt(1), BigInt(2), BigInt(3)];
        const ciphertext = encrypt(plaintext, sharedKey, nonce);
        const differentKey = genEcdhSharedKey(BigInt(1), pubKey);

        expect(() => {
          decrypt(ciphertext, differentKey, nonce, plaintext.length);
        }).to.throw();
      });
    });
  });

  describe("signatures", () => {
    const { privKey, pubKey } = genKeypair();
    const message = BigInt(Math.floor(Math.random() * 1000000000));
    const signature = sign(privKey, message);

    it("should have the correct format and its constituent parts should be smaller than the snark field size", () => {
      expect(signature).to.haveOwnProperty("R8");
      expect(signature).to.haveOwnProperty("S");
      expect(signature.R8[0] < SNARK_FIELD_SIZE).to.eq(true);
      expect(signature.R8[1] < SNARK_FIELD_SIZE).to.eq(true);
      expect(signature.S < SNARK_FIELD_SIZE).to.eq(true);
    });

    it("should be valid", () => {
      const valid = verifySignature(message, signature, pubKey);
      expect(valid).to.eq(true);
    });

    it("should be invalid for a different message", () => {
      const valid = verifySignature(message + BigInt(1), signature, pubKey);
      expect(valid).to.eq(false);
    });

    it("should be invalid if tampered with", () => {
      const valid = verifySignature(
        message,
        {
          R8: signature.R8,
          S: BigInt(1),
        },
        pubKey,
      );
      expect(valid).to.eq(false);
    });

    it("should be invalid for a different public key", () => {
      const pubKey1 = genPubKey(genPrivKey());
      const valid = verifySignature(message, signature, pubKey1);
      expect(valid).to.eq(false);
    });
  });
});
