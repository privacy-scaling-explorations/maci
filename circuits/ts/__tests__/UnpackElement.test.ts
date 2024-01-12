import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { genRandomSalt } from "maci-crypto";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("UnpackElement circuit", () => {
  let circuit: WitnessTester<["in"], ["out"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("unpackElement", {
      file: "unpackElement",
      template: "UnpackElement",
      params: [5],
    });
  });

  it("should unpack a field element with 5 packed values correctly", async () => {
    const elements: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      let e = (BigInt(genRandomSalt().toString()) % BigInt(2 ** 50)).toString(2);
      while (e.length < 50) {
        e = `0${e}`;
      }
      elements.push(e);
    }

    const circuitInputs = {
      in: BigInt(`0b${elements.join("")}`),
    };

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const out = await getSignal(circuit, witness, `out[${i}]`);
      expect(BigInt(`0b${BigInt(out).toString(2)}`).toString()).to.be.eq(BigInt(`0b${elements[i]}`).toString());
    }
  });

  describe("unpackElement4", () => {
    before(async () => {
      circuit = await circomkitInstance.WitnessTester("unpackElement", {
        file: "unpackElement",
        template: "UnpackElement",
        params: [4],
      });
    });

    it("should unpack a field element with 4 packed values correctly", async () => {
      const elements: string[] = [];
      for (let i = 0; i < 4; i += 1) {
        let e = (BigInt(genRandomSalt().toString()) % BigInt(2 ** 50)).toString(2);
        while (e.length < 50) {
          e = `0${e}`;
        }
        elements.push(e);
      }

      const circuitInputs = {
        in: BigInt(`0b${elements.join("")}`),
      };

      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.expectConstraintPass(witness);

      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const out = await getSignal(circuit, witness, `out[${i}]`);
        expect(BigInt(`0b${BigInt(out).toString(2)}`).toString()).to.be.eq(BigInt(`0b${elements[i]}`).toString());
      }
    });
  });
});
