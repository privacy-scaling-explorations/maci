import { expect } from "chai";

import { Keypair, PrivKey } from "..";

describe("privateKey", () => {
  it("PrivKey.serialize() and deserialize() should work correctly", () => {
    const k = new Keypair();
    const sk1 = k.privKey;

    const s = sk1.serialize();
    expect(s.startsWith("macisk.")).to.eq(true);
    const d = `0x${s.slice(7)}`;
    expect(sk1.rawPrivKey.toString()).to.eq(BigInt(d).toString());

    const c = PrivKey.deserialize(s);
    expect(sk1.rawPrivKey.toString()).to.eq(BigInt(`${c.rawPrivKey}`).toString());
  });

  it("PrivKey.isValidSerializedPrivKey() should work correctly", () => {
    const k = new Keypair();
    const s = k.privKey.serialize();

    expect(PrivKey.isValidSerializedPrivKey(s)).to.eq(true);
    expect(PrivKey.isValidSerializedPrivKey(s.slice(1))).to.eq(false);
  });

  it("PrivKey.copy() should produce a deep copy", () => {
    const k = new Keypair();
    const sk1 = k.privKey;

    // shallow copy
    const sk2 = sk1;

    expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());
    sk1.rawPrivKey = BigInt(0);
    expect(sk1.rawPrivKey.toString()).to.eq(sk2.rawPrivKey.toString());

    // deep copy
    const k1 = new Keypair();
    const sk3 = k1.privKey;
    const sk4 = sk3.copy();
    expect(sk3.rawPrivKey.toString()).to.eq(sk4.rawPrivKey.toString());
    sk4.rawPrivKey = BigInt(0);
    expect(sk3.rawPrivKey.toString()).not.to.eq(sk4.rawPrivKey.toString());
  });
});
