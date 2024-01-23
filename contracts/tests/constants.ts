import { MaxValues, TreeDepths } from "maci-core";
import { G1Point, G2Point } from "maci-crypto";
import { VerifyingKey } from "maci-domainobjs";

export const duration = 20;

export const STATE_TREE_DEPTH = 10;
export const STATE_TREE_ARITY = 5;
export const MESSAGE_TREE_DEPTH = 2;
export const MESSAGE_TREE_SUBDEPTH = 1;
export const messageBatchSize = STATE_TREE_ARITY ** MESSAGE_TREE_SUBDEPTH;

export const testProcessVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))],
);

export const testTallyVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))],
);

export const initialVoiceCreditBalance = 100;
export const maxValues: MaxValues = {
  maxMessages: STATE_TREE_ARITY ** MESSAGE_TREE_DEPTH,
  maxVoteOptions: 25,
};

export const treeDepths: TreeDepths = {
  intStateTreeDepth: 1,
  messageTreeDepth: MESSAGE_TREE_DEPTH,
  messageTreeSubDepth: MESSAGE_TREE_SUBDEPTH,
  voteOptionTreeDepth: 2,
};

export const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth;
