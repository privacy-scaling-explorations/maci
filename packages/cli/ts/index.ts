#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";

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
  getPoll,
  mergeMessages,
  publish,
  setVerifyingKeys,
  mergeSignups,
  timeTravel,
  signup,
  isRegisteredUser,
  verify,
  genProofs,
  fundWallet,
  proveOnChain,
  checkVerifyingKeys,
  genLocalState,
  extractVkToFile,
} from "./commands";
import { TallyData, logError, promptSensitiveValue, readContractAddress } from "./utils";

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
  .option("-ph3, --poseidonT3Address <poseidonT3Address>", "PoseidonT3 contract address")
  .option("-ph4, --poseidonT4Address <poseidonT4Address>", "PoseidonT4 contract address")
  .option("-ph5, --poseidonT5Address <poseidonT5Address>", "PoseidonT5 contract address")
  .option("-ph6, --poseidonT6Address <poseidonT6Address>", "PoseidonT6 contract address")
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
    "-uq, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .option("-vk, --vk-contract <vkContract>", "the VkRegistry contract address")
  .requiredOption("-s, --state-tree-depth <stateTreeDepth>", "the state tree depth", parseInt)
  .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the intermediate state tree depth", parseInt)
  .requiredOption("-m, --msg-tree-depth <messageTreeDepth>", "the message tree depth", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-b, --msg-batch-depth <messageBatchDepth>", "the message batch depth", parseInt)
  .requiredOption(
    "-p, --process-messages-zkey <processMessagesZkeyPath>",
    "the process messages zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "-t, --tally-votes-zkey <tallyVotesZkeyPath>",
    "the tally votes zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .action(async (cmdOptions) => {
    try {
      const signer = await getSigner();

      await checkVerifyingKeys({
        stateTreeDepth: cmdOptions.stateTreeDepth,
        intStateTreeDepth: cmdOptions.intStateTreeDepth,
        messageTreeDepth: cmdOptions.msgTreeDepth,
        voteOptionTreeDepth: cmdOptions.voteOptionTreeDepth,
        messageBatchDepth: cmdOptions.msgBatchDepth,
        processMessagesZkeyPath: cmdOptions.processMessagesZkey,
        tallyVotesZkeyPath: cmdOptions.tallyVotesZkey,
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
  .requiredOption("-sk, --privkey <privkey>", "the private key")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action((cmdObj) => {
    genMaciPubKey(cmdObj.privkey, cmdObj.quiet);
  });
program
  .command("genMaciKeyPair")
  .description("generate a new MACI key pair")
  .option("-sp, --seed <seed>", "seed value for keypair", (value) => (value ? BigInt(value) : undefined), undefined)
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
  .action((cmdObj) => {
    try {
      showContracts(cmdObj.quiet);
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("deployPoll")
  .description("deploy a new poll")
  .option("-vk, --vkRegistryAddress <vkRegistryAddress>", "the vk registry contract address")
  .requiredOption("-t, --duration <pollDuration>", "the poll duration", parseInt)
  .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the int state tree depth", parseInt)
  .requiredOption("-b, --msg-batch-depth <messageTreeSubDepth>", "the message tree sub depth", parseInt)
  .requiredOption("-m, --msg-tree-depth <messageTreeDepth>", "the message tree depth", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-pk, --pubkey <coordinatorPubkey>", "the coordinator public key")
  .option(
    "-uq, --use-quadratic-voting <useQuadraticVoting>",
    "whether to use quadratic voting",
    (value) => value === "true",
    true,
  )
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await deployPoll({
        pollDuration: cmdObj.duration,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        messageTreeSubDepth: cmdObj.msgBatchDepth,
        messageTreeDepth: cmdObj.msgTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        coordinatorPubkey: cmdObj.pubkey,
        maciAddress: cmdObj.maciAddress,
        vkRegistryAddress: cmdObj.vkRegistryAddress,
        quiet: cmdObj.quiet,
        useQuadraticVoting: cmdObj.useQuadraticVoting,
        signer,
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
  .requiredOption("-m, --msg-tree-depth <messageTreeDepth>", "the message tree depth", parseInt)
  .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth", parseInt)
  .requiredOption("-b, --msg-batch-depth <messageBatchDepth>", "the message batch depth", parseInt)
  .option(
    "-pqv, --process-messages-zkey-qv <processMessagesZkeyPathQv>",
    "the process messages qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "-tqv, --tally-votes-zkey-qv <tallyVotesZkeyPathQv>",
    "the tally votes qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "-pnqv, --process-messages-zkey-non-qv <processMessagesZkeyPathNonQv>",
    "the process messages non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "-tnqv, --tally-votes-zkey-non-qv <tallyVotesZkeyPathNonQv>",
    "the tally votes non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "-uq, --use-quadratic-voting <useQuadraticVoting>",
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
        messageTreeDepth: cmdObj.msgTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        messageBatchDepth: cmdObj.msgBatchDepth,
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
  .option("-sk, --privkey <privkey>", "your serialized MACI private key")
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
  .command("mergeMessages")
  .description("merge the message accumulator queue")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .option("-n, --num-queue-ops <numQueueOps>", "the number of queue operations", parseInt)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();

      await mergeMessages({
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
    "-pqv, --process-messages-zkey-qv <processMessagesZkeyPathQv>",
    "the process messages qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "-tqv, --tally-votes-zkey-qv <tallyVotesZkeyPathQv>",
    "the tally votes qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "-pnqv, --process-messages-zkey-non-qv <processMessagesZkeyPathNonQv>",
    "the process messages non-qv zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "-tnqv, --tally-votes-zkey-non-qv <tallyVotesZkeyPathNonQv>",
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
  .option("-i, --ivcp-data <ivcpData>", "the initial voice credit proxy data")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      await signup({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        sgDataArg: cmdObj.sgData,
        ivcpDataArg: cmdObj.ivcpData,
        quiet: cmdObj.quiet,
        signer,
      });
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

      await isRegisteredUser({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        signer,
        quiet: cmdObj.quiet,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("getPoll")
  .description("Get deployed poll from MACI contract")
  .option("-p, --poll <poll>", "the poll id")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const maciAddress = cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      await getPoll({
        pollId: cmdObj.poll,
        maciAddress,
        signer,
        quiet: cmdObj.quiet,
      });
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
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      // read the tally file
      const isTallyFileExists = fs.existsSync(cmdObj.tallyFile);
      if (!cmdObj.tallyFile || !isTallyFileExists) {
        logError(`Unable to open ${cmdObj.tallyFile}`);
      }

      const tallyData = JSON.parse(await fs.promises.readFile(cmdObj.tallyFile, { encoding: "utf8" })) as TallyData;

      const maciAddress = tallyData.maci || cmdObj.maciAddress || (await readContractAddress("MACI", network?.name));

      await verify({
        tallyData,
        pollId: cmdObj.pollId,
        maciAddress,
        quiet: cmdObj.quiet,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("genProofs")
  .description("generate the proofs for a poll")
  .option("-sk, --privkey <privkey>", "your serialized MACI private key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-o, --poll-id <pollId>", "the poll id", BigInt)
  .requiredOption(
    "-t, --tally-file <tallyFile>",
    "the tally file with results, per vote option spent credits, spent voice credits total",
  )
  .option("-r, --rapidsnark <rapidsnark>", "the path to the rapidsnark binary")
  .option("-wp, --process-witnessgen <processWitnessgen>", "the path to the process witness generation binary")
  .option("-pd, --process-witnessdat <processWitnessdat>", "the path to the process witness dat file")
  .option("-wt, --tally-witnessgen <tallyWitnessgen>", "the path to the tally witness generation binary")
  .option("-td, --tally-witnessdat <tallyWitnessdat>", "the path to the tally witness dat file")
  .requiredOption("-zp, --process-zkey <processZkey>", "the path to the process zkey")
  .requiredOption("-zt, --tally-zkey <tallyZkey>", "the path to the tally zkey")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-p, --rpc-provider <provider>", "the rpc provider URL")
  .requiredOption("-f, --output <outputDir>", "the output directory for proofs")
  .option("-tx, --transaction-hash <transactionHash>", "transaction hash of MACI contract creation")
  .option("-w, --wasm", "whether to use the wasm binaries")
  .option("-pw, --process-wasm <processWasm>", "the path to the process witness generation wasm binary")
  .option("-tw, --tally-wasm <tallyWasm>", "the path to the tally witness generation wasm binary")
  .option("-st, --state-file <stateFile>", "the path to the state file containing the serialized maci state")
  .option("-sb, --start-block <startBlock>", "the block number to start looking for events from", parseInt)
  .option("-eb, --end-block <endBlock>", "the block number to end looking for events from", parseInt)
  .option("-bb, --blocks-per-batch <blockPerBatch>", "the number of blocks to process per batch", parseInt)
  .option(
    "-uq, --use-quadratic-voting <useQuadraticVoting>",
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
  .option("-sk, --privkey <privkey>", "your serialized MACI private key")
  .option("-eb, --end-block <endBlock>", "the end block number", parseInt)
  .option("-sb, --start-block <startBlock>", "the start block number", parseInt)
  .option("-bb, --blocks-per-batch <blockPerBatch>", "the blocks per batch", parseInt)
  .option("-tx, --transaction-hash <transactionHash>", "the transaction hash")
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
  mergeMessages,
  mergeSignups,
  publish,
  publishBatch,
  proveOnChain,
  setVerifyingKeys,
  signup,
  isRegisteredUser,
  timeTravel,
  verify,
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
  MergeMessagesArgs,
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
