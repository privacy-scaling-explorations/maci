#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { ZeroAddress, type Signer } from "ethers";
import { PubKey } from "maci-domainobjs";
import {
  generateTallyCommitments,
  getPollParams,
  verify,
  getSignedupUserData,
  signup,
  joinPoll,
  getJoinedUserData,
  getPoll,
  generateMaciPublicKey,
  generateKeypair,
  mergeSignups,
  checkVerifyingKeys,
  setVerifyingKeys,
  extractAllVks,
  EMode,
  extractVkToFile,
  generateMaciState,
  proveOnChain,
  publish,
  MACI__factory as MACIFactory,
  deployPoll,
  generateProofs,
  deployVkRegistryContract,
  timeTravel,
  fundWallet,
  info,
  success,
  logGreen,
  logRed,
  logYellow,
  ContractStorage,
  EContracts,
  getGatekeeperTrait,
  getGatekeeperContractNamesByTrait,
  type ITallyData,
  deployVerifier,
  deployMaci,
  deployFreeForAllSignUpGatekeeper,
  genEmptyBallotRoots,
} from "maci-sdk";

import fs from "fs";
import path from "path";

import "./cliInit";
import {
  DEFAULT_IVCP_DATA,
  DEFAULT_SG_DATA,
  banner,
  contractAddressesStorePath,
  promptSensitiveValue,
  readContractAddresses,
  readJSONFile,
  resetContractAddresses,
  storeContractAddresses,
} from "./utils";
import { DEFAULT_INITIAL_VOICE_CREDITS, DEFAULT_VOTE_OPTIONS } from "./utils/defaults";

// set the description version and name of the cli tool
const { description, version, name } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"),
) as { description: string; version: string; name: string };
const program = new Command();
program.name(name).description(description).version(version);

const getSigner = async (): Promise<Signer> => import("maci-sdk").then((m) => m.getDefaultSigner());

