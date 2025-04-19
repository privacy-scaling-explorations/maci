import { hash5, hash4, hash3, hash2 } from "@maci-protocol/crypto";
import { r } from "@zk-kit/baby-jubjub";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Poseidon hash circuits", function test() {
  this.timeout(900000);

  describe("PoseidonHasher", () => {
    let circuit: WitnessTester<["inputs"], ["out"]>;

    it("correctly hashes 2 random values in order", async () => {
      const n = 2;

      circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
        file: "./utils/PoseidonHasher",
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
        file: "./utils/PoseidonHasher",
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
        file: "./utils/PoseidonHasher",
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
        file: "./utils/PoseidonHasher",
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
