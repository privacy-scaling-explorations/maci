import { expect } from "chai";
import tester from "circom_tester";
import { genRandomSalt, stringifyBigInts } from "maci-crypto";

import path from "path";

import { getSignal } from "./utils/utils";

describe("UnpackElement circuit", () => {
  let circuit: tester.WasmTester;

  describe("UnpackElement", () => {
    before(async () => {
      const circuitPath = path.resolve(__dirname, "../../circom/test", `unpackElement_test.circom`);
      circuit = await tester.wasm(circuitPath);
    });

    it("Should unpack a field element with 5 packed values correctly", async () => {
      const elements: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        let e = (BigInt(genRandomSalt().toString()) % BigInt(2 ** 50)).toString(2);
        while (e.length < 50) {
          e = `0${e}`;
        }
        elements.push(e);
      }

      const circuitInputs = stringifyBigInts({
        in: BigInt(`0b${elements.join("")}`),
      });

      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.checkConstraints(witness);

      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const out = await getSignal(circuit, witness, `out[${i}]`);
        expect(BigInt(`0b${BigInt(out).toString(2)}`).toString()).to.be.eq(BigInt(`0b${elements[i]}`).toString());
      }
    });
  });

  describe("unpackElement4", () => {
    before(async () => {
      const circuitPath = path.resolve(__dirname, "../../circom/test", `unpackElement4_test.circom`);
      circuit = await tester.wasm(circuitPath);
    });

    it("Should unpack a field element with 4 packed values correctly", async () => {
      const elements: string[] = [];
      for (let i = 0; i < 4; i += 1) {
        let e = (BigInt(genRandomSalt().toString()) % BigInt(2 ** 50)).toString(2);
        while (e.length < 50) {
          e = `0${e}`;
        }
        elements.push(e);
      }

      const circuitInputs = stringifyBigInts({
        in: BigInt(`0b${elements.join("")}`),
      });

      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.checkConstraints(witness);

      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const out = await getSignal(circuit, witness, `out[${i}]`);
        expect(BigInt(`0b${BigInt(out).toString(2)}`).toString()).to.be.eq(BigInt(`0b${elements[i]}`).toString());
      }
    });
  });
});
