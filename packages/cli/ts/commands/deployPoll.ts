import {
  MACI__factory as MACIFactory,
  EMode,
  deployFreeForAllSignUpGatekeeper,
  deployConstantInitialVoiceCreditProxy,
} from "maci-contracts";
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
  DEFAULT_INITIAL_VOICE_CREDITS,
} from "../utils";

/**
 * Deploy a new Poll for the set of MACI's contracts already deployed
 * @param DeployPollArgs - The arguments for the deployPoll command
 * @returns The addresses of the deployed contracts
 */
export const deployPoll = async ({
  pollDuration,
  intStateTreeDepth,
  messageBatchSize,
  voteOptionTreeDepth,
  coordinatorPubkey,
  maciAddress,
  vkRegistryAddress,
  gatekeeperAddress,
  voiceCreditProxyAddress,
  initialVoiceCreditsBalance,
  relayers = [],
  signer,
  quiet = true,
  useQuadraticVoting = false,
}: DeployPollArgs): Promise<PollContracts> => {
  banner(quiet);

  const network = await signer.provider?.getNetwork();

  // check if we have a vkRegistry already deployed or passed as arg
  const vkRegistryContractAddress = await readContractAddress("VkRegistry", network?.name);
  if (!vkRegistryContractAddress && !vkRegistryAddress) {
    logError("Please provide a VkRegistry contract address");
  }

  const vkRegistry = vkRegistryAddress || vkRegistryContractAddress;

  const maciContractAddress = await readContractAddress("MACI", network?.name);
  if (!maciContractAddress && !maciAddress) {
    logError("Please provide a MACI contract address");
  }

  const maci = maciAddress || maciContractAddress;

  const maciContract = MACIFactory.connect(maci, signer);
  const pollId = await maciContract.nextPollId();

  // check if we have a signupGatekeeper already deployed or passed as arg
  let signupGatekeeperContractAddress =
    gatekeeperAddress || (await readContractAddress(`SignUpGatekeeper-${pollId.toString()}`, network?.name));

  if (!signupGatekeeperContractAddress) {
    const contract = await deployFreeForAllSignUpGatekeeper(signer, true);
    signupGatekeeperContractAddress = await contract.getAddress();
  }

  let initialVoiceCreditProxyAddress =
    voiceCreditProxyAddress || (await readContractAddress("VoiceCreditProxy", network?.name));
  if (!initialVoiceCreditProxyAddress) {
    const contract = await deployConstantInitialVoiceCreditProxy(
      initialVoiceCreditsBalance ?? DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );
    initialVoiceCreditProxyAddress = await contract.getAddress();
  }

  // required arg -> poll duration
  if (pollDuration <= 0) {
    logError("Duration cannot be <= 0");
  }

  // required arg -> int state tree depth
  if (intStateTreeDepth <= 0) {
    logError("Int state tree depth cannot be <= 0");
  }

  // required arg -> message tree depth
  if (messageBatchSize <= 0) {
    logError("Message batch size cannot be <= 0");
  }
  // required arg -> vote option tree depth
  if (voteOptionTreeDepth <= 0) {
    logError("Vote option tree depth cannot be <= 0");
  }

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
  const verifierContractAddress = await readContractAddress("Verifier", network?.name);

  // deploy the poll
  let pollAddr = "";
  let messageProcessorContractAddress = "";
  let tallyContractAddress = "";

  try {
    // deploy the poll contract via the maci contract
    const tx = await maciContract.deployPoll(
      {
        duration: pollDuration,
        treeDepths: {
          intStateTreeDepth,
          voteOptionTreeDepth,
        },
        messageBatchSize,
        coordinatorPubKey: unserializedKey.asContractParam(),
        verifier: verifierContractAddress,
        vkRegistry,
        mode: useQuadraticVoting ? EMode.QV : EMode.NON_QV,
        gatekeeper: signupGatekeeperContractAddress,
        initialVoiceCreditProxy: initialVoiceCreditProxyAddress,
        relayers,
      },
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
        _pollId: bigint;
      };
      name: string;
    };

    // we are trying to get the poll id from the event logs
    // if we do not find this log then we throw
    if (log.name !== "DeployPoll") {
      logError("Invalid event log");
    }

    // eslint-disable-next-line no-underscore-dangle
    const eventPollId = log.args._pollId;
    const pollContracts = await maciContract.getPoll(eventPollId);
    pollAddr = pollContracts.poll;
    messageProcessorContractAddress = pollContracts.messageProcessor;
    tallyContractAddress = pollContracts.tally;

    logGreen(quiet, info(`Poll ID: ${pollId.toString()}`));
    logGreen(quiet, info(`Poll contract: ${pollAddr}`));
    logGreen(quiet, info(`Message Processor contract: ${messageProcessorContractAddress}`));
    logGreen(quiet, info(`Tally contract: ${tallyContractAddress}`));

    // store the address
    await storeContractAddress(
      `SignUpGatekeeper-${eventPollId.toString()}`,
      signupGatekeeperContractAddress,
      network?.name,
    );
    await storeContractAddress(
      `MessageProcessor-${eventPollId.toString()}`,
      messageProcessorContractAddress,
      network?.name,
    );
    await storeContractAddress(`Tally-${eventPollId.toString()}`, tallyContractAddress, network?.name);
    await storeContractAddress(`Poll-${eventPollId.toString()}`, pollAddr, network?.name);
  } catch (error) {
    logError((error as Error).message);
  }

  // we return all of the addresses
  return {
    messageProcessor: messageProcessorContractAddress,
    tally: tallyContractAddress,
    poll: pollAddr,
    signupGatekeeper: signupGatekeeperContractAddress,
  };
};
