import { Ballot } from "..";
import { expect } from "chai";

describe("Ballot", () => {
    it("should create a new ballot and hash it", () => {
        const b = new Ballot(0, 2);
        const h = b.hash();
        expect(h).to.not.be.null;
    });

    it("copy should produce a deep copy", () => {
        const b1 = Ballot.genRandomBallot(2, 2);
        const b2 = b1.copy();
        expect(b1.equals(b2)).to.be.true;
    });

    it("asCircuitInputs should produce an array", () => {
        const b1 = Ballot.genRandomBallot(2, 2);
        const arr = b1.asCircuitInputs();
        expect(arr).to.be.instanceOf(Array);
        expect(arr.length).to.eq(2);
    });
});
