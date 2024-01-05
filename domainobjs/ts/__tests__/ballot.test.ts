import { expect } from "chai";

import { Ballot } from "..";

describe("Ballot", () => {
  describe("constructor", () => {
    it("should create an empty ballot", () => {
      const b = new Ballot(0, 2);
      expect(b.votes.length).to.eq(0);
    });

    it("should create a ballot with 1 vote", () => {
      const b = new Ballot(1, 2);
      expect(b.votes.length).to.eq(1);
      expect(b.votes[0]).to.eq(BigInt(0));
    });
  });

  describe("hash", () => {
    it("should produce an hash of the ballot", () => {
      const b = new Ballot(0, 2);
      const h = b.hash();
      expect(h).to.not.eq(null);
    });
  });

  describe("copy", () => {
    it("should produce a deep copy", () => {
      const b1 = Ballot.genRandomBallot(2, 2);
      const b2 = b1.copy();

      expect(b1.voteOptionTreeDepth).to.eq(b2.voteOptionTreeDepth);
      expect(b1.nonce).to.eq(b2.nonce);
      expect(b1.votes.length).to.eq(b2.votes.length);
      expect(b1.votes).to.deep.eq(b2.votes);

      expect(b1.equals(b2)).to.eq(true);
    });
  });

  describe("asCircuitInputs", () => {
    it("should produce an array", () => {
      const len = 2;
      const b1 = Ballot.genRandomBallot(len, 2);
      const arr = b1.asCircuitInputs();
      expect(arr).to.be.instanceOf(Array);
      expect(arr.length).to.eq(len);
    });
  });

  describe("isEqual", () => {
    it("should return false for ballots that are not equal (different votes length)", () => {
      const b1 = Ballot.genRandomBallot(2, 2);
      const b2 = Ballot.genRandomBallot(2, 3);
      expect(b1.equals(b2)).to.eq(false);
    });
    it("should return true for ballots that are equal", () => {
      const b1 = new Ballot(0, 2);
      const b2 = new Ballot(0, 2);
      expect(b1.equals(b2)).to.eq(true);
    });
    it("should return false for ballots that are not equal (different nonce)", () => {
      const b1 = Ballot.genRandomBallot(3, 2);
      const b2 = Ballot.genRandomBallot(2, 2);
      b2.nonce = BigInt(1);
      expect(b1.equals(b2)).to.eq(false);
    });
  });

  describe("asArray", () => {
    it("should produce a valid result", () => {
      const b1 = Ballot.genRandomBallot(2, 2);
      b1.votes[0] = BigInt(1);
      b1.votes[1] = BigInt(2);
      b1.votes[2] = BigInt(3);
      const arr = b1.asArray();
      expect(arr[0]).to.eq(b1.nonce);
    });
  });

  describe("genRandomBallot", () => {
    it("should generate a ballot with a random nonce", () => {
      const b1 = Ballot.genRandomBallot(2, 2);
      const b2 = Ballot.genRandomBallot(2, 2);
      expect(b1.nonce).to.not.eq(b2.nonce);
    });
  });

  describe("genBlankBallot", () => {
    it("should generate a ballot with all votes set to 0", () => {
      const b1 = Ballot.genBlankBallot(2, 2);
      expect(b1.votes.every((v) => v === BigInt(0))).to.eq(true);
    });
  });

  describe("serialization/deserialization", () => {
    describe("toJSON", () => {
      it("toJSON should produce a JSON object representing the ballot", () => {
        const b1 = Ballot.genBlankBallot(2, 2);
        const json = b1.toJSON();
        expect(json).to.have.property("votes");
        expect(json).to.have.property("nonce");
        expect(json).to.have.property("voteOptionTreeDepth");
        expect(json.votes.length).to.eq(b1.votes.length);
        expect(json.nonce).to.eq(b1.nonce.toString());
        expect(json.voteOptionTreeDepth).to.eq(b1.voteOptionTreeDepth.toString());
      });
    });

    describe("fromJSON", () => {
      it("should create a ballot from a JSON object", () => {
        const b1 = Ballot.genBlankBallot(2, 2);
        const json = b1.toJSON();
        const b2 = Ballot.fromJSON(json);
        expect(b1.equals(b2)).to.eq(true);
      });
    });
  });
});
