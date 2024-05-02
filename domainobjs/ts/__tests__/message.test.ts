import { expect } from "chai";

import { Message, Keypair } from "..";

describe("message", () => {
  describe("constructor", () => {
    it("should create a new message", () => {
      const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
      expect(msg).to.not.eq(null);
    });
    it("should throw an error if the data length is not 10", () => {
      expect(() => new Message(Array<bigint>(9).fill(BigInt(0)))).to.throw();
    });
  });

  describe("asCircuitInputs", () => {
    it("should produce an array", () => {
      const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
      const arr = msg.asCircuitInputs();
      expect(arr).to.be.instanceOf(Array);
      expect(arr.length).to.eq(10);
      expect(arr).to.deep.eq([...Array<bigint>(10).fill(BigInt(0))]);
    });
  });

  describe("asContractParam", () => {
    it("should produce an object", () => {
      const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
      const obj = msg.asContractParam();
      expect(obj).to.be.instanceOf(Object);
      expect(Object.keys(obj)).to.deep.eq(["data"]);
    });
    it("should produce an object with the correct values", () => {
      const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
      const obj = msg.asContractParam();
      expect(obj.data).to.deep.eq(Array<string>(10).fill("0"));
    });
  });

  describe("hash", () => {
    const keypair = new Keypair();
    it("should produce a hash", () => {
      const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
      const h = msg.hash(keypair.pubKey);
      expect(h).to.not.eq(null);
    });
    it("should produce the same hash for the same ballot", () => {
      const msg1 = new Message(Array<bigint>(10).fill(BigInt(0)));
      const msg2 = new Message(Array<bigint>(10).fill(BigInt(0)));
      const h1 = msg1.hash(keypair.pubKey);
      const h2 = msg2.hash(keypair.pubKey);
      expect(h1).to.eq(h2);
    });
  });
  describe("copy", () => {
    it("should produce a deep copy", () => {
      const msg1 = new Message(Array<bigint>(10).fill(BigInt(0)));
      const msg2 = msg1.copy();
      expect(msg1.equals(msg2)).to.eq(true);
      expect(msg1.data).to.deep.eq(msg2.data);
    });
  });
  describe("equals", () => {
    it("should return false for messages that are not equal (different length)", () => {
      const msg1 = new Message(Array<bigint>(10).fill(BigInt(0)));
      const msg2 = new Message(Array<bigint>(10).fill(BigInt(0)));
      msg1.data[10] = BigInt(1);
      expect(msg1.equals(msg2)).to.eq(false);
    });
    it("should return true for messages that are equal", () => {
      const msg1 = new Message(Array<bigint>(10).fill(BigInt(0)));
      const msg2 = new Message(Array<bigint>(10).fill(BigInt(0)));
      expect(msg1.equals(msg2)).to.eq(true);
    });
  });

  describe("serialization/deserialization", () => {
    describe("toJSON", () => {
      it("should produce a JSON object", () => {
        const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
        const json = msg.toJSON();
        expect(json).to.not.eq(null);
      });
      it("should produce a JSON object with the correct keys", () => {
        const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
        const json = msg.toJSON();
        expect(Object.keys(json)).to.deep.eq(["data"]);
      });
      it("should preserve the data correctly", () => {
        const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
        const json = msg.toJSON();

        expect(msg.data.map((x: bigint) => x.toString())).to.deep.eq(json.data);
      });
    });

    describe("fromJSON", () => {
      it("should produce a Message instance", () => {
        const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
        const json = msg.toJSON();
        const msg2 = Message.fromJSON(json);
        expect(msg2).to.be.instanceOf(Message);
      });
      it("should preserve the data correctly", () => {
        const msg = new Message(Array<bigint>(10).fill(BigInt(0)));
        const json = msg.toJSON();
        const msg2 = Message.fromJSON(json);
        expect(msg.equals(msg2)).to.eq(true);
      });
    });
  });
});
