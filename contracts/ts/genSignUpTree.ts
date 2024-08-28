/* eslint-disable no-underscore-dangle */
import { LeanIMT, LeanIMTHashFunction } from "@zk-kit/lean-imt";
import { hashLeanIMT } from "maci-crypto";
import { PubKey, StateLeaf, blankStateLeaf, blankStateLeafHash } from "maci-domainobjs";

import { assert } from "console";

import { MACI__factory as MACIFactory } from "../typechain-types";

import { IGenSignUpTreeArgs, IGenSignUpTree } from "./types";
import { sleep } from "./utils";

/**
 * Generate a State tree object from the events of a MACI smart contracts
 * @param provider - the ethereum provider
 * @param address - the address of the MACI contract
 * @param fromBlock - the block number from which to start fetching events
 * @param blocksPerRequest - the number of blocks to fetch in each request
 * @param endBlock - the block number at which to stop fetching events
 * @param sleepAmount - the amount of time to sleep between each request
 * @returns State tree
 */
export const genSignUpTree = async ({
  provider,
  address,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock,
  sleepAmount,
}: IGenSignUpTreeArgs): Promise<IGenSignUpTree> => {
  const lastBlock = endBlock || (await provider.getBlockNumber());

  const maciContract = MACIFactory.connect(address, provider);
  const signUpTree = new LeanIMT(hashLeanIMT as LeanIMTHashFunction);
  signUpTree.insert(blankStateLeafHash);
  const stateLeaves: StateLeaf[] = [blankStateLeaf];

  // Fetch event logs in batches (lastBlock inclusive)
  for (let i = fromBlock; i <= lastBlock; i += blocksPerRequest + 1) {
    // the last block batch will be either current iteration block + blockPerRequest
    // or the end block if it is set
    const toBlock = i + blocksPerRequest >= lastBlock ? lastBlock : i + blocksPerRequest;

    // eslint-disable-next-line no-await-in-loop
    const signUpLogs = await maciContract.queryFilter(maciContract.filters.SignUp(), i, toBlock);
    signUpLogs.forEach((event) => {
      assert(!!event);
      const pubKeyX = event.args._userPubKeyX;
      const pubKeyY = event.args._userPubKeyY;
      const voiceCreditBalance = event.args._voiceCreditBalance;
      const timestamp = event.args._timestamp;

      const pubKey = new PubKey([pubKeyX, pubKeyY]);
      const stateLeaf = new StateLeaf(pubKey, voiceCreditBalance, timestamp);

      stateLeaves.push(stateLeaf);
      signUpTree.insert(event.args._stateLeaf);
    });

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }
  return {
    signUpTree,
    stateLeaves,
  };
};
