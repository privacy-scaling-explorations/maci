import { BaseContract } from "ethers";
import { type MACI, getDefaultSigner, parseArtifact } from "maci-contracts";
import { PubKey } from "maci-domainobjs";

import {
  banner,
  contractExists,
  readContractAddress,
  storeContractAddress,
  info,
  logError,
  logGreen,
  type DeployPollArgs,
  type PollContracts,
} from "../utils";

/**
 * Deploy a new Poll for the set of MACI's contracts already deployed
 * @param DeployPollArgs - The arguments for the deployPoll command
 * @returns The addresses of the deployed contracts
 */
export const deployPoll = async ({
  pollDuration,
  maxMessages,
  maxVoteOptions,
  intStateTreeDepth,
  messageTreeSubDepth,
  messageTreeDepth,
  voteOptionTreeDepth,
  coordinatorPubkey,
  subsidyEnabled,
  maciAddress,
  vkRegistryAddress,
  quiet = true,
}: DeployPollArgs): Promise<PollContracts> => {
  banner(quiet);

  // check if we have a vkRegistry already deployed or passed as arg
  const vkRegistryContractAddress = readContractAddress("VkRegistry");
  if (!vkRegistryContractAddress && !vkRegistryAddress) {
    logError("Please provide a VkRegistry contract address");
  }

  const vkRegistry = vkRegistryAddress || vkRegistryContractAddress;

  const maciContractAddress = readContractAddress("MACI");
  if (!maciContractAddress && !maciAddress) {
    logError("Please provide a MACI contract address");
  }

  const maci = maciAddress || maciContractAddress;

  // required arg -> poll duration
  if (pollDuration <= 0) {
    logError("Duration cannot be <= 0");
  }
  // require arg -> max messages
  if (maxMessages <= 0) {
    logError("Max messages cannot be <= 0");
  }
  // required arg -> max vote options
  if (maxVoteOptions <= 0) {
    logError("Max vote options cannot be <= 0");
  }

  // required arg -> int state tree depth
  if (intStateTreeDepth <= 0) {
    logError("Int state tree depth cannot be <= 0");
  }
  // required arg -> message tree sub depth
  if (messageTreeSubDepth <= 0) {
    logError("Message tree sub depth cannot be <= 0");
  }
  // required arg -> message tree depth
  if (messageTreeDepth <= 0) {
    logError("Message tree depth cannot be <= 0");
  }
  // required arg -> vote option tree depth
  if (voteOptionTreeDepth <= 0) {
    logError("Vote option tree depth cannot be <= 0");
  }

  const signer = await getDefaultSigner();

  // we check that the contract is deployed
  if (!(await contractExists(signer.provider!, maci))) {
    logError("MACI contract does not exist");
  }

  // we check that the coordinator's public key is valid
  if (!PubKey.isValidSerializedPubKey(coordinatorPubkey)) {
    logError("Invalid MACI public key");
  }

  const unserializedKey = PubKey.deserialize(coordinatorPubkey);

  // get the verifier contract
  const verifierContractAddress = readContractAddress("Verifier");

  const maciAbi = parseArtifact("MACI")[0];
  const maciContract = new BaseContract(maci, maciAbi, signer) as MACI;

  // deploy the poll
  let pollAddr = "";
  let messageProcessorContractAddress = "";
  let tallyContractAddress = "";
  let subsidyContractAddress;

  try {
    // deploy the poll contract via the maci contract
    const tx = await maciContract.deployPoll(
      pollDuration,
      { maxMessages, maxVoteOptions },
      {
        intStateTreeDepth,
        messageTreeSubDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
      },
      unserializedKey.asContractParam(),
      verifierContractAddress,
      vkRegistry,
      subsidyEnabled,
      { gasLimit: 10000000 },
    );

    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Deploy poll transaction is failed");
    }

    const iface = maciContract.interface;
    const receiptLog = receipt!.logs[receipt!.logs.length - 1];

    // parse DeployPoll log
    const log = iface.parseLog(receiptLog as unknown as { topics: string[]; data: string }) as unknown as {
      args: {
        _pollId: number;
        pollAddr: {
          poll: string;
          messageProcessor: string;
          tally: string;
          subsidy: string;
        };
      };
      name: string;
    };

    // we are trying to get the poll id from the event logs
    // if we do not find this log then we throw
    if (log.name !== "DeployPoll") {
      logError("Invalid event log");
    }

    // eslint-disable-next-line no-underscore-dangle
    const pollId = log.args._pollId;
    pollAddr = log.args.pollAddr.poll;
    messageProcessorContractAddress = log.args.pollAddr.messageProcessor;
    tallyContractAddress = log.args.pollAddr.tally;

    if (subsidyEnabled) {
      subsidyContractAddress = log.args.pollAddr.subsidy;
    }

    logGreen(quiet, info(`Poll ID: ${pollId.toString()}`));
    logGreen(quiet, info(`Poll contract: ${pollAddr}`));
    logGreen(quiet, info(`Message Processor contract: ${messageProcessorContractAddress}`));
    logGreen(quiet, info(`Tally contract: ${tallyContractAddress}`));
    if (subsidyEnabled && subsidyContractAddress) {
      logGreen(quiet, info(`Subsidy contract: ${subsidyContractAddress}`));
      storeContractAddress(`Subsidy-${pollId.toString()}`, subsidyContractAddress);
    }
    // store the addresss
    storeContractAddress(`MessageProcessor-${pollId.toString()}`, messageProcessorContractAddress);
    storeContractAddress(`Tally-${pollId.toString()}`, tallyContractAddress);
    storeContractAddress(`Poll-${pollId.toString()}`, pollAddr);
  } catch (error) {
    logError((error as Error).message);
  }

  // we return all of the addresses
  return {
    messageProcessor: messageProcessorContractAddress,
    tally: tallyContractAddress,
    subsidy: subsidyContractAddress,
    poll: pollAddr,
  };
};