// add the commands
program
  .command("create")
  .description("deploy the contracts")
  .option("--poseidonT3Address <poseidonT3Address>", "PoseidonT3 contract address")
  .option("--poseidonT4Address <poseidonT4Address>", "PoseidonT4 contract address")
  .option("--poseidonT5Address <poseidonT5Address>", "PoseidonT5 contract address")
  .option("--poseidonT6Address <poseidonT6Address>", "PoseidonT6 contract address")
  .option("-g, --signupGatekeeperAddress <signupGatekeeperAddress>", "the signup gatekeeper contract address")
  .requiredOption(
    "--signupGatekeeperContractName <signupGatekeeperContractName>",
    "the signup gatekeeper contract name",
  )
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .requiredOption("-s, --stateTreeDepth <stateTreeDepth>", "the state tree depth", parseInt)
  .action(async (cmdOptions) => {
    try {
      const signer = await getSigner();

      banner(cmdOptions.quiet);

      const network = await signer.provider?.getNetwork();

      const [poseidonT3, poseidonT4, poseidonT5, poseidonT6] = readContractAddresses({
        contractNames: [EContracts.PoseidonT3, EContracts.PoseidonT4, EContracts.PoseidonT5, EContracts.PoseidonT6],
        network: network?.name,
      });

      let [signupGatekeeperContractAddress] = readContractAddresses({
        contractNames: [cmdOptions.signupGatekeeperContractName.toString() as EContracts],
        network: network?.name,
      });

      if (!signupGatekeeperContractAddress) {
        const contract = await deployFreeForAllSignUpGatekeeper(signer, true);
        signupGatekeeperContractAddress = await contract.getAddress();
      }

      // deploy a verifier contract
      const verifierContract = await deployVerifier(signer, true);

      const verifierContractAddress = await verifierContract.getAddress();

      // deploy MACI, PollFactory and poseidon
      const {
        maciContractAddress,
        pollFactoryContractAddress,
        tallyFactoryContractAddress,
        messageProcessorFactoryContractAddress,
        poseidonAddresses,
      } = await deployMaci({
        signupGatekeeperAddress: signupGatekeeperContractAddress,
        poseidonAddresses: {
          poseidonT3,
          poseidonT4,
          poseidonT5,
          poseidonT6,
        },
        signer,
        stateTreeDepth: cmdOptions.stateTreeDepth,
      });

      const emptyBallotRoots = genEmptyBallotRoots(cmdOptions.stateTreeDepth);

      // save to the JSON File
      await storeContractAddresses({
        data: {
          [cmdOptions.signupGatekeeperContractName]: { address: signupGatekeeperContractAddress, args: [] },
          [EContracts.Verifier]: { address: verifierContractAddress, args: [] },
          [EContracts.MACI]: {
            address: maciContractAddress,
            args: [
              pollFactoryContractAddress,
              messageProcessorFactoryContractAddress,
              tallyFactoryContractAddress,
              signupGatekeeperContractAddress,
              cmdOptions.stateTreeDepth,
              emptyBallotRoots.map((root) => root.toString()),
            ],
          },
          [EContracts.MessageProcessorFactory]: { address: messageProcessorFactoryContractAddress, args: [] },
          [EContracts.TallyFactory]: { address: tallyFactoryContractAddress, args: [] },
          [EContracts.PollFactory]: { address: pollFactoryContractAddress, args: [] },
          [EContracts.PoseidonT3]: { address: poseidonAddresses.poseidonT3, args: [] },
          [EContracts.PoseidonT4]: { address: poseidonAddresses.poseidonT4, args: [] },
          [EContracts.PoseidonT5]: { address: poseidonAddresses.poseidonT5, args: [] },
          [EContracts.PoseidonT6]: { address: poseidonAddresses.poseidonT6, args: [] },
        },
        signer,
      });

      logGreen({ quiet: cmdOptions.quiet, text: success(`MACI deployed at:  ${maciContractAddress}`) });
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
    "--poll-joining-zkey <pollJoiningZkey>",
    "the poll joining zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--poll-joined-zkey <pollJoinedZkey>",
    "the poll joined zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .action(async (cmdOptions) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();
      const [vkContractAddress] = readContractAddresses({
        contractNames: [EContracts.VkRegistry],
        network: network?.name,
        defaultAddresses: [cmdOptions.vkContract],
      });

      logYellow({ quiet: cmdOptions.quiet, text: info("Retrieving verifying keys from the contract...") });

      await checkVerifyingKeys({
        stateTreeDepth: cmdOptions.stateTreeDepth,
        intStateTreeDepth: cmdOptions.intStateTreeDepth,
        voteOptionTreeDepth: cmdOptions.voteOptionTreeDepth,
        messageBatchSize: cmdOptions.msgBatchSize,
        processMessagesZkeyPath: cmdOptions.processMessagesZkey,
        tallyVotesZkeyPath: cmdOptions.tallyVotesZkey,
        pollJoiningZkeyPath: cmdOptions.pollJoiningZkey,
        pollJoinedZkeyPath: cmdOptions.pollJoinedZkey,
        vkRegistry: vkContractAddress,
        useQuadraticVoting: cmdOptions.useQuadraticVoting,
        signer,
      });

      logGreen({ quiet: cmdOptions.quiet, text: success("Verifying keys match") });
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
    const publicKey = generateMaciPublicKey(cmdObj.privkey);
    logGreen({ quiet: cmdObj.quiet, text: success(`Public key: ${publicKey}`) });
  });
program
  .command("genMaciKeyPair")
  .description("generate a new MACI key pair")
  .option("-s, --seed <seed>", "seed value for keypair", (value) => (value ? BigInt(value) : undefined), undefined)
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .action((cmdObj) => {
    const { publicKey, privateKey } = generateKeypair({ seed: cmdObj.seed });
    logGreen({ quiet: cmdObj.quiet, text: success(`Public key: ${publicKey}`) });
    logGreen({ quiet: cmdObj.quiet, text: success(`Private key: ${privateKey}`) });
  });
program
  .command("deployVkRegistry")
  .description("deploy a new verification key registry contract")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .option("-r, --rpc-provider <provider>", "the rpc provider URL")
  .action(async (cmdObj) => {
    try {
      banner(cmdObj.quiet);

      const signer = await getSigner();
      // assume that the vkRegistry contract is the first one to be deployed
      const isContractAddressesStoreExists = fs.existsSync(contractAddressesStorePath);

      if (isContractAddressesStoreExists) {
        const network = await signer.provider?.getNetwork();
        resetContractAddresses(network?.name);
      }

      // deploy and store the address
      const vkRegistryAddress = await deployVkRegistryContract({ signer });
      await storeContractAddresses({
        data: { [EContracts.VkRegistry]: { address: vkRegistryAddress, args: [] } },
        signer,
      });

      logGreen({ quiet: cmdObj.quiet, text: success(`VkRegistry deployed at: ${vkRegistryAddress}`) });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("show")
  .description("show the deployed contract addresses")
  .action(async () => {
    try {
      banner(false);

      if (!fs.existsSync(contractAddressesStorePath)) {
        throw new Error("No contracts have been deployed yet");
      }

      const signer = await getSigner();
      const [address, network] = await Promise.all([signer.getAddress(), signer.provider?.getNetwork()]);

      const contractStorage = ContractStorage.getInstance();
      contractStorage.printContracts(address, network?.name ?? "hardhat");
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("deployPoll")
  .description("deploy a new poll")
  .option("-k, --vkRegistryAddress <vkRegistryAddress>", "the vk registry contract address")
  .requiredOption("-s, --start <pollStartDate>", "the poll start date", parseInt)
  .requiredOption("-e, --end <pollEndDate>", "the poll end date", parseInt)
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
  .option("-o, --vote-options <voteOptions>", "the number of vote options", parseInt)
  .option("--initial-voice-credits <initialVoiceCredits>", "the initial voice credits", parseInt)
  .option("--initial-voice-credits-proxy <initialVoiceCreditsProxy>", "the initial voice credits proxy address")
  .option("--signup-gatekeeper <signupGatekeeper>", "the signup gatekeeper contract address")
  .action(async (cmdObj) => {
    try {
      banner(cmdObj.quiet);

      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const [vkRegistryAddress, maciAddress, initialVoiceCreditProxyAddress, verifierContractAddress] =
        readContractAddresses({
          contractNames: [
            EContracts.VkRegistry,
            EContracts.MACI,
            EContracts.ConstantInitialVoiceCreditProxy,
            EContracts.Verifier,
          ],
          network: network?.name,
          defaultAddresses: [cmdObj.vkRegistryAddress, cmdObj.maciAddress, cmdObj.initialVoiceCreditsProxy],
        });

      const maciContract = MACIFactory.connect(maciAddress, signer);

      const nextPollId = await maciContract.nextPollId();

      const gatekeeperTrait = await getGatekeeperTrait({ maciAddress, signer });
      const gatekeeperContractName = getGatekeeperContractNamesByTrait(gatekeeperTrait);

      const [signupGatekeeperContractAddress] = readContractAddresses({
        contractNames: [gatekeeperContractName.toString() as EContracts],
        keys: [nextPollId.toString()],
        network: network?.name,
        defaultAddresses: [cmdObj.signupGatekeeper],
      });

      const {
        pollId,
        pollContractAddress,
        tallyContractAddress,
        messageProcessorContractAddress,
        initialVoiceCreditProxyContractAddress,
        gatekeeperContractAddress,
      } = await deployPoll({
        initialVoiceCredits: cmdObj.initialVoiceCredits || DEFAULT_INITIAL_VOICE_CREDITS,
        pollStartTimestamp: cmdObj.start,
        pollEndTimestamp: cmdObj.end,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        messageBatchSize: cmdObj.msgBatchSize,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        coordinatorPubKey: PubKey.deserialize(cmdObj.pubkey),
        maciAddress,
        vkRegistryContractAddress: vkRegistryAddress,
        relayers: cmdObj.relayers ?? [ZeroAddress],
        mode: cmdObj.useQuadraticVoting ? EMode.QV : EMode.NON_QV,
        signer,
        voteOptions: cmdObj.voteOptions ?? DEFAULT_VOTE_OPTIONS,
        verifierContractAddress,
        gatekeeperContractAddress: signupGatekeeperContractAddress,
        initialVoiceCreditProxyContractAddress: initialVoiceCreditProxyAddress,
      });

      logGreen({ quiet: cmdObj.quiet, text: success(`Poll ID: ${pollId}`) });
      logGreen({ quiet: cmdObj.quiet, text: success(`Poll contract address: ${pollContractAddress}`) });
      logGreen({ quiet: cmdObj.quiet, text: success(`Tally contract address: ${tallyContractAddress}`) });
      logGreen({
        quiet: cmdObj.quiet,
        text: success(`Message processor contract address: ${messageProcessorContractAddress}`),
      });
      logGreen({
        quiet: cmdObj.quiet,
        text: success(`Initial voice credit proxy contract address: ${initialVoiceCreditProxyContractAddress}`),
      });
      logGreen({
        quiet: cmdObj.quiet,
        text: success(`Signup gatekeeper contract address: ${gatekeeperContractAddress}`),
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
  .option("-s, --sg-data <sgData>", "the signup gatekeeper data")
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

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });
      const privateKey = cmdObj.privKey || (await promptSensitiveValue("Insert your MACI private key"));

      const data = await joinPoll({
        maciAddress,
        privateKey,
        stateIndex: cmdObj.stateIndex,
        stateFile: cmdObj.stateFile,
        pollId: cmdObj.pollId,
        signer,
        startBlock: cmdObj.startBlock,
        endBlock: cmdObj.endBlock,
        blocksPerBatch: cmdObj.blocksPerBatch,
        pollJoiningZkey: cmdObj.pollJoiningZkey,
        pollWasm: cmdObj.pollWasm,
        useWasm: cmdObj.wasm,
        rapidsnark: cmdObj.rapidsnark,
        pollWitgen: cmdObj.pollWitnessgen,
        sgDataArg: cmdObj.sgData ?? DEFAULT_SG_DATA,
        ivcpDataArg: cmdObj.ivcpData ?? DEFAULT_IVCP_DATA,
      });

      logGreen({ quiet: cmdObj.quiet, text: info(`User joined poll with nullifier: ${data.nullifier}`) });
      logGreen({ quiet: cmdObj.quiet, text: info(`User joined poll with state index: ${data.pollStateIndex}`) });
      logGreen({ quiet: cmdObj.quiet, text: info(`User joined poll with ${data.voiceCredits} voice credits`) });
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
    "--poll-joining-zkey <pollJoiningZkeyPath>",
    "the poll joining zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .option(
    "--poll-joined-zkey <pollJoinedZkeyPath>",
    "the poll joined zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
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
      const network = await signer.provider?.getNetwork();
      const [vkRegistryAddress] = readContractAddresses({
        contractNames: [EContracts.VkRegistry],
        network: network?.name,
        defaultAddresses: [cmdObj.vkRegistry],
      });

      const { pollJoiningVk, pollJoinedVk, processVk, tallyVk } = await extractAllVks({
        pollJoiningZkeyPath: cmdObj.pollJoiningZkey,
        pollJoinedZkeyPath: cmdObj.pollJoinedZkey,
        processMessagesZkeyPath: cmdObj.useQuadraticVoting
          ? cmdObj.processMessagesZkeyQv
          : cmdObj.processMessagesZkeyNonQv,
        tallyVotesZkeyPath: cmdObj.useQuadraticVoting ? cmdObj.tallyVotesZkeyQv : cmdObj.tallyVotesZkeyQv,
      });

      await setVerifyingKeys({
        stateTreeDepth: cmdObj.stateTreeDepth,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        messageBatchSize: cmdObj.msgBatchSize,
        pollJoiningVk: pollJoiningVk!,
        pollJoinedVk: pollJoinedVk!,
        processMessagesVk: processVk!,
        tallyVotesVk: tallyVk!,
        vkRegistryAddress,
        mode: cmdObj.useQuadraticVoting ? EMode.QV : EMode.NON_QV,
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

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });
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
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .requiredOption("-p, --poll-id <pollId>", "the poll id", BigInt)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const receipt = await mergeSignups({
        pollId: cmdObj.pollId,
        maciAddress,
        signer,
      });

      logGreen({ quiet: cmdObj.quiet, text: info(`Transaction hash: ${receipt.hash}`) });
      logGreen({
        quiet: cmdObj.quiet,
        text: success(`Executed mergeSignups(); gas used: ${receipt.gasUsed.toString()}`),
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
      banner(cmdObj.quiet);

      const signer = await getSigner();

      await timeTravel({ seconds: cmdObj.seconds, signer });

      logGreen({ quiet: cmdObj.quiet, text: success(`Fast-forwarded ${cmdObj.seconds} seconds`) });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("extractVkToFile")
  .description("extract vkey to json file")
  .requiredOption(
    "--poll-joining-zkey <pollJoiningZkey>",
    "the poll joining zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
  )
  .requiredOption(
    "--poll-joined-zkey <pollJoinedZkey>",
    "the poll joined zkey path (see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing)",
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
        pollJoinedZkeyPath: cmdObj.pollJoinedZkey,
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

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const data = await signup({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        sgData: cmdObj.sgData ?? DEFAULT_SG_DATA,
        signer,
      });

      logGreen({
        quiet: cmdObj.quiet,
        text: success(`State index: ${data.stateIndex.toString()}\n Transaction hash: ${data.transactionHash}`),
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });
program
  .command("isRegisteredUser")
  .description("Checks if user is registered with their public key and get their data")
  .requiredOption("-p, --pubkey <maciPubKey>", "the MACI public key")
  .option("-x, --maci-address <maciAddress>", "the MACI contract address")
  .option("-q, --quiet <quiet>", "whether to print values to the console", (value) => value === "true", false)
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const data = await getSignedupUserData({
        maciPubKey: cmdObj.pubkey,
        maciAddress,
        signer,
      });

      if (data.isRegistered) {
        logGreen({ quiet: cmdObj.quiet, text: success(`State index: ${data.stateIndex?.toString()}`) });
      } else {
        logRed({ quiet: cmdObj.quiet, text: "User is not registered" });
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

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const data = await getJoinedUserData({
        pollPubKey: cmdObj.pubkey,
        startBlock: cmdObj.startBlock!,
        maciAddress,
        pollId: cmdObj.pollId,
        signer,
      });

      if (data.isJoined) {
        logGreen({
          quiet: cmdObj.quiet,
          text: success(
            [
              `Poll state index: ${data.pollStateIndex?.toString()}, registered: ${data.isJoined}`,
              `Voice credits: ${data.voiceCredits?.toString()}`,
            ].join("\n"),
          ),
        });
      } else {
        logRed({ quiet: cmdObj.quiet, text: "User has not joined the poll" });
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

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const details = await getPoll({
        pollId: cmdObj.poll,
        maciAddress,
        signer,
      });

      logGreen({
        quiet: true,
        text: success(
          [
            `ID: ${details.id}`,
            `Start time: ${new Date(Number(details.startDate) * 1000).toString()}`,
            `End time: ${new Date(Number(details.endDate) * 1000).toString()}`,
            `Number of signups ${details.numSignups}`,
            `State tree merged: ${details.isMerged}`,
            `Mode: ${details.mode === 0n ? "Quadratic Voting" : "Non-Quadratic Voting"}`,
          ].join("\n"),
        ),
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
      banner(cmdObj.quiet);

      const signer = await getSigner();

      const hash = await fundWallet({ amount: cmdObj.amount, address: cmdObj.address, signer });

      logYellow({ quiet: cmdObj.quiet, text: info(`Transaction hash: ${hash}`) });
      logGreen({
        quiet: cmdObj.quiet,
        text: success(`Successfully funded ${cmdObj.address} with ${cmdObj.amount} wei`),
      });
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
        throw new Error(`Unable to open ${cmdObj.tallyFile}`);
      }

      const tallyData = await readJSONFile<ITallyData>(cmdObj.tallyFile);

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

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
  .option(
    "-b, --ipfs-message-backup-files <ipfsMessageBackupFiles>",
    "Backup files for ipfs messages (name format: ipfsHash1.json, ipfsHash2.json, ..., ipfsHashN.json)",
    (value: string | undefined) => value?.split(/\s*,\s*/),
  )
  .action(
    async ({
      quiet,
      maciAddress,
      pollId,
      ipfsMessageBackupFiles,
      stateFile,
      startBlock,
      endBlock,
      blocksPerBatch,
      privkey,
      transactionHash,
      output,
      tallyFile,
      tallyZkey,
      tallyWitnessgen,
      tallyWasm,
      processZkey,
      processWitnessgen,
      processWasm,
      useQuadraticVoting,
      tallyWitnessdat,
      processWitnessdat,
      wasm,
      rapidsnark,
    }) => {
      try {
        banner(quiet);
        const signer = await getSigner();
        const network = await signer.provider?.getNetwork();

        const [maciContractAddress] = readContractAddresses({
          contractNames: [EContracts.MACI],
          network: network?.name,
          defaultAddresses: [maciAddress],
        });

        const coordinatorPrivateKey = privkey || (await promptSensitiveValue("Insert your MACI private key"));

        await generateProofs({
          maciAddress: maciContractAddress,
          coordinatorPrivateKey,
          pollId: Number(pollId),
          ipfsMessageBackupFiles,
          stateFile: stateFile || "",
          transactionHash: transactionHash || "",
          startBlock,
          endBlock,
          blocksPerBatch,
          signer,
          outputDir: output,
          tallyFile,
          tallyZkey,
          tallyWitgen: tallyWitnessgen,
          tallyWasm,
          processZkey,
          processWitgen: processWitnessgen,
          processWasm,
          useQuadraticVoting,
          tallyDatFile: tallyWitnessdat,
          processDatFile: processWitnessdat,
          useWasm: wasm,
          rapidsnark,
        });
      } catch (error) {
        program.error((error as Error).message, { exitCode: 1 });
      }
    },
  );
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
  .option(
    "-b, --ipfs-message-backup-files <ipfsMessageBackupFiles>",
    "Backup files for ipfs messages (name format: ipfsHash1.json, ipfsHash2.json, ..., ipfsHashN.json)",
    (value: string | undefined) => value?.split(/\s*,\s*/),
  )
  .action(async (cmdObj) => {
    try {
      const signer = await getSigner();
      const network = await signer.provider?.getNetwork();

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      const coordinatorPrivateKey = cmdObj.privkey || (await promptSensitiveValue("Insert your MACI private key"));

      await generateMaciState({
        outputPath: cmdObj.output.toString(),
        pollId: cmdObj.pollId,
        maciAddress,
        coordinatorPrivateKey,
        provider: cmdObj.rpcProvider,
        endBlock: cmdObj.endBlock,
        startBlock: cmdObj.startBlock,
        blockPerBatch: cmdObj.blocksPerBatch,
        transactionHash: cmdObj.transactionHash,
        ipfsMessageBackupFiles: cmdObj.ipfsMessageBackupFiles,
        sleep: cmdObj.sleep,
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
      const network = await signer.provider?.getNetwork();

      const [maciAddress] = readContractAddresses({
        contractNames: [EContracts.MACI],
        network: network?.name,
        defaultAddresses: [cmdObj.maciAddress],
      });

      await proveOnChain({
        pollId: cmdObj.pollId,
        tallyFile: cmdObj.tallyFile,
        proofDir: cmdObj.proofDir,
        maciAddress,
        signer,
      });
    } catch (error) {
      program.error((error as Error).message, { exitCode: 1 });
    }
  });

if (require.main === module) {
  program.parseAsync(process.argv);
}
