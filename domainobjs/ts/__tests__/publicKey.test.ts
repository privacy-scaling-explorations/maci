import { expect } from "chai";
import { unpackPubKey } from "maci-crypto";

import { Keypair, PubKey } from "..";

describe("public key", () => {
  it("isValidSerializedPubKey() should work correctly", () => {
    const k = new Keypair();
    const s = k.pubKey.serialize();

    expect(PubKey.isValidSerializedPubKey(s)).to.eq(true);
    expect(PubKey.isValidSerializedPubKey(`${s}ffffffffffffffffffffffffffffff`)).to.eq(false);
    expect(PubKey.isValidSerializedPubKey(s.slice(1))).to.eq(false);
  });

  it("serialize() and deserialize() should work correctly", () => {
    const k = new Keypair();
    const pk1 = k.pubKey;

    const s = pk1.serialize();
    expect(s.startsWith("macipk.")).to.eq(true);

    const d = s.slice(7);
    const unpacked = unpackPubKey(BigInt(`0x${d.toString()}`));

    expect(unpacked[0].toString()).to.eq(pk1.rawPubKey[0].toString());
    expect(unpacked[1].toString()).to.eq(pk1.rawPubKey[1].toString());
  });

  it("copy() should produce a deep copy", () => {
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
