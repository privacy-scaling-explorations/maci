import { IncrementalQuinTree, hash5 } from "maci-crypto";
import { Ballot } from "maci-domainobjs";

import fs from "fs";
import path from "path";

const genEmptyBallotRootsContract = (): string => {
  const template = fs
    .readFileSync(path.resolve(__dirname, "..", "templates", "EmptyBallotRoots.sol.template"))
    .toString();

  // This hard-coded value should be consistent with the value of `stateTreeDepth` of MACI.sol
  const stateTreeDepth = process.env.STATE_TREE_DEPTH ? Number.parseInt(process.env.STATE_TREE_DEPTH, 10) : 10;

  let r = "";
  for (let i = 1; i < 6; i += 1) {
    const ballot = new Ballot(0, i);
    const z = ballot.hash();
    // The empty Ballot tree root
    const ballotTree = new IncrementalQuinTree(stateTreeDepth, BigInt(z.toString()), 5, hash5);

    r += `    emptyBallotRoots[${i - 1}] = uint256(${ballotTree.root});${i !== 5 ? "\n" : ""}`;
  }

  const generated = template.replace("<% ROOTS %>", r);
  return generated.trim();
};

if (require.main === module) {
  const generated = genEmptyBallotRootsContract();
  fs.writeFileSync(path.resolve(__dirname, "..", "contracts", "trees", "EmptyBallotRoots.sol"), `${generated}\n`);
}

export { genEmptyBallotRootsContract };
