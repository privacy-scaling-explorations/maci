/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { task, types } from "hardhat/config";
import { Keypair, PrivKey } from "maci-domainobjs";

import fs from "fs";

import type { Proof } from "../../ts/types";

import {
  type VkRegistry,
  type Subsidy,
  type Verifier,
  type MACI,
  type Poll,
  type AccQueue,
  MessageProcessor,
  Tally,
  TallyNonQv,
} from "../../typechain-types";
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
  .addParam("processZkey", "Process zkey file path", undefined, types.string)
  .addOptionalParam("processWitgen", "Process witgen binary path", undefined, types.string)
  .addOptionalParam("processWasm", "Process wasm file path", undefined, types.string)
  .addParam("tallyFile", "The file to store the tally proof", undefined, types.string)
  .addParam("tallyZkey", "Tally zkey file path", undefined, types.string)
  .addOptionalParam("tallyWitgen", "Tally witgen binary path", undefined, types.string)
  .addOptionalParam("tallyWasm", "Tally wasm file path", undefined, types.string)
  .addOptionalParam("subsidyFile", "The file to store the subsidy proof", undefined, types.string)
  .addOptionalParam("subsidyZkey", "Subsidy zkey file path", undefined, types.string)
  .addOptionalParam("subsidyWitgen", "Subsidy witgen binary path", undefined, types.string)
  .addOptionalParam("subsidyWasm", "Subsidy wasm file path", undefined, types.string)
  .addOptionalParam("stateFile", "The file with the serialized maci state", undefined, types.string)
  .addFlag("useQuadraticVoting", "Whether to use quadratic voting or not")
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
        processZkey,
        processWitgen,
        processWasm,
        tallyZkey,
        tallyWitgen,
        tallyWasm,
        tallyFile,
        subsidyFile,
        subsidyZkey,
        subsidyWitgen,
        subsidyWasm,
        useQuadraticVoting,
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
      if (!fs.existsSync(outputDir)) {
        // Create the directory
        fs.mkdirSync(outputDir);
      }

      const maciPrivateKey = PrivKey.deserialize(coordinatorPrivateKey);
      const coordinatorKeypair = new Keypair(maciPrivateKey);

      const signer = await deployment.getDeployer();
      const { network } = hre;

      const startBalance = await signer.provider.getBalance(signer);

      console.log("Start balance: ", Number(startBalance / 10n ** 12n) / 1e6);

      const maciContractAddress = storage.mustGetAddress(EContracts.MACI, network.name);
      const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI, address: maciContractAddress });
      const vkRegsitryContract = await deployment.getContract<VkRegistry>({ name: EContracts.VkRegistry });
      const verifierContract = await deployment.getContract<Verifier>({ name: EContracts.Verifier });

      const pollAddress = await maciContract.polls(poll);
      const pollContract = await deployment.getContract<Poll>({ name: EContracts.Poll, address: pollAddress });

      const [, messageAqContractAddress] = await pollContract.extContracts();
      const messageAqContract = await deployment.getContract<AccQueue>({
        name: EContracts.AccQueue,
        address: messageAqContractAddress,
      });
      const isStateAqMerged = await pollContract.stateAqMerged();

      // Check that the state and message trees have been merged for at least the first poll
      if (!isStateAqMerged && poll.toString() === "0") {
        throw new Error("The state tree has not been merged yet. Please use the mergeSignups subcommmand to do so.");
      }

      const messageTreeDepth = await pollContract.treeDepths().then((depths) => Number(depths[2]));

      // check that the main root is set
      const mainRoot = await messageAqContract.getMainRoot(messageTreeDepth.toString());

      if (mainRoot.toString() === "0") {
        throw new Error("The message tree has not been merged yet. Please use the mergeMessages subcommmand to do so.");
      }

      const maciState = await ProofGenerator.prepareState({
        maciContractAddress,
        maciPrivateKey,
        coordinatorKeypair,
        pollId: poll,
        signer,
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

      const subsidyContractAddress = storage.getAddress(EContracts.Subsidy, network.name, `poll-${poll.toString()}`);

      const mpContract = await deployment.getContract<MessageProcessor>({
        name: EContracts.MessageProcessor,
        key: `poll-${poll.toString()}`,
      });

      // get the tally contract based on the useQuadraticVoting flag
      const tallyContract = useQuadraticVoting
        ? await deployment.getContract<Tally>({
            name: EContracts.Tally,
            key: `poll-${poll.toString()}`,
          })
        : await deployment.getContract<TallyNonQv>({
            name: EContracts.TallyNonQv,
            key: `poll-${poll.toString()}`,
          });
      const tallyContractAddress = await tallyContract.getAddress();

      let subsidyContract: Subsidy | undefined;

      if (subsidyContractAddress) {
        subsidyContract = await deployment.getContract<Subsidy>({
          name: EContracts.Subsidy,
          key: `poll-${poll.toString()}`,
        });
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
        subsidy:
          subsidyZkey && subsidyWitgen
            ? {
                zkey: subsidyZkey,
                witgen: subsidyWitgen,
                wasm: subsidyWasm,
              }
            : undefined,
        outputDir,
        subsidyOutputFile: subsidyFile,
        tallyOutputFile: tallyFile,
        useQuadraticVoting,
      });

      const data = {
        processProofs: [] as Proof[],
        tallyProofs: [] as Proof[],
        subsidyProofs: [] as Proof[],
      };

      const prover = new Prover({
        maciContract,
        messageAqContract,
        mpContract,
        pollContract,
        vkRegsitryContract,
        verifierContract,
        tallyContract,
        subsidyContract,
      });

      data.processProofs = await proofGenerator.generateMpProofs();
      await prover.proveMessageProcessing(data.processProofs);

      // subsidy calculations are not mandatory
      if (subsidyFile) {
        data.subsidyProofs = await proofGenerator.generateSubsidyProofs();
        await prover.proveSubsidy(data.subsidyProofs);
      }

      data.tallyProofs = await proofGenerator.generateTallyProofs(network);
      await prover.proveTally(data.tallyProofs);

      const endBalance = await signer.provider.getBalance(signer);

      console.log("End balance: ", Number(endBalance / 10n ** 12n) / 1e6);
      console.log("Prove expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);
    },
  );
