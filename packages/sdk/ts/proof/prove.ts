/* eslint-disable no-await-in-loop */
import { Deployment, EContracts, Prover, readProofs } from "@maci-protocol/contracts";
import {
  Verifier__factory as VerifierFactory,
  VkRegistry__factory as VkRegistryFactory,
  type Verifier,
  type VkRegistry,
} from "@maci-protocol/contracts/typechain-types";

import fs from "fs";

import type { ITallyData } from "../tally";
import type { IProveOnChainArgs, IProof } from "./types";

import { getPollContracts } from "../poll";
import { contractExists } from "../utils";

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
    messageProcessor: mpContract,
    tally: tallyContract,
  } = await getPollContracts({ maciAddress, pollId, signer });

  const vkRegistryContractAddress = await tallyContract.vkRegistry();
  const [isStateAqMerged, isVkRegistryExists] = await Promise.all([
    pollContract.stateMerged(),
    contractExists(signer.provider!, vkRegistryContractAddress),
  ]);

  if (!isVkRegistryExists) {
    throw new Error("There is no VkRegistry contract linked to the specified MACI contract.");
  }

  const vkRegistryContract = await deployment.getContract<VkRegistry>({
    name: EContracts.VkRegistry,
    address: vkRegistryContractAddress,
    abi: VkRegistryFactory.abi,
    signer,
  });
  const verifierContractAddress = await mpContract.verifier();
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
    mpContract,
    pollContract,
    vkRegistryContract,
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
