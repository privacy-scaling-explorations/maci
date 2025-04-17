/* eslint-disable no-console */
import { IVkObjectParams, PublicKey, VerifyingKey } from "@maci-protocol/domainobjs";
import { ZeroAddress } from "ethers";

import type { IVerifyingKeyStruct } from "../../../ts/types";
import type { MACI, Poll, IBasePolicy, PollFactory, VkRegistry } from "../../../typechain-types";

import { EMode } from "../../../ts/constants";
import { extractVk } from "../../../ts/proofs";
import { EDeploySteps, FULL_POLICY_NAMES } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.Poll, "Deploy poll").then((task) =>
  task.setAction(async (_, hre) => {
    deployment.setHre(hre);

    const maciContractAddress = storage.getAddress(EContracts.MACI, hre.network.name);
    const verifierContractAddress = storage.getAddress(EContracts.Verifier, hre.network.name);
    const vkRegistryContractAddress = storage.getAddress(EContracts.VkRegistry, hre.network.name);

    if (!maciContractAddress) {
      throw new Error("Need to deploy MACI contract first");
    }

    if (!verifierContractAddress) {
      throw new Error("Need to deploy Verifier contract first");
    }

    if (!vkRegistryContractAddress) {
      throw new Error("Need to deploy VkRegistry contract first");
    }

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });
    const pollId = await maciContract.nextPollId();

    const coordinatorPublicKey = deployment.getDeployConfigField<string>(EContracts.Poll, "coordinatorPublicKey");
    const pollStartTimestamp = deployment.getDeployConfigField<number>(EContracts.Poll, "pollStartDate");
    const pollEndTimestamp = deployment.getDeployConfigField<number>(EContracts.Poll, "pollEndDate");
    const intStateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "intStateTreeDepth");
    const messageBatchSize = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageBatchSize");
    const stateTreeDepth =
      deployment.getDeployConfigField<number>(EContracts.Poll, "stateTreeDepth") ||
      (await maciContract.stateTreeDepth());
    const voteOptionTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "voteOptionTreeDepth");
    const relayers = deployment
      .getDeployConfigField<string | undefined>(EContracts.Poll, "relayers")
      ?.split(",")
      .map((value) => value.trim()) || [ZeroAddress];

    const useQuadraticVoting =
      deployment.getDeployConfigField<boolean | null>(EContracts.Poll, "useQuadraticVoting") ?? false;
    const unserializedKey = PublicKey.deserialize(coordinatorPublicKey);
    const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;

    const policy =
      deployment.getDeployConfigField<EContracts | null>(EContracts.Poll, "policy") || EContracts.FreeForAllPolicy;
    const fullPolicyName = FULL_POLICY_NAMES[policy as keyof typeof FULL_POLICY_NAMES] as unknown as EContracts;
    const policyContractAddress = storage.mustGetAddress(fullPolicyName, hre.network.name, `poll-${pollId}`);
    const initialVoiceCreditProxyContractAddress = storage.mustGetAddress(
      EContracts.ConstantInitialVoiceCreditProxy,
      hre.network.name,
    );

    const voteOptions = deployment.getDeployConfigField<number>(EContracts.Poll, "voteOptions");

    const vkRegistryContract = await deployment.getContract<VkRegistry>({
      name: EContracts.VkRegistry,
      address: vkRegistryContractAddress,
    });

    const pollJoiningZkeyPath = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.pollJoiningZkey.zkey",
    );
    const pollJoinedZkeyPath = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.pollJoinedZkey.zkey",
    );

    const [pollJoiningVk, pollJoinedVk] = await Promise.all([
      pollJoiningZkeyPath && extractVk(pollJoiningZkeyPath),
      pollJoinedZkeyPath && extractVk(pollJoinedZkeyPath),
    ]).then((vks) => vks.map((vk: IVkObjectParams | "" | undefined) => vk && VerifyingKey.fromObj(vk)));

    if (!pollJoiningVk) {
      throw new Error("Poll joining zkey is not set");
    }

    if (!pollJoinedVk) {
      throw new Error("Poll joined zkey is not set");
    }

    const [pollJoiningVkSig, pollJoinedVkSig] = await Promise.all([
      vkRegistryContract.genPollJoiningVkSig(stateTreeDepth),
      vkRegistryContract.genPollJoinedVkSig(stateTreeDepth),
    ]);
    const [pollJoiningVkOnchain, pollJoinedVkOnchain] = await Promise.all([
      vkRegistryContract.getPollJoiningVkBySig(pollJoiningVkSig),
      vkRegistryContract.getPollJoinedVkBySig(pollJoinedVkSig),
    ]);

    const isPollJoiningVkSet = pollJoiningVk.equals(VerifyingKey.fromContract(pollJoiningVkOnchain));

    if (!isPollJoiningVkSet) {
      await vkRegistryContract
        .setPollJoiningVkKey(stateTreeDepth, pollJoiningVk.asContractParam() as IVerifyingKeyStruct)
        .then((tx) => tx.wait());
    }

    const isPollJoinedVkSet = pollJoinedVk.equals(VerifyingKey.fromContract(pollJoinedVkOnchain));

    if (!isPollJoinedVkSet) {
      await vkRegistryContract
        .setPollJoinedVkKey(stateTreeDepth, pollJoinedVk.asContractParam() as IVerifyingKeyStruct)
        .then((tx) => tx.wait());
    }

    const receipt = await maciContract
      .deployPoll({
        startDate: pollStartTimestamp,
        endDate: pollEndTimestamp,
        treeDepths: {
          intStateTreeDepth,
          voteOptionTreeDepth,
          stateTreeDepth,
        },
        messageBatchSize,
        coordinatorPublicKey: unserializedKey.asContractParam(),
        verifier: verifierContractAddress,
        vkRegistry: vkRegistryContractAddress,
        mode,
        policy: policyContractAddress,
        initialVoiceCreditProxy: initialVoiceCreditProxyContractAddress,
        relayers,
        voteOptions,
      })
      .then((tx) => tx.wait());

    if (receipt?.status !== 1) {
      throw new Error("Deploy poll transaction is failed");
    }

    const pollContracts = await maciContract.getPoll(pollId);
    const pollContractAddress = pollContracts.poll;
    const messageProcessorContractAddress = pollContracts.messageProcessor;
    const tallyContractAddress = pollContracts.tally;

    const pollContract = await deployment.getContract<Poll>({ name: EContracts.Poll, address: pollContractAddress });

    const policyContract = await deployment.getContract<IBasePolicy>({
      name: fullPolicyName,
      address: policyContractAddress,
    });

    await policyContract.setTarget(pollContractAddress).then((tx) => tx.wait());

    const messageProcessorContract = await deployment.getContract({
      name: EContracts.MessageProcessor,
      address: messageProcessorContractAddress,
    });

    const tallyContract = await deployment.getContract({
      name: EContracts.Tally,
      address: tallyContractAddress,
    });

    const [pollFactory, messageProcessorFactory, tallyFactory] = await Promise.all([
      deployment.getContract<PollFactory>({
        name: EContracts.PollFactory,
      }),
      deployment.getContract<PollFactory>({
        name: EContracts.MessageProcessorFactory,
      }),
      deployment.getContract<PollFactory>({
        name: EContracts.TallyFactory,
      }),
    ]);

    const [pollImplementation, messageProcessorImplementation, tallyImplementation] = await Promise.all([
      pollFactory.IMPLEMENTATION(),
      messageProcessorFactory.IMPLEMENTATION(),
      tallyFactory.IMPLEMENTATION(),
    ]);

    await Promise.all([
      storage.register({
        id: EContracts.Poll,
        key: `poll-${pollId}`,
        implementation: pollImplementation,
        contract: pollContract,
        args: [],
        network: hre.network.name,
      }),

      storage.register({
        id: EContracts.MessageProcessor,
        key: `poll-${pollId}`,
        implementation: messageProcessorImplementation,
        contract: messageProcessorContract,
        args: [],
        network: hre.network.name,
      }),

      storage.register({
        id: EContracts.Tally,
        key: `poll-${pollId}`,
        implementation: tallyImplementation,
        contract: tallyContract,
        args: [],
        network: hre.network.name,
      }),
    ]);
  }),
);
