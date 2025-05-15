/* eslint-disable no-await-in-loop */
import { Deployment, EContracts, Prover, readProofs } from "@maci-protocol/contracts";
import {
  Verifier__factory as VerifierFactory,
  VerifyingKeysRegistry__factory as VerifyingKeysRegistryFactory,
  type Verifier,
  type VerifyingKeysRegistry,
} from "@maci-protocol/contracts/typechain-types";

import fs from "fs";

import type { ITallyData } from "../tally";
import type { IProveOnChainArgs, IProof } from "./types";

import { getPollContracts } from "../poll/utils";
import { contractExists } from "../utils/contracts";

/**
 * Command to prove the result of a poll on-chain
 * @param args - The arguments for the proveOnChain command
 */
export const proveOnChain = async ({
  pollId,
  proofDir,
  maciAddress,
  tallyFile,
  signer,
}: IProveOnChainArgs): Promise<ITallyData | undefined> => {
  const deployment = Deployment.getInstance();
  deployment.setContractNames(EContracts);

  const {
    maci: maciContract,
    poll: pollContract,
    messageProcessor: messageProcessorContract,
    tally: tallyContract,
  } = await getPollContracts({ maciAddress, pollId, signer });

  const verifyingKeysRegistryContractAddress = await tallyContract.verifyingKeysRegistry();
  const [isStateAqMerged, isVerifyingKeyRegistryExists] = await Promise.all([
    pollContract.stateMerged(),
    contractExists(signer.provider!, verifyingKeysRegistryContractAddress),
  ]);

  if (!isVerifyingKeyRegistryExists) {
    throw new Error("There is no VerifyingKeysRegistry contract linked to the specified MACI contract.");
  }

  const verifyingKeysRegistryContract = await deployment.getContract<VerifyingKeysRegistry>({
    name: EContracts.VerifyingKeysRegistry,
    address: verifyingKeysRegistryContractAddress,
    abi: VerifyingKeysRegistryFactory.abi,
    signer,
  });
  const verifierContractAddress = await messageProcessorContract.verifier();
  const isVerifierExists = await contractExists(signer.provider!, verifierContractAddress);

  if (!isVerifierExists) {
    throw new Error("There is no Verifier contract linked to the specified MACI contract.");
  }

  const verifierContract = await deployment.getContract<Verifier>({
    name: EContracts.Verifier,
    address: verifierContractAddress,
    abi: VerifierFactory.abi,
    signer,
  });

  // Check that the state and message trees have been merged for at least the first poll
  if (!isStateAqMerged && pollId.toString() === "0") {
    throw new Error("The state tree has not been merged yet. Please use the mergeSignups subcommand to do so.");
  }

  const data = {
    processProofs: [] as IProof[],
    tallyProofs: [] as IProof[],
  };

  // read the proofs from the output directory
  const files = await fs.promises.readdir(proofDir);

  // Read process proofs
  data.processProofs = await readProofs({ files, folder: proofDir, type: "process" });
  // Read tally proofs
  data.tallyProofs = await readProofs({ files, folder: proofDir, type: "tally" });

  const prover = new Prover({
    maciContract,
    messageProcessorContract,
    pollContract,
    verifyingKeysRegistryContract,
    verifierContract,
    tallyContract,
  });

  await prover.proveMessageProcessing(data.processProofs);
  await prover.proveTally(data.tallyProofs);

  if (tallyFile) {
    const tallyData = await fs.promises
      .readFile(tallyFile, "utf8")
      .then((result) => JSON.parse(result) as unknown as ITallyData);
    const voteOptions = await pollContract.voteOptions();

    await prover.submitResults(tallyData, Number.parseInt(voteOptions.toString(), 10));

    return tallyData;
  }

  return undefined;
};
