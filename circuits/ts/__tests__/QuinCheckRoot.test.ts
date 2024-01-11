import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import tester from "circom_tester";
import { IncrementalQuinTree, hash5, stringifyBigInts } from "maci-crypto";

import path from "path";

import { getSignal } from "./utils/utils";

chai.use(chaiAsPromised);

describe("QuinCheckRoot circuit", function test() {
  this.timeout(50000);
  const circuitPath = path.resolve(__dirname, "../../circom/test", `quinTreeCheckRoot_test.circom`);
  let circuit: tester.WasmTester;

  const leavesPerNode = 5;
  const treeDepth = 3;

  before(async () => {
    circuit = await tester.wasm(circuitPath);
  });

  it("should compute the correct merkle root", async () => {
    const leaves = Array<bigint>(leavesPerNode ** treeDepth).fill(5n);

    const circuitInputs = stringifyBigInts({
      leaves,
    });

    const tree = new IncrementalQuinTree(3, 0n, 5, hash5);
    leaves.forEach((leaf) => {
      tree.insert(leaf);
    });

    const witness = await circuit.calculateWitness(circuitInputs, true);
    await circuit.checkConstraints(witness);

    const circuitRoot = await getSignal(circuit, witness, "root");
    expect(circuitRoot.toString()).to.be.eq(tree.root.toString());
  });

  it("should not accept less leaves than a full tree", async () => {
    const leaves = Array<bigint>(leavesPerNode ** treeDepth - 1).fill(5n);

    const circuitInputs = stringifyBigInts({
      leaves,
    });

    await expect(circuit.calculateWitness(circuitInputs, true)).to.be.rejectedWith(
      "Not enough values for input signal leaves",
    );
  });
});
