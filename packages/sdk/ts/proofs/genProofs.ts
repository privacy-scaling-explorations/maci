import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
  ProofGenerator,
  type TallyData,
} from "maci-contracts";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";

import { IGenProofsArgs } from "./types";

/**
 * Generate proofs for the message processing and tally calculations
 * @param args - The arguments for the genProofs command
 * @returns The tally data
 */
export const genProofs = async ({
  outputDir,
  coordinatorPrivateKey,
  signer,
  networkName,
  chainId,
  maciContractAddress,
  pollId,
  ipfsMessageBackupFiles,
  stateFile,
  transactionHash,
  startBlock,
  endBlock,
  blocksPerBatch,
  rapidsnark,
  useQuadraticVoting,
  tallyZkey,
  tallyWitgen,
  tallyWasm,
  processZkey,
  processWitgen,
  processWasm,
  tallyFile,
}: IGenProofsArgs): Promise<TallyData> => {
  // if we do not have the output directory just create it
  const isOutputDirExists = fs.existsSync(outputDir);

  if (!isOutputDirExists) {
    // Create the directory
    await fs.promises.mkdir(outputDir);
  }

  const maciPrivateKey = PrivKey.deserialize(coordinatorPrivateKey);
  const coordinatorKeypair = new Keypair(maciPrivateKey);

  const maciContract = MACIFactory.connect(maciContractAddress, signer);

  const pollContracts = await maciContract.polls(pollId);
  const tallyContractAddress = pollContracts.tally;
  const pollContract = PollFactory.connect(pollContracts.poll, signer);
  const isStateAqMerged = await pollContract.stateMerged();

  // Check that the state and message trees have been merged
  if (!isStateAqMerged) {
    throw new Error("The state tree has not been merged yet. Please use the mergeSignups subcommand to do so.");
  }

  const maciState = await ProofGenerator.prepareState({
    maciContract,
    pollContract,
    maciPrivateKey,
    coordinatorKeypair,
    pollId,
    signer,
    outputDir,
    ipfsMessageBackupFiles,
    options: {
      stateFile,
      transactionHash,
      startBlock,
      endBlock,
      blocksPerBatch,
    },
  });

  const foundPoll = maciState.polls.get(BigInt(pollId));

  if (!foundPoll) {
    throw new Error(`Poll ${pollId} not found`);
  }

  const proofGenerator = new ProofGenerator({
    poll: foundPoll,
    maciContractAddress,
    tallyContractAddress,
    rapidsnark,
    tally: {
      zkey: tallyZkey,
      witgen: tallyWitgen,
      wasm: tallyWasm,
    },
    mp: {
      zkey: processZkey,
      witgen: processWitgen,
      wasm: processWasm,
    },
    outputDir,
    tallyOutputFile: tallyFile,
    useQuadraticVoting,
  });

  await proofGenerator.generateMpProofs();
  const { tallyData } = await proofGenerator.generateTallyProofs(networkName, chainId);

  return tallyData;
};
