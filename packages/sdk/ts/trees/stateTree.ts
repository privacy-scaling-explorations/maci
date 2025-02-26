/* eslint-disable no-underscore-dangle */
import { LeanIMT, LeanIMTHashFunction } from "@zk-kit/lean-imt";
import { MACI__factory as MACIFactory } from "maci-contracts";
import { hashLeanIMT, hashLeftRight, PAD_KEY_HASH } from "maci-crypto";
import { PubKey } from "maci-domainobjs";

import { assert } from "console";

import type { IGenerateSignUpTreeArgs, IGenerateSignUpTree } from "./types";

import { sleep } from "../utils/utils";

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
export const generateSignUpTree = async ({
  provider,
  address,
  fromBlock = 0,
  blocksPerRequest = 50,
  endBlock,
  sleepAmount,
}: IGenerateSignUpTreeArgs): Promise<IGenerateSignUpTree> => {
  const lastBlock = endBlock || (await provider.getBlockNumber());

  const maciContract = MACIFactory.connect(address, provider);
  const signUpTree = new LeanIMT(hashLeanIMT as LeanIMTHashFunction);
  signUpTree.insert(PAD_KEY_HASH);
  const pubKeys: PubKey[] = [];

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

      const pubKey = new PubKey([pubKeyX, pubKeyY]);

      pubKeys.push(pubKey);
      signUpTree.insert(hashLeftRight(pubKeyX, pubKeyY));
    });

    if (sleepAmount) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepAmount);
    }
  }

  return {
    signUpTree,
    pubKeys,
  };
};
