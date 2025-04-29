import { generateRandomSalt } from "@maci-protocol/crypto";
import { VoteCommand, Keypair } from "@maci-protocol/domainobjs";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("MessageHasher", function test() {
  this.timeout(900000);

  let circuit: WitnessTester<["in", "encryptionPublicKey"], ["hash"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("messageHasher", {
      file: "./utils/MessageHasher",
      template: "MessageHasher",
    });
  });

  it("should correctly hash a message", async () => {
    const keypair = new Keypair();
    const random50bitBigInt = (): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(generateRandomSalt().toString());

    const command: VoteCommand = new VoteCommand(
      random50bitBigInt(),
      keypair.publicKey,
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      random50bitBigInt(),
      generateRandomSalt(),
    );

    const { privateKey } = new Keypair();
    const ecdhSharedKey = Keypair.generateEcdhSharedKey(privateKey, keypair.publicKey);
    const signature = command.sign(privateKey);
    const message = command.encrypt(signature, ecdhSharedKey);
    const messageHash = message.hash(keypair.publicKey);
    const circuitInputs = {
      in: message.asCircuitInputs(),
      encryptionPublicKey: keypair.publicKey.asCircuitInputs() as unknown as [bigint, bigint],
    };
    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);
    const output = await getSignal(circuit, witness, "hash");
    expect(output.toString()).to.be.eq(messageHash.toString());
  });

  it("should correctly hash a message [fuzz]", async () => {
    const random50bitBigInt = (salt: bigint): bigint =>
      // eslint-disable-next-line no-bitwise
      ((BigInt(1) << BigInt(50)) - BigInt(1)) & salt;

    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 0n }),
        fc.bigInt({ min: 0n }),
        fc.bigInt({ min: 0n }),
        fc.bigInt({ min: 0n }),
        fc.bigInt({ min: 0n }),
        fc.bigInt({ min: 0n }),
        async (
          stateIndex: bigint,
          voteOptionIndex: bigint,
          newVoteWeight: bigint,
          nonce: bigint,
          pollId: bigint,
          salt: bigint,
        ) => {
          const { publicKey, privateKey } = new Keypair();

          const command: VoteCommand = new VoteCommand(
            random50bitBigInt(stateIndex),
            publicKey,
            random50bitBigInt(voteOptionIndex),
            random50bitBigInt(newVoteWeight),
            random50bitBigInt(nonce),
            random50bitBigInt(pollId),
            salt,
          );

          const ecdhSharedKey = Keypair.generateEcdhSharedKey(privateKey, publicKey);
          const signature = command.sign(privateKey);
          const message = command.encrypt(signature, ecdhSharedKey);
          const messageHash = message.hash(publicKey);
          const circuitInputs = {
            in: message.asCircuitInputs(),
            encryptionPublicKey: publicKey.asCircuitInputs() as unknown as [bigint, bigint],
          };
          const witness = await circuit.calculateWitness(circuitInputs);
          await circuit.expectConstraintPass(witness);
          const output = await getSignal(circuit, witness, "hash");

          return output === messageHash;
        },
      ),
    );
  });
});
