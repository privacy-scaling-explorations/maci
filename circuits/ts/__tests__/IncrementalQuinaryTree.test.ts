import { r } from "@zk-kit/baby-jubjub";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { type WitnessTester } from "circomkit";
import fc, { type Arbitrary } from "fast-check";
import { IncrementalQuinTree, hash5 } from "maci-crypto";

import { getSignal, circomkitInstance } from "./utils/utils";

chai.use(chaiAsPromised);

describe("Incremental Quinary Tree (IQT)", function test() {
  this.timeout(2250000);

  const leavesPerNode = 5;
  const treeDepth = 3;

  let circuitLeafExists: WitnessTester<["leaf", "path_elements", "path_index", "root"]>;
  let circuitGeneratePathIndices: WitnessTester<["in"], ["out"]>;
  let circuitQuinSelector: WitnessTester<["in", "index"], ["out"]>;
  let splicerCircuit: WitnessTester<["in", "leaf", "index"], ["out"]>;
  let quinCheckRoot: WitnessTester<["leaves"], ["root"]>;

  before(async () => {
    circuitLeafExists = await circomkitInstance.WitnessTester("quinLeafExists", {
      file: "./trees/incrementalQuinaryTree",
      template: "QuinLeafExists",
      params: [3],
    });

    circuitGeneratePathIndices = await circomkitInstance.WitnessTester("quinGeneratePathIndices", {
      file: "./trees/incrementalQuinaryTree",
      template: "QuinGeneratePathIndices",
      params: [4],
    });

    circuitQuinSelector = await circomkitInstance.WitnessTester("quinSelector", {
      file: "./trees/incrementalQuinaryTree",
      template: "QuinSelector",
      params: [5],
    });

    splicerCircuit = await circomkitInstance.WitnessTester("splicer", {
      file: "./trees/incrementalQuinaryTree",
      template: "Splicer",
      params: [4],
    });

    quinCheckRoot = await circomkitInstance.WitnessTester("quinCheckRoot", {
      file: "./trees/incrementalQuinaryTree",
      template: "QuinCheckRoot",
      params: [3],
    });
  });

  describe("QuinSelector", () => {
    it("should return the correct value", async () => {
      const circuitInputs = {
        index: 0n,
        in: [1n, 2n, 3n, 4n, 5n],
      };

      const witness = await circuitQuinSelector.calculateWitness(circuitInputs);
      await circuitQuinSelector.expectConstraintPass(witness);

      const out = await getSignal(circuitQuinSelector, witness, "out");
      expect(out.toString()).to.be.eq("1");
    });

    it("should throw when the index is out of range", async () => {
      const circuitInputs = {
        index: 5n,
        in: [1n, 2n, 3n, 4n, 5n],
      };

      await expect(circuitQuinSelector.calculateWitness(circuitInputs)).to.be.rejectedWith("Assert Failed.");
    });

    it("should check the correct value [fuzz]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(),
          fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: leavesPerNode, maxLength: leavesPerNode }),
          async (index: number, elements: bigint[]) => {
            fc.pre(elements.length > index);

            const witness = await circuitQuinSelector.calculateWitness({ index: BigInt(index), in: elements });
            await circuitQuinSelector.expectConstraintPass(witness);
            const out = await getSignal(circuitQuinSelector, witness, "out");

            return out.toString() === elements[index].toString();
          },
        ),
      );
    });

    it("should loop the value if number is greater that r [fuzz]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(),
          fc.array(fc.bigInt({ min: r }), { minLength: leavesPerNode, maxLength: leavesPerNode }),
          async (index: number, elements: bigint[]) => {
            fc.pre(elements.length > index);

            const witness = await circuitQuinSelector.calculateWitness({ index: BigInt(index), in: elements });
            await circuitQuinSelector.expectConstraintPass(witness);
            const out = await getSignal(circuitQuinSelector, witness, "out");

            return out.toString() === (elements[index] % r).toString();
          },
        ),
      );
    });

    it("should throw error if index is out of bounds [fuzz]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(),
          fc.array(fc.bigInt({ min: 0n }), { minLength: 1 }),
          async (index: number, elements: bigint[]) => {
            fc.pre(index >= elements.length);

            const circuit = await circomkitInstance.WitnessTester("quinSelector", {
              file: "./trees/incrementalQuinaryTree",
              template: "QuinSelector",
              params: [elements.length],
            });

            return circuit
              .calculateWitness({ index: BigInt(index), in: elements })
              .then(() => false)
              .catch((error: Error) => error.message.includes("Assert Failed"));
          },
        ),
      );
    });
  });

  describe("Splicer", () => {
    it("should insert a value at the correct index", async () => {
      const circuitInputs = {
        in: [5n, 3n, 20n, 44n],
        leaf: 0n,
        index: 2n,
      };

      const witness = await splicerCircuit.calculateWitness(circuitInputs);
      await splicerCircuit.expectConstraintPass(witness);

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

    it("should check value insertion [fuzz]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(),
          fc.bigInt({ min: 0n, max: r - 1n }),
          fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: leavesPerNode - 1, maxLength: leavesPerNode - 1 }),
          async (index: number, leaf: bigint, elements: bigint[]) => {
            fc.pre(index < elements.length);

            const witness = await splicerCircuit.calculateWitness({
              in: elements,
              leaf,
              index: BigInt(index),
            });
            await splicerCircuit.expectConstraintPass(witness);

            const out: bigint[] = [];

            for (let i = 0; i < elements.length + 1; i += 1) {
              // eslint-disable-next-line no-await-in-loop
              const value = await getSignal(splicerCircuit, witness, `out[${i}]`);
              out.push(value);
            }

            return out.toString() === [...elements.slice(0, index), leaf, ...elements.slice(index)].toString();
          },
        ),
      );
    });

    it("should throw error if index is out of bounds [fuzz]", async () => {
      const maxAllowedIndex = 7;

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: maxAllowedIndex + 1 }),
          fc.bigInt({ min: 0n, max: r - 1n }),
          fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: leavesPerNode - 1, maxLength: leavesPerNode - 1 }),
          async (index: number, leaf: bigint, elements: bigint[]) => {
            fc.pre(index > elements.length);

            return splicerCircuit
              .calculateWitness({
                in: elements,
                leaf,
                index: BigInt(index),
              })
              .then(() => false)
              .catch((error: Error) => error.message.includes("Assert Failed"));
          },
        ),
      );
    });
  });

  describe("QuinGeneratePathIndices", () => {
    it("should generate the correct path indices", async () => {
      const circuitInputs = {
        in: 30n,
      };

      const witness = await circuitGeneratePathIndices.calculateWitness(circuitInputs);
      await circuitGeneratePathIndices.expectConstraintPass(witness);

      const out1 = await getSignal(circuitGeneratePathIndices, witness, "out[0]");
      const out2 = await getSignal(circuitGeneratePathIndices, witness, "out[1]");
      const out3 = await getSignal(circuitGeneratePathIndices, witness, "out[2]");
      const out4 = await getSignal(circuitGeneratePathIndices, witness, "out[3]");

      expect(out1.toString()).to.be.eq("0");
      expect(out2.toString()).to.be.eq("1");
      expect(out3.toString()).to.be.eq("1");
      expect(out4.toString()).to.be.eq("0");
    });

    it("should throw error if input is out of bounds [fuzz]", async () => {
      const maxLevel = 1_000n;

      await fc.assert(
        fc.asyncProperty(
          fc.bigInt({ min: 1n, max: maxLevel }),
          fc.bigInt({ min: 1n, max: r - 1n }),
          async (levels: bigint, input: bigint) => {
            fc.pre(BigInt(leavesPerNode) ** levels < input);

            const witness = await circomkitInstance.WitnessTester("quinGeneratePathIndices", {
              file: "./trees/incrementalQuinaryTree",
              template: "QuinGeneratePathIndices",
              params: [levels],
            });

            return witness
              .calculateWitness({ in: input })
              .then(() => false)
              .catch((error: Error) => error.message.includes("Assert Failed"));
          },
        ),
      );
    });

    it("should check generation of path indices [fuzz]", async () => {
      const maxLevel = 100n;

      await fc.assert(
        fc.asyncProperty(
          fc.bigInt({ min: 1n, max: maxLevel }),
          fc.bigInt({ min: 1n, max: r - 1n }),
          async (levels: bigint, input: bigint) => {
            fc.pre(BigInt(leavesPerNode) ** levels > input);

            const tree = new IncrementalQuinTree(Number(levels), 0n, 5, hash5);

            const circuit = await circomkitInstance.WitnessTester("quinGeneratePathIndices", {
              file: "./trees/incrementalQuinaryTree",
              template: "QuinGeneratePathIndices",
              params: [levels],
            });

            const witness = await circuit.calculateWitness({
              in: input,
            });
            await circuit.expectConstraintPass(witness);

            const values: bigint[] = [];

            for (let i = 0; i < levels; i += 1) {
              // eslint-disable-next-line no-await-in-loop
              const value = await getSignal(circuit, witness, `out[${i}]`);
              tree.insert(value);
              values.push(value);
            }

            const { pathIndices } = tree.genProof(Number(input));

            const isEqual = pathIndices.every((item, index) => item.toString() === values[index].toString());

            return values.length === pathIndices.length && isEqual;
          },
        ),
      );
    });
  });

  describe("QuinLeafExists", () => {
    it("should exit correctly when provided the correct leaf", async () => {
      const leaves = [1n, 2n, 3n, 4n, 5n];
      const tree = new IncrementalQuinTree(treeDepth, 0n, leavesPerNode, hash5);
      leaves.forEach((leaf) => {
        tree.insert(leaf);
      });

      const proof = tree.genProof(2);

      const circuitInputs = {
        root: tree.root,
        leaf: 3n,
        path_elements: proof.pathElements,
        path_index: proof.pathIndices,
      };

      const witness = await circuitLeafExists.calculateWitness(circuitInputs);
      await circuitLeafExists.expectConstraintPass(witness);
    });

    it("should throw when provided an incorrect leaf", async () => {
      const circuitInputs = {
        root: 30n,
        leaf: 0n,
        path_elements: [
          [1n, 1n, 0n, 0n],
          [1n, 1n, 0n, 1n],
          [1n, 1n, 1n, 0n],
        ],
        path_index: [0n, 1n, 1n],
      };

      await expect(circuitLeafExists.calculateWitness(circuitInputs)).to.be.rejectedWith("Assert Failed.");
    });

    it("should check the correct leaf [fuzz]", async () => {
      // TODO: seems js implementation doesn't work with levels more than 22
      const maxLevel = 22;

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: maxLevel }),
          fc.nat({ max: leavesPerNode - 1 }),
          fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: leavesPerNode, maxLength: leavesPerNode }),
          async (levels: number, index: number, leaves: bigint[]) => {
            const circuit = await circomkitInstance.WitnessTester("quinLeafExists", {
              file: "./trees/incrementalQuinaryTree",
              template: "QuinLeafExists",
              params: [levels],
            });

            const tree = new IncrementalQuinTree(levels, 0n, leavesPerNode, hash5);
            leaves.forEach((value) => {
              tree.insert(value);
            });

            const proof = tree.genProof(index);

            const witness = await circuit.calculateWitness({
              root: tree.root,
              leaf: leaves[index],
              path_elements: proof.pathElements,
              path_index: proof.pathIndices,
            });

            return circuit
              .expectConstraintPass(witness)
              .then(() => true)
              .catch(() => false);
          },
        ),
      );
    });
  });

  describe("QuinCheckRoot", () => {
    it("should compute the correct merkle root", async () => {
      const leaves = Array<bigint>(leavesPerNode ** treeDepth).fill(5n);

      const circuitInputs = {
        leaves,
      };

      const tree = new IncrementalQuinTree(3, 0n, 5, hash5);
      leaves.forEach((leaf) => {
        tree.insert(leaf);
      });

      const witness = await quinCheckRoot.calculateWitness(circuitInputs);
      await quinCheckRoot.expectConstraintPass(witness);

      const circuitRoot = await getSignal(quinCheckRoot, witness, "root");
      expect(circuitRoot.toString()).to.be.eq(tree.root.toString());
    });

    it("should not accept less leaves than a full tree", async () => {
      const leaves = Array<bigint>(leavesPerNode ** treeDepth - 1).fill(5n);

      const circuitInputs = {
        leaves,
      };

      await expect(quinCheckRoot.calculateWitness(circuitInputs)).to.be.rejectedWith(
        "Not enough values for input signal leaves",
      );
    });

    describe("fuzz checks", () => {
      // Bigger values cause out of memory error due to number of elements (5 ** level)
      const maxLevel = 4;

      const generateLeaves = (levels: number): Arbitrary<bigint[]> =>
        fc.array(fc.bigInt({ min: 0n, max: r - 1n }), {
          minLength: leavesPerNode ** levels,
          maxLength: leavesPerNode ** levels,
        });

      const quinCheckRootTest = async (leaves: bigint[]): Promise<boolean> => {
        const levels = Math.floor(Math.log(leaves.length) / Math.log(leavesPerNode));
        const circuit = await circomkitInstance.WitnessTester("quinCheckRoot", {
          file: "./trees/incrementalQuinaryTree",
          template: "QuinCheckRoot",
          params: [levels],
        });

        const tree = new IncrementalQuinTree(levels, 0n, leavesPerNode, hash5);
        leaves.forEach((value) => {
          tree.insert(value);
        });

        return circuit
          .expectPass({ leaves }, { root: tree.root })
          .then(() => true)
          .catch(() => false);
      };

      for (let level = 0; level < maxLevel; level += 1) {
        it(`should check the computation of correct merkle root (level ${level + 1}) [fuzz]`, async () => {
          await fc.assert(
            fc.asyncProperty(generateLeaves(level + 1), async (leaves: bigint[]) => quinCheckRootTest(leaves)),
          );
        });
      }
    });
  });
});
