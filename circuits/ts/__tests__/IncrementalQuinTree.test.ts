import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import tester from "circom_tester";
import { IncrementalQuinTree, hash5, stringifyBigInts } from "maci-crypto";

import path from "path";

import { getSignal } from "./utils/utils";

chai.use(chaiAsPromised);

describe("IncrementalQuinTree circuit", function test() {
  this.timeout(50000);

  const leavesPerNode = 5;
  const treeDepth = 3;

  let circuitLeafExists: tester.WasmTester;
  let circuitGeneratePathIndices: tester.WasmTester;
  let circuitQuinSelector: tester.WasmTester;
  let splicerCircuit: tester.WasmTester;

  before(async () => {
    circuitLeafExists = await tester.wasm(
      path.resolve(__dirname, "../../circom/test", `quinTreeLeafExists_test.circom`),
    );
    circuitGeneratePathIndices = await tester.wasm(
      path.resolve(__dirname, "../../circom/test", `quinGeneratePathIndices_test.circom`),
    );
    circuitQuinSelector = await tester.wasm(path.resolve(__dirname, "../../circom/test", `quinSelector_test.circom`));
    splicerCircuit = await tester.wasm(path.resolve(__dirname, "../../circom/test", `splicer_test.circom`));
  });

  describe("QuinSelector", () => {
    it("should return the correct value", async () => {
      const circuitInputs = stringifyBigInts({
        index: 0n,
        in: [1n, 2n, 3n, 4n, 5n],
      });

      const witness = await circuitQuinSelector.calculateWitness(circuitInputs, true);
      await circuitQuinSelector.checkConstraints(witness);

      const out = await getSignal(circuitQuinSelector, witness, "out");
      expect(out.toString()).to.be.eq("1");
    });

    it("should throw when the index is out of range", async () => {
      const circuitInputs = stringifyBigInts({
        index: 5n,
        in: [1n, 2n, 3n, 4n, 5n],
      });

      await expect(circuitQuinSelector.calculateWitness(circuitInputs, true)).to.be.rejectedWith("Assert Failed.");
    });
  });

  describe("Splicer", () => {
    it("should insert a value at the correct index", async () => {
      const circuitInputs = stringifyBigInts({
        in: [5n, 3n, 20n, 44n],
        leaf: 0n,
        index: 2n,
      });

      const witness = await splicerCircuit.calculateWitness(circuitInputs, true);
      await splicerCircuit.checkConstraints(witness);

      const out1 = await getSignal(splicerCircuit, witness, "out[0]");
      const out2 = await getSignal(splicerCircuit, witness, "out[1]");
      const out3 = await getSignal(splicerCircuit, witness, "out[2]");
      const out4 = await getSignal(splicerCircuit, witness, "out[3]");
      const out5 = await getSignal(splicerCircuit, witness, "out[4]");
      expect(out1.toString()).to.eq("5");
      expect(out2.toString()).to.eq("3");
      expect(out3.toString()).to.eq("0");
      expect(out4.toString()).to.eq("20");
      expect(out5.toString()).to.eq("44");
    });
  });

  describe("QuinGeneratePathIndices", () => {
    it("should generate the correct path indices", async () => {
      const circuitInputs = stringifyBigInts({
        in: 30n,
      });

      const witness = await circuitGeneratePathIndices.calculateWitness(circuitInputs, true);
      await circuitGeneratePathIndices.checkConstraints(witness);

      const out1 = await getSignal(circuitGeneratePathIndices, witness, "out[0]");
      const out2 = await getSignal(circuitGeneratePathIndices, witness, "out[1]");
      const out3 = await getSignal(circuitGeneratePathIndices, witness, "out[2]");
      const out4 = await getSignal(circuitGeneratePathIndices, witness, "out[3]");

      expect(out1.toString()).to.be.eq("0");
      expect(out2.toString()).to.be.eq("1");
      expect(out3.toString()).to.be.eq("1");
      expect(out4.toString()).to.be.eq("0");
    });
  });

  describe("QuinLeafExists", () => {
    it("should exit correctly when provided the correct leaf", async () => {
      const leaves = [1n, 2n, 3n, 4n, 5n];
      const tree = new IncrementalQuinTree(treeDepth, 0n, leavesPerNode, hash5);
      leaves.forEach((leaf) => {
        tree.insert(leaf);
      });

      const proof = tree.genMerklePath(2);

      const circuitInputs = stringifyBigInts({
        root: tree.root,
        leaf: 3n,
        path_elements: proof.pathElements,
        path_index: proof.indices.map((index) => index.toString()),
      });

      const witness = await circuitLeafExists.calculateWitness(circuitInputs, true);
      await circuitLeafExists.checkConstraints(witness);
    });

    it("should throw when provided an incorrect leaf", async () => {
      const circuitInputs = stringifyBigInts({
        root: 30n,
        leaf: 0n,
        path_elements: [
          [1n, 1n, 0n, 0n],
          [1n, 1n, 0n, 1n],
          [1n, 1n, 1n, 0n],
        ],
        path_index: [0n, 1n, 1n],
      });

      await expect(circuitLeafExists.calculateWitness(circuitInputs, true)).to.be.rejectedWith("Assert Failed.");
    });
  });
});
