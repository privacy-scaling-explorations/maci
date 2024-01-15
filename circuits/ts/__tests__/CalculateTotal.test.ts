import { type WitnessTester } from "circomkit";

import { circomkitInstance } from "./utils/utils";

describe("CalculateTotal circuit", () => {
  let circuit: WitnessTester<["nums"], ["sum"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("calculateTotal", {
      file: "trees/calculateTotal",
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
});
