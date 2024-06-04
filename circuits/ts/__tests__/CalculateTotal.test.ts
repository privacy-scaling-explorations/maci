import { r } from "@zk-kit/baby-jubjub";
import { type WitnessTester } from "circomkit";
import fc from "fast-check";

import { circomkitInstance, getSignal } from "./utils/utils";

describe("CalculateTotal circuit", function test() {
  this.timeout(900000);

  let circuit: WitnessTester<["nums"], ["sum"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("calculateTotal", {
      file: "./utils/calculateTotal",
      template: "CalculateTotal",
      params: [6],
    });
  });

  it("should correctly sum a list of values", async () => {
    const nums: number[] = [];

    for (let i = 0; i < 6; i += 1) {
      nums.push(Math.floor(Math.random() * 100));
    }

    const sum = nums.reduce((a, b) => a + b, 0);

    const circuitInputs = {
      nums,
    };

    await circuit.expectPass(circuitInputs, { sum });
  });

  it("should sum max value and loop back", async () => {
    const nums: bigint[] = [r, r, r, r, r, r];

    await circuit.expectPass({ nums }, { sum: 0n });
  });

  it("should sum max negative value and loop back", async () => {
    const nums: bigint[] = [-r, -r, -r, -r, -r, -r];

    await circuit.expectPass({ nums }, { sum: 0n });
  });

  it("should sum max positive and negative values without looping", async () => {
    const nums: bigint[] = [-r, r, -r, r, 1n, 2n];

    await circuit.expectPass({ nums }, { sum: 3n });
  });

  it("should correctly sum a list of values [fuzz]", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: 1 }), async (nums: bigint[]) => {
        const sum = nums.reduce((a, b) => a + b, 0n);
        fc.pre(sum <= r - 1n);

        const testCircuit = await circomkitInstance.WitnessTester("calculateTotal", {
          file: "./utils/calculateTotal",
          template: "CalculateTotal",
          params: [nums.length],
        });

        const witness = await testCircuit.calculateWitness({ nums });
        await testCircuit.expectConstraintPass(witness);
        const total = await getSignal(testCircuit, witness, "sum");

        return total === sum;
      }),
      { numRuns: 10_000 },
    );
  });
});
