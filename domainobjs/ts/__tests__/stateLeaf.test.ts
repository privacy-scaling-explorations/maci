import { expect } from "chai";

import { Keypair, StateLeaf } from "..";

describe("stateLeaf", () => {
  const { pubKey } = new Keypair();

  describe("constructor", () => {
    it("should create a state leaf", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));
      expect(stateLeaf).to.not.eq(null);
      expect(stateLeaf.pubKey.equals(pubKey)).to.eq(true);
      expect(stateLeaf.voiceCreditBalance).to.eq(BigInt(123));
      expect(stateLeaf.timestamp).to.eq(BigInt(1231267));
    });
  });

  describe("copy", () => {
    it("should create an exact copy of the state leaf", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      const copy = stateLeaf.copy();

      expect(stateLeaf.equals(copy)).to.eq(true);
    });
  });

  describe("genBlankLeaf", () => {
    it("should return a blank leaf", () => {
      const blankLeaf = StateLeaf.genBlankLeaf();
      expect(blankLeaf.pubKey.rawPubKey[0]).to.eq(
        BigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),
      );
      expect(blankLeaf.pubKey.rawPubKey[1]).to.eq(
        BigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317"),
      );
      expect(blankLeaf.voiceCreditBalance).to.eq(BigInt(0));
      expect(blankLeaf.timestamp).to.eq(BigInt(0));
    });
  });

  describe("genRandomLeaf", () => {
    it("should return a random leaf", () => {
      const randomLeaf = StateLeaf.genRandomLeaf();
      const randomLeaf2 = StateLeaf.genRandomLeaf();
      expect(randomLeaf.equals(randomLeaf2)).to.eq(false);
    });
  });

  describe("equals", () => {
    it("should return true when comparing two equal state leaves", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      const stateLeaf2 = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      expect(stateLeaf.equals(stateLeaf2)).to.eq(true);
    });

    it("should return false when comparing two different state leaves", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      const stateLeaf2 = new StateLeaf(pubKey, BigInt(123), BigInt(1231268));

      expect(stateLeaf.equals(stateLeaf2)).to.eq(false);
    });
  });

  describe("serialization", () => {
    describe("serialize", () => {
      it("should work correctly", () => {
        const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

        const serialized = stateLeaf.serialize();
        expect(serialized).to.not.eq(null);
      });
    });

    describe("deserialize", () => {
      it("should work correctly", () => {
        const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

        const serialized = stateLeaf.serialize();
        const deserialized = StateLeaf.deserialize(serialized);
        expect(deserialized.equals(stateLeaf)).to.eq(true);
      });
    });

    describe("toJSON", () => {
      it("should produce an object with the correct properities", () => {
        const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

        const json = stateLeaf.toJSON();
        expect(json).to.not.eq(null);

        expect(Object.keys(json)).to.deep.eq(["pubKey", "voiceCreditBalance", "timestamp"]);
      });
    });

    describe("fromJSON", () => {
      it("should produce a state leaf from a JSON object", () => {
        const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

        const json = stateLeaf.toJSON();
        const deserialized = StateLeaf.fromJSON(json);
        expect(deserialized.equals(stateLeaf)).to.eq(true);
      });
    });
  });

  describe("asCircuitInputs", () => {
    it("should return an array", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      const arr = stateLeaf.asCircuitInputs();
      expect(arr).to.be.instanceOf(Array);
      expect(arr.length).to.eq(4);
    });
  });

  describe("asContractParam", () => {
    it("should return an object with the correct properties and values", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));
      const obj = stateLeaf.asContractParam();
      expect(obj).to.not.eq(null);
      expect(Object.keys(obj)).to.deep.eq(["pubKey", "voiceCreditBalance", "timestamp"]);
      expect(obj.pubKey).to.deep.eq(pubKey.asContractParam());
      expect(obj.voiceCreditBalance).to.eq("123");
      expect(obj.timestamp).to.eq("1231267");
    });
  });

  describe("hash", () => {
    it("should hash into a single bigint value which is not null", () => {
      const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

      const hash = stateLeaf.hash();
      expect(hash).to.not.eq(null);
    });
  });
});
