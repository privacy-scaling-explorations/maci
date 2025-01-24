#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { generateTallyCommitments, getPollParams, verify, getPoll, isUserRegistered, signup } from "maci-sdk";

import fs from "fs";
import path from "path";

import type { Signer } from "ethers";

import "./cliInit";
import {
  genKeyPair,
  genMaciPubKey,
  deployVkRegistryContract,
  deploy,
  showContracts,
  deployPoll,
  publish,
  setVerifyingKeys,
  mergeSignups,
  timeTravel,
  genProofs,
  fundWallet,
  proveOnChain,
  checkVerifyingKeys,
  genLocalState,
  extractVkToFile,
  joinPoll,
  isJoinedUser,
} from "./commands";
import {
  DEFAULT_SG_DATA,
  TallyData,
  banner,
  logError,
  logGreen,
  logRed,
  promptSensitiveValue,
  readContractAddress,
  success,
} from "./utils";

// set the description version and name of the cli tool
const { description, version, name } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"),
) as { description: string; version: string; name: string };
const program = new Command();
program.name(name).description(description).version(version);

const getSigner = async (): Promise<Signer> => import("maci-contracts").then((m) => m.getDefaultSigner());

// add the commands
program
  .command("create")
  .description("deploy the contracts")
  .option("-i, --initialVoiceCredits <initialVoiceCredits>", "the initial voice credits", parseInt)
  .option(
    "-p, --initialVoiceCreditsProxyAddress <initialVoiceCreditsProxyAddress>",
    "the initial voice credits proxy contract address",
  )
  .option("--poseidonT3Address <poseidonT3Address>", "PoseidonT3 contract address")
  .option("--poseidonT4Address <poseidonT4Address>", "PoseidonT4 contract address")
  .option("--poseidonT5Address <poseidonT5Address>", "PoseidonT5 contract address")
  .option("--poseidonT6Address <poseidonT6Address>", "PoseidonT6 contract address")
  .option("-g, --signupGatekeeperAddress <signupGatekeeperAddress>", "the signup gatekeeper contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .requiredOption("-s, --stateTreeDepth <stateTreeDepth>", "the state tree depth", parseInt)
  .action(async (cmdOptions) => {
    try {
      const signer = await getSigner();

      await deploy({
        stateTreeDepth: cmdOptions.stateTreeDepth,
        initialVoiceCredits: cmdOptions.initialVoiceCredits,
        initialVoiceCreditsProxyAddress: cmdOptions.initialVoiceCreditsProxyAddress,
        signupGatekeeperAddress: cmdOptions.signupGatekeeperAddress,
        poseidonT3Address: cmdOptions.poseidonT3Address,
        poseidonT4Address: cmdOptions.poseidonT4Address,
        poseidonT5Address: cmdOptions.poseidonT5Address,
        poseidonT6Address: cmdOptions.poseidonT6Address,
        quiet: cmdOptions.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("checkVerifyingKeys")
  .description("check that the verifying keys in the contract match the local ones")
  .option(
    "-u, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .option("-k, --vk-contract <vkContract>", "the VkRegistry contract address")
  .requiredOption("-s, --state-tree-depth <stateTreeDepth>", "the state tree depth", parseInt)
  .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the intermediate state tree depth", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-b, --msg-batch-size <messageBatchSize>", "the message batch size", parseInt)
  .requiredOption(
    "-p, --process-messages-zkey <processMessagesZkeyPath>",
    "the process messages zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "-t, --tally-votes-zkey <tallyVotesZkeyPath>",
    "the tally votes zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--poll-joining-zkey <pollZkeyPath>",
    "the poll join zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .action(async (cmdOptions) => {
    try {
      const signer = await getSigner();

      await checkVerifyingKeys({
        stateTreeDepth: cmdOptions.stateTreeDepth,
        intStateTreeDepth: cmdOptions.intStateTreeDepth,
        voteOptionTreeDepth: cmdOptions.voteOptionTreeDepth,
        messageBatchSize: cmdOptions.msgBatchSize,
        processMessagesZkeyPath: cmdOptions.processMessagesZkey,
        tallyVotesZkeyPath: cmdOptions.tallyVotesZkey,
        pollJoiningZkeyPath: cmdOptions.pollJoiningZkey,
        vkRegistry: cmdOptions.vkContract,
        quiet: cmdOptions.quiet,
        useQuadraticVoting: cmdOptions.useQuadraticVoting,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("genMaciPubKey")
  .description("generate a new MACI public key")
  .requiredOption("-k, --privkey <privkey>", "the private key")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action((cmdObj) => {
    genMaciPubKey(cmdObj.privkey, cmdObj.quiet);
  });
program
  .command("genMaciKeyPair")
  .description("generate a new MACI key pair")
  .option("-s, --seed <seed>", "seed value for keypair", (value) => (value ? BigInt(value) : undefined), undefined)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action((cmdObj) => {
    genKeyPair({ seed: cmdObj.seed, quiet: cmdObj.quiet });
  });
program
  .command("deployVkRegistry")
  .description("deploy a new verification key registry contract")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await deployVkRegistryContract({ quiet: cmdObj.quiet, signer });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("show")
  .description("show the deployed contract addresses")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      await showContracts(cmdObj.quiet);
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("deployPoll")
  .description("deploy a new poll")
  .option("-k, --vkRegistryAddress <vkRegistryAddress>", "the vk registry contract address")
  .requiredOption("-t, --duration <pollDuration>", "the poll duration", parseInt)
  .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the int state tree depth", parseInt)
  .requiredOption("-b, --msg-batch-size <messageBatchSize>", "the message batch size", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-p, --pubkey <coordinatorPubkey>", "the coordinator public key")
  .option(
    "-u, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-m, --relayers <relayers>", "the relayer addresses", (value) => value.split(",").map((item) => item.trim()))
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await deployPoll({
        pollDuration: cmdObj.duration,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        messageBatchSize: cmdObj.msgBatchSize,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        coordinatorPubkey: cmdObj.pubkey,
        maciAddress: cmdObj.maciAddress,
        vkRegistryAddress: cmdObj.vkRegistryAddress,
        relayers: cmdObj.relayers,
        quiet: cmdObj.quiet,
        useQuadraticVoting: cmdObj.useQuadraticVoting,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("joinPoll")
  .description("join the poll")
  .requiredOption("-k, --priv-key <privKey>", "the private key")
  .option("-i, --state-index <stateIndex>", "the user's state index", BigInt)
  .requiredOption("-s, --sg-data <sgData>", "the signup gateway data")
  .option("-v, --ivcp-data <ivcpData>", "the initial voice credit proxy data")
  .option(
    "-n, --new-voice-credit-balance <newVoiceCreditBalance>",
    "the voice credit balance of the user for the poll",
    BigInt,
  )
  .requiredOption("-p, --poll-id <pollId>", "the id of the poll", BigInt)
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("--state-file <stateFile>", "the path to the state file containing the serialized maci state")
  .option("--start-block <startBlock>", "the block number to start looking for events from", parseInt)
  .option("--end-block <endBlock>", "the block number to end looking for events from", parseInt)
  .option("--blocks-per-batch <blockPerBatch>", "the number of blocks to process per batch", parseInt)
  .option("--transaction-hash <transactionHash>", "transaction hash of MACI contract creation")
  .option("--poll-wasm <pollWasm>", "the path to the poll witness generation wasm binary")
  .requiredOption(
    "--poll-joining-zkey <pollZkeyPath>",
    "the poll join zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option("-w, --wasm", "whether to use the wasm binaries")
  .option("-r, --rapidsnark <rapidsnark>", "the path to the rapidsnark binary")
  .option("-g, --poll-witnessgen <pollWitnessgen>", "the path to the poll witness generation binary")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));
      const privateKey = cmdObj.privKey || (await promptSensitiveValue("Insert your MACI private key"));

      await joinPoll({
        maciAddress,
        privateKey,
        stateIndex: cmdObj.stateIndex || undefined,
        stateFile: cmdObj.stateFile,
        pollId: cmdObj.pollId,
        signer,
        startBlock: cmdObj.startBlock,
        endBlock: cmdObj.endBlock,
        blocksPerBatch: cmdObj.blocksPerBatch,
        transactionHash: cmdObj.transactionHash,
        pollJoiningZkey: cmdObj.pollJoiningZkey,
        pollWasm: cmdObj.pollWasm,
        quiet: cmdObj.quiet,
        useWasm: cmdObj.wasm,
        rapidsnark: cmdObj.rapidsnark,
        pollWitgen: cmdObj.pollWitnessgen,
        sgDataArg: cmdObj.sgData,
        ivcpDataArg: cmdObj.ivcpData,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("setVerifyingKeys")
  .description("set the verifying keys")
  .requiredOption("-s, --state-tree-depth <stateTreeDepth>", "the state tree depth", parseInt)
  .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the intermediate state tree depth", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-b, --msg-batch-size <messageBatchSize>", "the message batch size", parseInt)
  .option(
    "--poll-joining-zkey <pollZkeyPath>",
    "the poll join zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "--process-messages-zkey-qv <processMessagesZkeyPathQv>",
    "the process messages qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "--tally-votes-zkey-qv <tallyVotesZkeyPathQv>",
    "the tally votes qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "--process-messages-zkey-non-qv <processMessagesZkeyPathNonQv>",
    "the process messages non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "--tally-votes-zkey-non-qv <tallyVotesZkeyPathNonQv>",
    "the tally votes non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "-u, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .option("-k, --vk-registry <vkRegistry>", "the vk registry contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await setVerifyingKeys({
        stateTreeDepth: cmdObj.stateTreeDepth,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        messageBatchSize: cmdObj.msgBatchSize,
        pollJoiningZkeyPath: cmdObj.pollJoiningZkey,
        processMessagesZkeyPathQv: cmdObj.processMessagesZkeyQv,
        tallyVotesZkeyPathQv: cmdObj.tallyVotesZkeyQv,
        processMessagesZkeyPathNonQv: cmdObj.processMessagesZkeyNonQv,
        tallyVotesZkeyPathNonQv: cmdObj.tallyVotesZkeyNonQv,
        vkRegistry: cmdObj.vkRegistry,
        quiet: cmdObj.quiet,
        useQuadraticVoting: cmdObj.useQuadraticVoting,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("publish")
  .description("publish a new message to a MACI Poll contract")
  .requiredOption(
    "-p, --pubkey <pubkey>",
    "the MACI public key which should replace the user's public key in the state tree",
  )
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-k, --privkey <privkey>", "your serialized MACI private key")
  .requiredOption("-i, --state-index <stateIndex>", "the user's state index", BigInt)
  .requiredOption("-v, --vote-option-index <voteOptionIndex>", "the vote option index", BigInt)
  .requiredOption("-n, --nonce <nonce>", "the message nonce", BigInt)
  .option("-s, --salt <salt>", "the message salt", BigInt)
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .requiredOption("-w, --new-vote-weight <newVoteWeight>", "the new vote weight", BigInt)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));
      const privateKey = cmdObj.privkey || (await promptSensitiveValue("Insert your MACI private key"));

      await publish({
        pubkey: cmdObj.pubkey,
        stateIndex: cmdObj.stateIndex,
        voteOptionIndex: cmdObj.voteOptionIndex,
        nonce: cmdObj.nonce,
        pollId: cmdObj.pollId,
        newVoteWeight: cmdObj.newVoteWeight,
        maciAddress,
        salt: cmdObj.salt,
        privateKey,
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });

program
  .command("mergeSignups")
  .description("merge the signups accumulator queue")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .option("-n, --num-queue-ops <numQueueOps>", "the number of queue operations", parseInt)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await mergeSignups({
        pollId: cmdObj.pollId,
        maciAddress: cmdObj.maciAddress,
        numQueueOps: cmdObj.numQueueOps?.toString(),
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("timeTravel")
  .description("fast-forward the time (only works for local hardhat testing")
  .requiredOption("-s, --seconds <seconds>", "the number of seconds to fast-forward", parseInt)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await timeTravel({ seconds: cmdObj.seconds, quiet: cmdObj.quiet, signer });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("extractVkToFile")
  .description("extract vkey to json file")
  .requiredOption(
    "--poll-joining-zkey <pollZkeyPath>",
    "the poll join zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--process-messages-zkey-qv <processMessagesZkeyPathQv>",
    "the process messages qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--tally-votes-zkey-qv <tallyVotesZkeyPathQv>",
    "the tally votes qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--process-messages-zkey-non-qv <processMessagesZkeyPathNonQv>",
    "the process messages non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--tally-votes-zkey-non-qv <tallyVotesZkeyPathNonQv>",
    "the tally votes non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption("-o, --output-file <outputFile>", "the output file path of extracted vkeys")
  .action(async (cmdObj) => {
    try {
      await extractVkToFile({
        processMessagesZkeyPathQv: cmdObj.processMessagesZkeyQv,
        tallyVotesZkeyPathQv: cmdObj.tallyVotesZkeyQv,
        processMessagesZkeyPathNonQv: cmdObj.processMessagesZkeyNonQv,
        tallyVotesZkeyPathNonQv: cmdObj.tallyVotesZkeyNonQv,
        pollJoiningZkeyPath: cmdObj.pollJoiningZkey,
        outputFilePath: cmdObj.outputFile,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("signup")
  .description("Sign up to a MACI contract")
  .requiredOption("-p, --pubkey <maciPubKey>", "the MACI public key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-s, --sg-data <sgData>", "the signup gateway data")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      const data = await signup({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        sgData: cmdObj.sgData ?? DEFAULT_SG_DATA,
        signer,
      });

      logGreen(
        cmdObj.quiet,
        success(`State index: ${data.stateIndex.toString()}\n Transaction hash: ${data.transactionHash}`),
      );
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("isRegisteredUser")
  .description("Checks if user is registered with public key")
  .requiredOption("-p, --pubkey <maciPubKey>", "the MACI public key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      const data = await isUserRegistered({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        signer,
      });

      if (data.isRegistered) {
        logGreen(cmdObj.quiet, success(`State index: ${data.stateIndex?.toString()}`));
      } else {
        logRed(cmdObj.quiet, "User is not registered");
      }
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("isJoinedUser")
  .description("Checks if user is joined to the poll with public key")
  .requiredOption("-p, --pubkey <pubkey>", "the MACI public key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("--start-block <startBlock>", "the block number to start looking for events from", parseInt)
  .option("--end-block <endBlock>", "the block number to end looking for events from", parseInt)
  .option("--blocks-per-batch <blockPerBatch>", "the number of blocks to process per batch", parseInt)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      const data = await isJoinedUser({
        pollPubKey: cmdObj.pubkey,
        startBlock: cmdObj.startBlock!,
        maciAddress,
        pollId: cmdObj.pollId,
        signer,
        quiet: cmdObj.quiet,
      });

      if (data.isJoined) {
        logGreen(
          cmdObj.quiet,
          success(
            [
              `Poll state index: ${data.pollStateIndex?.toString()}, registered: ${data.isJoined}`,
              `Voice credits: ${data.voiceCredits?.toString()}`,
            ].join("\n"),
          ),
        );
      } else {
        logRed(cmdObj.quiet, "User has not joined the poll");
      }
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });

program
  .command("getPoll")
  .description("Get deployed poll from MACI contract")
  .option("-p, --poll <poll>", "the poll id")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      const details = await getPoll({
        pollId: cmdObj.poll,
        maciAddress,
        signer,
      });

      logGreen(
        true,
        success(
          [
            `ID: ${details.id}`,
            `Deploy time: ${new Date(Number(details.deployTime) * 1000).toString()}`,
            `End time: ${new Date(Number(details.deployTime) + Number(details.duration) * 1000).toString()}`,
            `Number of signups ${details.numSignups}`,
            `State tree merged: ${details.isMerged}`,
            `Mode: ${details.mode === 0n ? "Quadratic Voting" : "Non-Quadratic Voting"}`,
          ].join("\n"),
        ),
      );
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("fundWallet")
  .description("Fund a wallet with Ether")
  .requiredOption("-a, --amount <amount>", "the amount of Ether", parseInt)
  .requiredOption("-w, --address <address>", "the address to fund")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await fundWallet({ amount: cmdObj.amount, address: cmdObj.address, quiet: cmdObj.quiet, signer });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("verify")
  .description("verify the results of a poll")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .requiredOption(
    "-t, --tally-file <tallyFile>",
    "the tally file with results, per vote option spent credits, spent voice credits total",
  )
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      banner(cmdObj.quiet);
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      // read the tally file
      const isTallyFileExists = fs.existsSync(cmdObj.tallyFile);
      if (!cmdObj.tallyFile || !isTallyFileExists) {
        logError(`Unable to open ${cmdObj.tallyFile}`);
      }

      const tallyData = JSON.parse(await fs.promises.readFile(cmdObj.tallyFile, { encoding: "utf8" })) as TallyData;

      const maciAddress = tallyData.maci || cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      const pollParams = await getPollParams({ pollId: cmdObj.pollId, maciContractAddress: maciAddress, signer });
      const tallyCommitments = generateTallyCommitments({
        tallyData,
        voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
      });

      await verify({
        tallyData,
        pollId: cmdObj.pollId,
        maciAddress,
        signer,
        tallyCommitments,
        numVoteOptions: pollParams.numVoteOptions,
        voteOptionTreeDepth: pollParams.voteOptionTreeDepth,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("genProofs")
  .description("generate the proofs for a poll")
  .option("-k, --privkey <privkey>", "your serialized MACI private key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .requiredOption(
    "-t, --tally-file <tallyFile>",
    "the tally file with results, per vote option spent credits, spent voice credits total",
  )
  .option("-r, --rapidsnark <rapidsnark>", "the path to the rapidsnark binary")
  .option("-g, --process-witnessgen <processWitnessgen>", "the path to the process witness generation binary")
  .option("--process-witnessdat <processWitnessdat>", "the path to the process witness dat file")
  .option("--tally-witnessgen <tallyWitnessgen>", "the path to the tally witness generation binary")
  .option("--tally-witnessdat <tallyWitnessdat>", "the path to the tally witness dat file")
  .requiredOption("--poll-joining-zkey <processJoinZkey>", "the path to the poll join zkey")
  .requiredOption("--process-zkey <processZkey>", "the path to the process zkey")
  .requiredOption("--tally-zkey <tallyZkey>", "the path to the tally zkey")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-p, --rpc-provider <provider>", "the rpc provider URL")
  .requiredOption("-f, --output <outputDir>", "the output directory for proofs")
  .option("--transaction-hash <transactionHash>", "transaction hash of MACI contract creation")
  .option("-w, --wasm", "whether to use the wasm binaries")
  .option("--process-wasm <processWasm>", "the path to the process witness generation wasm binary")
  .option("--tally-wasm <tallyWasm>", "the path to the tally witness generation wasm binary")
  .option("--state-file <stateFile>", "the path to the state file containing the serialized maci state")
  .option("--start-block <startBlock>", "the block number to start looking for events from", parseInt)
  .option("--end-block <endBlock>", "the block number to end looking for events from", parseInt)
  .option("--blocks-per-batch <blockPerBatch>", "the number of blocks to process per batch", parseInt)
  .option(
    "-u, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await genProofs({
        outputDir: cmdObj.output,
        tallyFile: cmdObj.tallyFile,
        tallyZkey: cmdObj.tallyZkey,
        processZkey: cmdObj.processZkey,
        pollId: cmdObj.pollId,
        rapidsnark: cmdObj.rapidsnark,
        processWitgen: cmdObj.processWitnessgen,
        processDatFile: cmdObj.processWitnessdat,
        tallyWitgen: cmdObj.tallyWitnessgen,
        tallyDatFile: cmdObj.tallyWitnessdat,
        coordinatorPrivKey: cmdObj.privkey,
        maciAddress: cmdObj.maciAddress,
        transactionHash: cmdObj.transactionHash,
        processWasm: cmdObj.processWasm,
        tallyWasm: cmdObj.tallyWasm,
        useWasm: cmdObj.wasm,
        stateFile: cmdObj.stateFile,
        startBlock: cmdObj.startBlock,
        endBlock: cmdObj.endBlock,
        blocksPerBatch: cmdObj.blocksPerBatch,
        useQuadraticVoting: cmdObj.useQuadraticVoting,
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("genLocalState")
  .description("generate a local MACI state from the smart contracts events")
  .requiredOption("-o, --output <outputPath>", "the path where to write the state")
  .requiredOption("-p, --poll-id <pollId>", "the id of the poll", BigInt)
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-k, --privkey <privkey>", "your serialized MACI private key")
  .option("--start-block <startBlock>", "the start block number", parseInt)
  .option("--end-block <endBlock>", "the end block number", parseInt)
  .option("--blocks-per-batch <blockPerBatch>", "the blocks per batch", parseInt)
  .option("--transaction-hash <transactionHash>", "the transaction hash")
  .option("-s, --sleep <sleep>", "the sleep time between batches", parseInt)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await genLocalState({
        outputPath: cmdObj.output.toString(),
        pollId: cmdObj.pollId,
        maciAddress: cmdObj.maciAddress,
        coordinatorPrivateKey: cmdObj.privkey,
        ethereumProvider: cmdObj.rpcProvider,
        endBlock: cmdObj.endBlock,
        startBlock: cmdObj.startBlock,
        blockPerBatch: cmdObj.blocksPerBatch,
        transactionHash: cmdObj.transactionHash,
        sleep: cmdObj.sleep,
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("proveOnChain")
  .description("prove the results of a poll on chain")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .option(
    "-t, --tally-file <tallyFile>",
    "the tally file with results, per vote option spent credits, spent voice credits total",
  )
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-f, --proof-dir <proofDir>", "the proof output directory from the genProofs subcommand")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await proveOnChain({
        pollId: cmdObj.pollId,
        tallyFile: cmdObj.tallyFile,
        proofDir: cmdObj.proofDir,
        maciAddress: cmdObj.maciAddress,
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });

if (require.main === module) {
  program.parseAsync(process.argv);
}

// export everything so we can use in other packages
export {
  checkVerifyingKeys,
  deploy,
  deployPoll,
  getPoll,
  deployVkRegistryContract,
  fundWallet,
  genLocalState,
  genKeyPair,
  genMaciPubKey,
  genProofs,
  mergeSignups,
  publish,
  publishBatch,
  proveOnChain,
  setVerifyingKeys,
  signup,
  isRegisteredUser,
  timeTravel,
  verify,
  joinPoll,
  isJoinedUser,
} from "./commands";

export type {
  DeployedContracts,
  PollContracts,
  TallyData,
  DeployPollArgs,
  GenLocalStateArgs,
  GenProofsArgs,
  PublishArgs,
  SignupArgs,
  MergeSignupsArgs,
  VerifyArgs,
  ProveOnChainArgs,
  DeployArgs,
  IRegisteredUserArgs,
  IGenKeypairArgs,
  IGetPollArgs,
  IGetPollData,
  IPublishBatchArgs,
  IPublishBatchData,
  IPublishMessage,
  ISignupData,
} from "./utils";
