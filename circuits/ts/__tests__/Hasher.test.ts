import { r } from "@zk-kit/baby-jubjub";
import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";
import { genRandomSalt, hash5, hash4, hash3, hash2 } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Poseidon hash circuits", function test() {
  this.timeout(900000);

  describe("Poseidon", () => {
    describe("PoseidonHasher", () => {
      let circuit: WitnessTester<["inputs"], ["out"]>;

      it("correctly hashes 2 random values in order", async () => {
        const n = 2;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "./utils/hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: n, maxLength: n }),
            async (preImages: bigint[]) => {
              const witness = await circuit.calculateWitness({
                inputs: preImages,
              });
              await circuit.expectConstraintPass(witness);
              const output = await getSignal(circuit, witness, "out");
              const outputJS = hash2(preImages);

              return output === outputJS;
            },
          ),
        );
      });

      it("correctly hashes 3 random values", async () => {
        const n = 3;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "./utils/hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: n, maxLength: n }),
            async (preImages: bigint[]) => {
              const witness = await circuit.calculateWitness({
                inputs: preImages,
              });
              await circuit.expectConstraintPass(witness);
              const output = await getSignal(circuit, witness, "out");
              const outputJS = hash3(preImages);

              return output === outputJS;
            },
          ),
        );
      });

      it("correctly hashes 4 random values", async () => {
        const n = 4;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "./utils/hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: n, maxLength: n }),
            async (preImages: bigint[]) => {
              const witness = await circuit.calculateWitness({
                inputs: preImages,
              });
              await circuit.expectConstraintPass(witness);
              const output = await getSignal(circuit, witness, "out");
              const outputJS = hash4(preImages);

              return output === outputJS;
            },
          ),
        );
      });

      it("correctly hashes 5 random values", async () => {
        const n = 5;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "./utils/hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: n, maxLength: n }),
            async (preImages: bigint[]) => {
              const witness = await circuit.calculateWitness({
                inputs: preImages,
              });
              await circuit.expectConstraintPass(witness);
              const output = await getSignal(circuit, witness, "out");
              const outputJS = hash5(preImages);

              return output === outputJS;
            },
          ),
        );
      });
    });
  });

  describe("MessageHasher", () => {
    let circuit: WitnessTester<["in", "encPubKey"], ["hash"]>;

    before(async () => {
      circuit = await circomkitInstance.WitnessTester("messageHasher", {
        file: "./utils/hashers",
        template: "MessageHasher",
      });
    });

    it("should correctly hash a message", async () => {
      const k = new Keypair();
      const random50bitBigInt = (): bigint =>
        // eslint-disable-next-line no-bitwise
        ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

      const command: PCommand = new PCommand(
        random50bitBigInt(),
        k.pubKey,
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        genRandomSalt(),
      );

      const { privKey } = new Keypair();
      const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, k.pubKey);
      const signature = command.sign(privKey);
      const message = command.encrypt(signature, ecdhSharedKey);
      const messageHash = message.hash(k.pubKey);
      const circuitInputs = {
        in: message.asCircuitInputs(),
        encPubKey: k.pubKey.asCircuitInputs() as unknown as [bigint, bigint],
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
            const { pubKey, privKey } = new Keypair();

            const command: PCommand = new PCommand(
              random50bitBigInt(stateIndex),
              pubKey,
              random50bitBigInt(voteOptionIndex),
              random50bitBigInt(newVoteWeight),
              random50bitBigInt(nonce),
              random50bitBigInt(pollId),
              salt,
            );

            const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey);
            const signature = command.sign(privKey);
            const message = command.encrypt(signature, ecdhSharedKey);
            const messageHash = message.hash(pubKey);
            const circuitInputs = {
              in: message.asCircuitInputs(),
              encPubKey: pubKey.asCircuitInputs() as unknown as [bigint, bigint],
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
});
