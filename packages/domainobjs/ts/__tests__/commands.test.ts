import { generateRandomSalt } from "@maci-protocol/crypto";
import { expect } from "chai";

import { VoteCommand, Keypair } from "..";

describe("Commands", () => {
  const { privateKey, publicKey } = new Keypair();

  const ecdhSharedKey = Keypair.generateEcdhSharedKey(privateKey, publicKey);
  const random50bitBigInt = (): bigint =>
    // eslint-disable-next-line no-bitwise
    ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(generateRandomSalt().toString());

  describe("constructor", () => {
    it("should create a VoteCommand", () => {
      const command: VoteCommand = new VoteCommand(
        random50bitBigInt(),
        publicKey,
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        generateRandomSalt(),
      );
      expect(command).to.not.eq(null);
    });
  });

  describe("signature", () => {
    const command: VoteCommand = new VoteCommand(
      random50bitBigInt(),
      publicKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      generateRandomSalt(),
    );
    it("should produce a valid signature", () => {
      const signature = command.sign(privateKey);
      expect(command.verifySignature(signature, publicKey)).to.eq(true);
    });
  });

  describe("encryption", () => {
    const command: VoteCommand = new VoteCommand(
      random50bitBigInt(),
      publicKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      generateRandomSalt(),
    );

    const signature = command.sign(privateKey);

    describe("encrypt", () => {
      it("should encrypt a command", () => {
        const message = command.encrypt(signature, ecdhSharedKey);
        expect(message).to.not.eq(null);
      });
    });

    describe("decrypt", () => {
      const message = command.encrypt(signature, ecdhSharedKey);

      const decrypted = VoteCommand.decrypt(message, ecdhSharedKey);

      it("should decrypt a message and keep the correct values", () => {
        expect(decrypted).to.not.eq(null);
        expect(decrypted.command.equals(command)).to.eq(true);
        expect(decrypted.signature.R8[0].toString()).to.eq(signature.R8[0].toString());
        expect(decrypted.signature.R8[1].toString()).to.eq(signature.R8[1].toString());
        expect(decrypted.signature.S.toString()).to.eq(signature.S.toString());
      });

      it("should have a valid signature after decryption", () => {
        const decryptedForce = VoteCommand.decrypt(message, ecdhSharedKey, true);

        const isValid = decrypted.command.verifySignature(decrypted.signature, publicKey);
        expect(isValid).to.eq(true);

        const isValidForce = decryptedForce.command.verifySignature(decryptedForce.signature, publicKey);
        expect(isValidForce).to.eq(true);
      });
    });
  });

  describe("copy", () => {
    it("should produce a deep copy for VoteCommand", () => {
      const c1: VoteCommand = new VoteCommand(BigInt(10), publicKey, BigInt(0), BigInt(9), BigInt(1), BigInt(123));

      // shallow copy
      const c2 = c1;
      c1.nonce = BigInt(9999);
      expect(c1.nonce.toString()).to.eq(c2.nonce.toString());

      // deep copy
      const c3 = c1.copy();
      c1.nonce = BigInt(8888);

      expect(c1.nonce.toString()).not.to.eq(c3.nonce.toString());
    });
  });

  describe("deserialization/serialization", () => {
    describe("toJSON", () => {
      it("should produce a JSON object with valid values", () => {
        const c1: VoteCommand = new VoteCommand(BigInt(10), publicKey, BigInt(0), BigInt(9), BigInt(1), BigInt(123));
        const json = c1.toJSON();
        expect(json).to.not.eq(null);
        expect(json.stateIndex).to.eq("10");
        expect(json.voteOptionIndex).to.eq("0");
        expect(json.newVoteWeight).to.eq("9");
        expect(json.nonce).to.eq("1");
        expect(json.pollId).to.eq("123");
      });
    });

    describe("fromJSON", () => {
      it("should produce a VoteCommand from a JSON object", () => {
        const c1: VoteCommand = new VoteCommand(BigInt(10), publicKey, BigInt(0), BigInt(9), BigInt(1), BigInt(123));
        const json = c1.toJSON();
        const c2 = VoteCommand.fromJSON(json);
        expect(c2.equals(c1)).to.eq(true);
      });
    });
  });
});
