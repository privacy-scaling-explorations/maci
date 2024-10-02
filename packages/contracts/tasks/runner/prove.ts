/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { task, types } from "hardhat/config";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";

import type { Proof } from "../../ts/types";
import type { VkRegistry, Verifier, MACI, Poll, AccQueue, MessageProcessor, Tally } from "../../typechain-types";

import { ContractStorage } from "../helpers/ContractStorage";
import { Deployment } from "../helpers/Deployment";
import { ProofGenerator } from "../helpers/ProofGenerator";
import { Prover } from "../helpers/Prover";
import { EContracts, type IProveParams } from "../helpers/types";

/**
 * Prove hardhat task for generating off-chain proofs and sending them on-chain
 */
task("prove", "Command to generate proof and prove the result of a poll on-chain")
  .addParam("poll", "The poll id", undefined, types.string)
  .addParam("outputDir", "Output directory for proofs", undefined, types.string)
  .addParam("coordinatorPrivateKey", "Coordinator maci private key", undefined, types.string)
  .addOptionalParam("rapidsnark", "Rapidsnark binary path", undefined, types.string)
  .addOptionalParam("processWitgen", "Process witgen binary path", undefined, types.string)
  .addParam("tallyFile", "The file to store the tally proof", undefined, types.string)
  .addOptionalParam("tallyWitgen", "Tally witgen binary path", undefined, types.string)
  .addOptionalParam("stateFile", "The file with the serialized maci state", undefined, types.string)
  .addOptionalParam("startBlock", "The block number to start fetching logs from", undefined, types.int)
  .addOptionalParam("blocksPerBatch", "The number of blocks to fetch logs from", undefined, types.int)
  .addOptionalParam("endBlock", "The block number to stop fetching logs from", undefined, types.int)
  .addOptionalParam("transactionHash", "The transaction hash of the first transaction", undefined, types.int)
  .setAction(
    async (
      {
        outputDir,
        poll,
        coordinatorPrivateKey,
        stateFile,
        rapidsnark,
        processWitgen,
        tallyWitgen,
        tallyFile,
        startBlock,
        blocksPerBatch,
        endBlock,
        transactionHash,
      }: IProveParams,
      hre,
    ) => {
      const deployment = Deployment.getInstance();
      deployment.setHre(hre);
      const storage = ContractStorage.getInstance();
      // if we do not have the output directory just create it
      const isOutputDirExists = fs.existsSync(outputDir);

      if (!isOutputDirExists) {
        // Create the directory
        await fs.promises.mkdir(outputDir);
      }

      const maciPrivateKey = PrivKey.deserialize(coordinatorPrivateKey);
      const coordinatorKeypair = new Keypair(maciPrivateKey);

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
      const messageAqAddress = await pollContract.extContracts().then((contracts) => contracts.messageAq);
      const messageAq = await deployment.getContract<AccQueue>({
        name: EContracts.AccQueue,
        address: messageAqAddress,
      });

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

      const maciState = await ProofGenerator.prepareState({
        maciContract,
        pollContract,
        messageAq,
        maciPrivateKey,
        coordinatorKeypair,
        pollId: poll,
        signer,
        outputDir,
        options: {
          stateFile,
          transactionHash,
          startBlock,
          endBlock,
          blocksPerBatch,
        },
      });

      const foundPoll = maciState.polls.get(BigInt(poll));

      if (!foundPoll) {
        throw new Error(`Poll ${poll} not found`);
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
      const useQuadraticVoting =
        deployment.getDeployConfigField<boolean | null>(EContracts.Poll, "useQuadraticVoting") ?? false;
      const mode = useQuadraticVoting ? "qv" : "nonQv";
      const tallyZkey = deployment.getDeployConfigField<string>(
        EContracts.VkRegistry,
        `zkeys.${mode}.tallyVotesZkey`,
        true,
      );
      const tallyWasm = deployment.getDeployConfigField<string>(EContracts.VkRegistry, `zkeys.${mode}.tallyWasm`, true);
      const processZkey = deployment.getDeployConfigField<string>(
        EContracts.VkRegistry,
        `zkeys.${mode}.processMessagesZkey`,
        true,
      );
      const processWasm = deployment.getDeployConfigField<string>(
        EContracts.VkRegistry,
        `zkeys.${mode}.processWasm`,
        true,
      );
      const proofGenerator = new ProofGenerator({
        poll: foundPoll,
        maciContractAddress,
        tallyContractAddress: pollContracts.tally,
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

      const data = {
        processProofs: [] as Proof[],
        tallyProofs: [] as Proof[],
      };

      const prover = new Prover({
        maciContract,
        messageAqContract,
        mpContract,
        pollContract,
        vkRegistryContract,
        verifierContract,
        tallyContract,
      });

      data.processProofs = await proofGenerator.generateMpProofs();
      await prover.proveMessageProcessing(data.processProofs);

      const { proofs: tallyProofs, tallyData } = await proofGenerator.generateTallyProofs(network);
      data.tallyProofs = tallyProofs;
      await prover.proveTally(data.tallyProofs, tallyData);

      const endBalance = await signer.provider.getBalance(signer);

      console.log("End balance: ", Number(endBalance / 10n ** 12n) / 1e6);
      console.log("Prove expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);
    },
  );
