import benny from "benny";

import { IncrementalQuinTree, hash5 } from "../../index";

const NAME = "merkle-trees";

export default function runTrees(): void {
  const treeDepth = 2;
  const numberOfLeaves = 5 ** treeDepth;

  benny.suite(
    NAME,

    benny.add(`MACI - insert, update, generate and verify proof for ${numberOfLeaves} leaves`, () => {
      const tree5 = new IncrementalQuinTree(treeDepth, BigInt(0), 5, hash5);

      for (let i = 0; i < numberOfLeaves; i += 1) {
        tree5.insert(BigInt(i));
      }

      for (let i = 0; i < numberOfLeaves; i += 1) {
        tree5.update(i, BigInt(0));
      }

      tree5.verifyProof(tree5.genProof(5));
    }),

    benny.cycle(),
    benny.complete((results) => {
      results.results.forEach((result) => {
        // eslint-disable-next-line no-console
        console.log(`${result.name}: mean time: ${result.details.mean.toFixed(2)}`);
      });
    }),

    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, version: "1.0.0", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "chart.html", details: true }),
    benny.save({ folder: "ts/__benchmarks__/results", file: NAME, format: "table.html", details: true }),
  );
}
