import { ProofGenerator } from "maci-contracts";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";

import type { IGenerateProofsArgs, IGenerateProofsData } from "./types";

import { getPollContracts } from "../poll";
import { doesPathExist } from "../utils/files";

/**
 * Generate proofs for the message processing and tally calculations
 * @param args - The arguments for the genProofs command
 * @returns The tally data
 */
export const generateProofs = async ({
  outputDir,
  coordinatorPrivateKey,
  signer,
  maciAddress,
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
  processDatFile,
  tallyDatFile,
  tallyFile,
  useWasm,
}: IGenerateProofsArgs): Promise<IGenerateProofsData> => {
  // differentiate whether we are using wasm or rapidsnark
  if (useWasm) {
    // if no rapidsnark then we assume we go with wasm
    // so we expect those arguments
    if (!processWasm) {
      throw new Error("Please specify the process wasm file location");
    }

    if (!tallyWasm) {
      throw new Error("Please specify the tally wasm file location");
    }

    const wasmResult = doesPathExist([processWasm, tallyWasm]);

    if (!wasmResult[0]) {
      throw new Error(`Could not find ${wasmResult[1]}.`);
    }
  } else {
    if (!rapidsnark) {
      throw new Error("Please specify the rapidsnark file location");
    }

    if (!processWitgen) {
      throw new Error("Please specify the process witgen file location");
    }

    if (!tallyWitgen) {
      throw new Error("Please specify the tally witgen file location");
    }

    const witgenResult = doesPathExist([rapidsnark, processWitgen, tallyWitgen, processDatFile!, tallyDatFile!]);

    if (!witgenResult[0]) {
      throw new Error(`Could not find ${witgenResult[1]}.`);
    }
  }

  // check if zkeys were provided
  const zkResult = doesPathExist([processZkey, tallyZkey]);

  if (!zkResult[0]) {
    throw new Error(`Could not find ${zkResult[1]}.`);
  }

  const network = await signer.provider?.getNetwork();

  if (!maciAddress) {
    throw new Error("Please provide a MACI contract address");
  }

  // the coordinator's MACI private key
  if (!PrivKey.isValidSerializedPrivKey(coordinatorPrivateKey)) {
    throw new Error("Invalid MACI private key");
  }

  // if we do not have the output directory just create it
  const isOutputDirExists = fs.existsSync(outputDir);

  if (!isOutputDirExists) {
    // Create the directory
    await fs.promises.mkdir(outputDir);
  }

  const maciPrivateKey = PrivKey.deserialize(coordinatorPrivateKey);
  const coordinatorKeypair = new Keypair(maciPrivateKey);

  const {
    poll: pollContract,
    maci: maciContract,
    tally: tallyContract,
  } = await getPollContracts({
    maciAddress,
    pollId,
    signer,
  });

  const [isStateAqMerged, tallyContractAddress] = await Promise.all([
    pollContract.stateMerged(),
    tallyContract.getAddress(),
  ]);

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
    maciContractAddress: maciAddress,
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

  const processProofs = await proofGenerator.generateMpProofs();
  const { proofs: tallyProofs, tallyData } = await proofGenerator.generateTallyProofs(
    network?.name ?? "",
    network?.chainId.toString() ?? "0",
  );

  return { processProofs, tallyProofs, tallyData };
};
