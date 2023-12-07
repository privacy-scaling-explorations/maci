import { expect } from "chai";
import { genRandomSalt } from "maci-crypto";

import { Keypair, Message, PCommand, TCommand } from "..";

describe("Commands & Messages", () => {
  const { privKey, pubKey } = new Keypair();
  const k = new Keypair();

  const pubKey1 = k.pubKey;

  const newPubKey = k.pubKey;

  const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey1);
  // eslint-disable-next-line no-bitwise
  const random50bitBigInt = (): bigint => ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());
  const command: PCommand = new PCommand(
    random50bitBigInt(),
    newPubKey,
    random50bitBigInt(),
    random50bitBigInt(),
    random50bitBigInt(),
    random50bitBigInt(),
    genRandomSalt(),
  );
  const signature = command.sign(privKey);
  const message = command.encrypt(signature, ecdhSharedKey);
  const decrypted = PCommand.decrypt(message, ecdhSharedKey);

  it("command.sign() should produce a valid signature", () => {
    expect(command.verifySignature(signature, pubKey)).to.eq(true);
  });

  it("decrypted message should match the original command", () => {
    expect(decrypted.command.equals(command)).to.eq(true);
    expect(decrypted.signature.R8[0].toString()).to.eq(signature.R8[0].toString());
    expect(decrypted.signature.R8[1].toString()).to.eq(signature.R8[1].toString());
    expect(decrypted.signature.S.toString()).to.eq(signature.S.toString());
  });

  it("decrypted message should have a valid signature", () => {
    const isValid = decrypted.command.verifySignature(decrypted.signature, pubKey);
    expect(isValid).to.eq(true);
  });

  it("Command.copy() should produce a deep copy", () => {
    const c1: PCommand = new PCommand(BigInt(10), newPubKey, BigInt(0), BigInt(9), BigInt(1), BigInt(123));

    // shallow copy
    const c2 = c1;
    c1.nonce = BigInt(9999);
    expect(c1.nonce.toString()).to.eq(c2.nonce.toString());

    // deep copy
    const c3 = c1.copy();
    c1.nonce = BigInt(8888);

    expect(c1.nonce.toString()).not.to.eq(c3.nonce.toString());
  });

  it("message.copy() should produce a deep copy", () => {
    const m1 = new Message(BigInt(1), [
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
    ]);

    const m2 = m1.copy();
    expect(m2.equals(m1)).to.eq(true);
  });

  it("message.asCircuitInputs() should return a array", () => {
    const m1 = new Message(BigInt(1), [
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
    ]);

    const arr = m1.asCircuitInputs();
    expect(arr.length).to.eq(11);
    expect(arr[0]).to.eq(BigInt(1));
    expect(arr[1]).to.eq(BigInt(2));
    expect(arr[2]).to.eq(BigInt(3));
    expect(arr[3]).to.eq(BigInt(4));
    expect(arr[4]).to.eq(BigInt(5));
    expect(arr[5]).to.eq(BigInt(6));
    expect(arr[6]).to.eq(BigInt(7));
    expect(arr[7]).to.eq(BigInt(8));
    expect(arr[8]).to.eq(BigInt(9));
    expect(arr[9]).to.eq(BigInt(10));
    expect(arr[10]).to.eq(BigInt(11));
    expect(arr).to.be.instanceOf(Array);
  });

  describe("TCommand", () => {
    const stateIndex = BigInt(0);
    const amount = BigInt(100);
    const pollId = BigInt(1);
    const tCommand = new TCommand(stateIndex, amount, pollId);

    it("copy should produce a deep copy", () => {
      const c = tCommand.copy();
      expect(c.equals(tCommand)).to.eq(true);
    });
  });
});
