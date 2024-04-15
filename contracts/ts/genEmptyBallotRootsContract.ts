import { IncrementalQuinTree, hash5 } from "maci-crypto";
import { Ballot } from "maci-domainobjs";

import fs from "fs";
import path from "path";

export const genEmptyBallotRootsContract = async (): Promise<string> => {
  const template = await fs.promises
    .readFile(path.resolve(__dirname, "..", "templates", "EmptyBallotRoots.sol.template"))
    .then((res) => res.toString());

  // This hard-coded value should be consistent with the value of `stateTreeDepth` of MACI.sol
  const stateTreeDepth = process.env.STATE_TREE_DEPTH ? Number.parseInt(process.env.STATE_TREE_DEPTH, 10) : 10;

  const roots = [];

  for (let i = 0; i < 5; i += 1) {
    const ballot = new Ballot(0, i + 1);
    // The empty Ballot tree root
    const ballotTree = new IncrementalQuinTree(stateTreeDepth, ballot.hash(), 5, hash5);

    roots.push(`emptyBallotRoots[${i}] = uint256(${ballotTree.root});`.padStart(4));
  }

  return template.replace("<% ROOTS %>", roots.join("\n")).trim();
};
