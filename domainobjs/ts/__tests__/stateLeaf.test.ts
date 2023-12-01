import { Keypair, StateLeaf } from "../";
import { expect } from "chai";

describe("State leaves", () => {
  const { pubKey } = new Keypair();

  it("serialize() and deserialize() functions should work correctly", () => {
    const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    const serialized = stateLeaf.serialize();
    const deserialized = StateLeaf.deserialize(serialized);

    expect(deserialized.voiceCreditBalance.toString()).to.eq(stateLeaf.voiceCreditBalance.toString());
  });

  it("copy should create an exact copy of the state leaf", () => {
    const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    const copy = stateLeaf.copy();

    expect(stateLeaf.equals(copy)).to.be.true;
  });

  it("genRandomLeaf should return a random leaf", () => {
    const randomLeaf = StateLeaf.genRandomLeaf();
    const randomLeaf2 = StateLeaf.genRandomLeaf();
    expect(randomLeaf.equals(randomLeaf2)).to.be.false;
  });

  it("asCircuitInputs should return an array", () => {
    const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    const arr = stateLeaf.asCircuitInputs();
    expect(arr).to.be.instanceOf(Array);
    expect(arr.length).to.be.gt(0);
    expect(arr.length).to.eq(4);
  });

  it("equals should return true when comparing two equal state leaves", () => {
    const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    const stateLeaf2 = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    expect(stateLeaf.equals(stateLeaf2)).to.be.true;
  });

  it("equals should return false when comparing two different state leaves", () => {
    const stateLeaf = new StateLeaf(pubKey, BigInt(123), BigInt(1231267));

    const stateLeaf2 = new StateLeaf(pubKey, BigInt(123), BigInt(1231268));

    expect(stateLeaf.equals(stateLeaf2)).to.be.false;
  });
});
