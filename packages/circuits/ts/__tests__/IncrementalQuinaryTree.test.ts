import { IncrementalQuinTree, hash5 } from "@maci-protocol/crypto";
import { r } from "@zk-kit/baby-jubjub";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { type WitnessTester } from "circomkit";
import fc, { type Arbitrary } from "fast-check";

import { getSignal, circomkitInstance } from "./utils/utils";

chai.use(chaiAsPromised);

describe("Incremental Quinary Tree (IQT)", function test() {
  this.timeout(2250000);

  const leavesPerNode = 5;
  const treeDepth = 3;

  let circuitLeafExists: WitnessTester<["leaf", "path_elements", "path_indices", "root"]>;
  let circuitGeneratePathIndices: WitnessTester<["index"], ["out"]>;
  let circuitQuinarySelector: WitnessTester<["in", "index"], ["out"]>;
  let splicerCircuit: WitnessTester<["in", "leaf", "index"], ["out"]>;
  let quinaryCheckRoot: WitnessTester<["leaves"], ["root"]>;

  before(async () => {
    circuitLeafExists = await circomkitInstance.WitnessTester("QuinaryLeafExists", {
      file: "./utils/trees/QuinaryLeafExists",
      template: "QuinaryLeafExists",
      params: [3],
    });

    circuitGeneratePathIndices = await circomkitInstance.WitnessTester("QuinaryGeneratePathIndices", {
      file: "./utils/trees/QuinaryGeneratePathIndices",
      template: "QuinaryGeneratePathIndices",
      params: [4],
    });

    circuitQuinarySelector = await circomkitInstance.WitnessTester("QuinarySelector", {
      file: "./utils/trees/QuinarySelector",
      template: "QuinarySelector",
      params: [5],
    });

    splicerCircuit = await circomkitInstance.WitnessTester("Splicer", {
      file: "./utils/trees/Splicer",
      template: "Splicer",
      params: [4],
    });

    quinaryCheckRoot = await circomkitInstance.WitnessTester("QuinaryCheckRoot", {
      file: "./utils/trees/QuinaryCheckRoot",
      template: "QuinaryCheckRoot",
      params: [3],
    });
  });

  describe("QuinarySelector", () => {
    it("should return the correct value", async () => {
      const circuitInputs = {
        index: 0n,
        in: [1n, 2n, 3n, 4n, 5n],
      };

      const witness = await circuitQuinarySelector.calculateWitness(circuitInputs);
      await circuitQuinarySelector.expectConstraintPass(witness);

      const out = await getSignal(circuitQuinarySelector, witness, "out");
      expect(out.toString()).to.be.eq("1");
    });

    it("should throw when the index is out of range", async () => {
      const circuitInputs = {
        index: 5n,
        in: [1n, 2n, 3n, 4n, 5n],
      };

      await expect(circuitQuinarySelector.calculateWitness(circuitInputs)).to.be.rejectedWith("Assert Failed.");
    });

    it("should check the correct value [fuzz]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(),
          fc.array(fc.bigInt({ min: 0n, max: r - 1n }), { minLength: leavesPerNode, maxLength: leavesPerNode }),
          async (index: number, elements: bigint[]) => {
            fc.pre(elements.length > index);

            const witness = await circuitQuinarySelector.calculateWitness({ index: BigInt(index), in: elements });
            await circuitQuinarySelector.expectConstraintPass(witness);
            const out = await getSignal(circuitQuinarySelector, witness, "out");

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

            const witness = await circuitQuinarySelector.calculateWitness({ index: BigInt(index), in: elements });
            await circuitQuinarySelector.expectConstraintPass(witness);
            const out = await getSignal(circuitQuinarySelector, witness, "out");

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

            const circuit = await circomkitInstance.WitnessTester("QuinarySelector", {
              file: "./utils/trees/QuinarySelector",
              template: "QuinarySelector",
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

  describe("QuinaryGeneratePathIndices", () => {
    it("should generate the correct path indices", async () => {
      const circuitInputs = {
        index: 30n,
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

            const witness = await circomkitInstance.WitnessTester("QuinaryGeneratePathIndices", {
              file: "./utils/trees/QuinaryGeneratePathIndices",
              template: "QuinaryGeneratePathIndices",
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

            const circuit = await circomkitInstance.WitnessTester("QuinaryGeneratePathIndices", {
              file: "./utils/trees/QuinaryGeneratePathIndices",
              template: "QuinaryGeneratePathIndices",
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

  describe("QuinaryLeafExists", () => {
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
        path_indices: proof.pathIndices,
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
        path_indices: [0n, 1n, 1n],
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
            const circuit = await circomkitInstance.WitnessTester("QuinaryLeafExists", {
              file: "./utils/trees/QuinaryLeafExists",
              template: "QuinaryLeafExists",
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
              path_indices: proof.pathIndices,
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

  describe("QuinaryCheckRoot", () => {
    it("should compute the correct merkle root", async () => {
      const leaves = Array<bigint>(leavesPerNode ** treeDepth).fill(5n);

      const circuitInputs = {
        leaves,
      };

      const tree = new IncrementalQuinTree(3, 0n, 5, hash5);
      leaves.forEach((leaf) => {
        tree.insert(leaf);
      });

      const witness = await quinaryCheckRoot.calculateWitness(circuitInputs);
      await quinaryCheckRoot.expectConstraintPass(witness);

      const circuitRoot = await getSignal(quinaryCheckRoot, witness, "root");
      expect(circuitRoot.toString()).to.be.eq(tree.root.toString());
    });

    it("should not accept less leaves than a full tree", async () => {
      const leaves = Array<bigint>(leavesPerNode ** treeDepth - 1).fill(5n);

      const circuitInputs = {
        leaves,
      };

      await expect(quinaryCheckRoot.calculateWitness(circuitInputs)).to.be.rejectedWith(
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
        const circuit = await circomkitInstance.WitnessTester("QuinaryCheckRoot", {
          file: "./utils/trees/QuinaryCheckRoot",
          template: "QuinaryCheckRoot",
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
