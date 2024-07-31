import { Provider } from "ethers";
import { STATE_TREE_ARITY, STATE_TREE_DEPTH } from "maci-core/build/ts/utils/constants";
import { hash2, IncrementalQuinTree } from "maci-crypto";
import { blankStateLeafHash } from "maci-domainobjs";

import { assert } from "console";

import { MACI__factory as MACIFactory } from "../typechain-types";

import { sleep } from "./utils";

export const genSignUpTree = async (
  provider: Provider,
  address: string,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock: number | undefined = undefined,
  sleepAmount: number | undefined = undefined,
): Promise<IncrementalQuinTree> => {
  const lastBlock = endBlock || (await provider.getBlockNumber());

  const maciContract = MACIFactory.connect(address, provider);
  const signUpTree = new IncrementalQuinTree(STATE_TREE_DEPTH, blankStateLeafHash, STATE_TREE_ARITY, hash2);
  signUpTree.insert(blankStateLeafHash);

  // Fetch event logs in batches (lastBlock inclusive)
  for (let i = fromBlock; i <= lastBlock; i += blocksPerRequest + 1) {
    // the last block batch will be either current iteration block + blockPerRequest
    // or the end block if it is set
    const toBlock = i + blocksPerRequest >= lastBlock ? lastBlock : i + blocksPerRequest;

    const [
      signUpLogs,
      // eslint-disable-next-line no-await-in-loop
    ] = await Promise.all([maciContract.queryFilter(maciContract.filters.SignUp(), i, toBlock)]);
    signUpLogs.forEach((event) => {
      assert(!!event);
      // eslint-disable-next-line no-underscore-dangle
      signUpTree.insert(event.args._stateLeaf);
    });

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }
  return signUpTree;
};
