/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { task, types } from "hardhat/config";

import fs from "fs";

import type { Proof } from "../../ts/types";
import type { VkRegistry, Verifier, MACI, Poll, AccQueue, MessageProcessor, Tally } from "../../typechain-types";

import { ContractStorage } from "../helpers/ContractStorage";
import { Deployment } from "../helpers/Deployment";
import { Prover } from "../helpers/Prover";
import { EContracts, TallyData, type ISubmitOnChainParams } from "../helpers/types";

/**
 * Prove hardhat task for submitting proofs on-chain as well as uploading tally results
 */
task("submitOnChain", "Command to prove the result of a poll on-chain")
  .addParam("poll", "The poll id", undefined, types.string)
  .addParam("outputDir", "Output directory for proofs", undefined, types.string)
  .addParam("tallyFile", "The file to store the tally proof", undefined, types.string)
  .setAction(async ({ outputDir, poll, tallyFile }: ISubmitOnChainParams, hre) => {
    const deployment = Deployment.getInstance();
    deployment.setHre(hre);
    const storage = ContractStorage.getInstance();
    // if we do not have the output directory just create it
    const isOutputDirExists = fs.existsSync(outputDir);

    if (!isOutputDirExists) {
      // Create the directory
      throw new Error(
        `Output directory ${outputDir} does not exist. You must provide a valid directory containing the poll zk-SNARK proofs.`,
      );
    }

    const signer = await deployment.getDeployer();
    const { network } = hre;

    const startBalance = await signer.provider.getBalance(signer);

    console.log("Start balance: ", Number(startBalance / 10n ** 12n) / 1e6);

    const maciContractAddress = storage.mustGetAddress(EContracts.MACI, network.name);
    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI, address: maciContractAddress });
    const vkRegistryContract = await deployment.getContract<VkRegistry>({ name: EContracts.VkRegistry });
    const verifierContract = await deployment.getContract<Verifier>({ name: EContracts.Verifier });

    const pollContracts = await maciContract.polls(poll);
    const pollContract = await deployment.getContract<Poll>({ name: EContracts.Poll, address: pollContracts.poll });

    const [, messageAqContractAddress] = await pollContract.extContracts();
    const messageAqContract = await deployment.getContract<AccQueue>({
      name: EContracts.AccQueue,
      address: messageAqContractAddress,
    });
    const isStateAqMerged = await pollContract.stateMerged();

    // Check that the state and message trees have been merged for at least the first poll
    if (!isStateAqMerged && poll.toString() === "0") {
      throw new Error("The state tree has not been merged yet. Please use the mergeSignups subcommand to do so.");
    }

    const messageTreeDepth = await pollContract.treeDepths().then((depths) => Number(depths[2]));

    // check that the main root is set
    const mainRoot = await messageAqContract.getMainRoot(messageTreeDepth.toString());

    if (mainRoot.toString() === "0") {
      throw new Error("The message tree has not been merged yet. Please use the mergeMessages subcommand to do so.");
    }

    const mpContract = await deployment.getContract<MessageProcessor>({
      name: EContracts.MessageProcessor,
      address: pollContracts.messageProcessor,
    });

    // get the tally contract based on the useQuadraticVoting flag
    const tallyContract = await deployment.getContract<Tally>({
      name: EContracts.Tally,
      address: pollContracts.tally,
    });

    const data = {
      processProofs: [] as Proof[],
      tallyProofs: [] as Proof[],
    };

    // read the proofs from the output directory
    const files = await fs.promises.readdir(outputDir);

    // Read process proofs
    const processProofFiles = files.filter((f) => f.startsWith("process_") && f.endsWith(".json"));
    await Promise.all(
      processProofFiles.sort().map(async (file) => {
        const proofData = JSON.parse(await fs.promises.readFile(`${outputDir}/${file}`, "utf8")) as Proof;
        data.processProofs.push(proofData);
      }),
    );

    // Read tally proofs
    const tallyProofFiles = files.filter((f) => f.startsWith("tally_") && f.endsWith(".json"));
    await Promise.all(
      tallyProofFiles.sort().map(async (file) => {
        const proofData = JSON.parse(await fs.promises.readFile(`${outputDir}/${file}`, "utf8")) as Proof;
        data.tallyProofs.push(proofData);
      }),
    );

    const prover = new Prover({
      maciContract,
      messageAqContract,
      mpContract,
      pollContract,
      vkRegistryContract,
      verifierContract,
      tallyContract,
    });

    await prover.proveMessageProcessing(data.processProofs);

    // read tally data
    const tallyData = JSON.parse(await fs.promises.readFile(tallyFile, "utf8")) as unknown as TallyData;

    await prover.proveTally(data.tallyProofs);

    await prover.submitResults(tallyData);

    const endBalance = await signer.provider.getBalance(signer);

    console.log("End balance: ", Number(endBalance / 10n ** 12n) / 1e6);
    console.log("Prove expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);
  });
