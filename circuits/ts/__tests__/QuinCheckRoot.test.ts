import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { type WitnessTester } from "circomkit";
import { IncrementalQuinTree, hash5 } from "maci-crypto";

import { getSignal, circomkitInstance } from "./utils/utils";

chai.use(chaiAsPromised);

describe("QuinCheckRoot circuit", function test() {
  this.timeout(50000);

  const leavesPerNode = 5;
  const treeDepth = 3;

  let circuit: WitnessTester<["leaves"], ["root"]>;

  before(async () => {
    circuit = await circomkitInstance.WitnessTester("checkRoot", {
      file: "trees/checkRoot",
      template: "QuinCheckRoot",
      params: [3],
    });
  });

  it("should compute the correct merkle root", async () => {
    const leaves = Array<bigint>(leavesPerNode ** treeDepth).fill(5n);

    const circuitInputs = {
      leaves,
    };

    const tree = new IncrementalQuinTree(3, 0n, 5, hash5);
    leaves.forEach((leaf) => {
      tree.insert(leaf);
    });

    const witness = await circuit.calculateWitness(circuitInputs);
    await circuit.expectConstraintPass(witness);

    const circuitRoot = await getSignal(circuit, witness, "root");
    expect(circuitRoot.toString()).to.be.eq(tree.root.toString());
  });

  it("should not accept less leaves than a full tree", async () => {
    const leaves = Array<bigint>(leavesPerNode ** treeDepth - 1).fill(5n);

    const circuitInputs = {
      leaves,
    };

    await expect(circuit.calculateWitness(circuitInputs)).to.be.rejectedWith(
      "Not enough values for input signal leaves",
    );
  });
});
