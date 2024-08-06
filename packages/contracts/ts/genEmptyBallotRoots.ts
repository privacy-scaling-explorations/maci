import { STATE_TREE_ARITY } from "maci-core";
import { IncrementalQuinTree, hash2 } from "maci-crypto";
import { Ballot } from "maci-domainobjs";

/**
 * Generate empty ballot roots for a given state tree depth
 * @param stateTreeDepth The depth of the state tree
 * @returns The empty ballot roots
 */
export const genEmptyBallotRoots = (stateTreeDepth: number): bigint[] => {
  const roots: bigint[] = [];

  for (let i = 0; i < 5; i += 1) {
    const ballot = new Ballot(0, i + 1);
    // The empty Ballot tree root
    const ballotTree = new IncrementalQuinTree(stateTreeDepth, ballot.hash(), STATE_TREE_ARITY, hash2);

    roots.push(ballotTree.root);
  }

  return roots;
};
