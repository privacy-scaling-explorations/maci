import { Ballot } from "../"

describe("Ballot", () => {
    it("copy should produce a deep copy", () => {
        const b1 = Ballot.genRandomBallot(2, 2)
        const b2 = b1.copy()
        expect(b1.equals(b2)).toBeTruthy()
    })

    it("asCircuitInputs should produce an array", () => {
        const b1 = Ballot.genRandomBallot(2, 2)
        const arr = b1.asCircuitInputs()
        expect(arr).toBeInstanceOf(Array)
        expect(arr.length).toEqual(2)
    })
})