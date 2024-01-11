import { expect } from "chai";
import tester from "circom_tester";
import { stringifyBigInts } from "maci-crypto";

import path from "path";

import { getSignal } from "./utils/utils";

describe("Splice circuit", () => {
  let circuit: tester.WasmTester;
  before(async () => {
    const circuitPath = path.resolve(__dirname, "../../circom/test", `splicer_test.circom`);
    circuit = await tester.wasm(circuitPath);
  });

  it("should output the correct reconstructed level", async () => {
    for (let index = 0; index < 5; index += 1) {
      const items = [0n, 20n, 30n, 40n];
      const leaf = 10n;
      const circuitInputs = stringifyBigInts({ in: items, leaf, index: BigInt(index) });

      // eslint-disable-next-line no-await-in-loop
      const witness = await circuit.calculateWitness(circuitInputs);
      // eslint-disable-next-line no-await-in-loop
      await circuit.checkConstraints(witness);

      const output: bigint[] = [];
      for (let i = 0; i < items.length + 1; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const selected = await getSignal(circuit, witness, `out[${i}]`);
        output.push(BigInt(selected));
      }
      items.splice(index, 0, leaf);

      expect(JSON.stringify(stringifyBigInts(items.map(BigInt)))).to.be.eq(
        JSON.stringify(stringifyBigInts(output.map(String))),
      );
    }
  });
});
