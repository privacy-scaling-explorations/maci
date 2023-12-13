import path from "path";
import tester from "circom_tester";
import { expect } from "chai";
import { getSignal } from "./utils/utils";

describe("CalculateTotal circuit", () => {
  const circuitPath = path.resolve(__dirname, "../../circom/test", `calculateTotal_test.circom`);
  let circuit: tester.WasmTester;

  before(async () => {
    circuit = await tester.wasm(circuitPath);
  });

  it("should correctly sum a list of values", async () => {
    const nums: number[] = [];
    for (let i = 0; i < 6; i++) {
      nums.push(Math.floor(Math.random() * 100));
    }
    const sum = nums.reduce((a, b) => a + b, 0);

    const circuitInputs = {
      nums,
    };

    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);
    const result = await getSignal(circuit, witness, "sum");
    expect(result.toString()).to.be.eq(sum.toString());
  });
});
