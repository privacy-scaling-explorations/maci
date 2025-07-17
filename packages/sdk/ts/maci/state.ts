import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
  generateMaciStateFromContract,
} from "@maci-protocol/contracts";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { JsonRpcProvider } from "ethers";

import fs from "fs";

import type { IGenerateMaciStateArgs } from "./types";
import type { MaciState } from "@maci-protocol/core";

import { getPollDeploymentBlock } from "../poll";
import { contractExists } from "../utils/contracts";

import { getMACIDeploymentBlock } from "./utils";

/**
 * Generate a local MACI state from the smart contracts events
 * @param args The arguments for the generateLocalState command
 */
export const generateMaciState = async ({
  outputPath,
  pollId,
  maciAddress,
  coordinatorPrivateKey,
  provider,
  endBlock,
  blockPerBatch,
  sleep,
  signer,
  ipfsMessageBackupFiles,
  logsOutputPath,
}: IGenerateMaciStateArgs): Promise<MaciState> => {
  if (!maciAddress) {
    throw new Error("MACI contract address is empty");
  }

  const isMaciExists = await contractExists(signer.provider!, maciAddress);

  if (!isMaciExists) {
    throw new Error("MACI contract does not exist");
  }

  // if no private key is passed we ask it securely
  if (!PrivateKey.isValidSerialized(coordinatorPrivateKey)) {
    throw new Error("Invalid MACI private key");
  }

  const coordinatorMaciPrivateKey = PrivateKey.deserialize(coordinatorPrivateKey);
  const coordinatorKeypair = new Keypair(coordinatorMaciPrivateKey);

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.polls(pollId);

  const isPollExists = await contractExists(signer.provider!, pollContracts.poll);

  if (!isPollExists) {
    throw new Error("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const startBlockMACI = await getMACIDeploymentBlock({ maciAddress, signer });
  const startBlockPoll = await getPollDeploymentBlock({ maciAddress, pollId, signer });

  const [defaultStartBlockSignup, stateRoot, totalSignups] = await Promise.all([
    maciContract
      .queryFilter(maciContract.filters.SignUp(), startBlockMACI)
      .then((events) => events[0]?.blockNumber ?? 0),
    maciContract.getStateTreeRoot(),
    maciContract.totalSignups(),
  ]);
  const defaultStartBlock = Math.min(startBlockPoll, defaultStartBlockSignup);
  const fromBlock = defaultStartBlock;

  const defaultEndBlock = await Promise.all([
    pollContract
      .queryFilter(pollContract.filters.MergeState(stateRoot, totalSignups), fromBlock)
      .then((events) => events[events.length - 1]?.blockNumber),
  ]).then((blocks) => Math.max(...blocks));

  // calculate the end block number
  const endBlockNumber = endBlock || defaultEndBlock;

  const maciState = await generateMaciStateFromContract({
    provider: provider ? new JsonRpcProvider(provider) : signer.provider!,
    address: maciAddress,
    coordinatorKeypair,
    pollId,
    fromBlock,
    blocksPerRequest: blockPerBatch || 50,
    endBlock: endBlockNumber,
    sleepAmount: sleep,
    ipfsMessageBackupFiles,
    logsOutputPath,
  });

  // write the state to a file
  if (outputPath) {
    const serializedState = maciState.toJSON();
    await fs.promises.writeFile(outputPath, JSON.stringify(serializedState, null, 4));
  }

  return maciState;
};
