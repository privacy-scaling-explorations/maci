/* eslint-disable no-console */
import { ZeroAddress } from "ethers";
import { PubKey } from "maci-domainobjs";

import type { MACI, Poll, IBasePolicy } from "../../../typechain-types";

import { EMode } from "../../../ts/constants";
import { EDeploySteps } from "../../helpers/constants";
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

    const coordinatorPubkey = deployment.getDeployConfigField<string>(EContracts.Poll, "coordinatorPubkey");
    const pollStartTimestamp = deployment.getDeployConfigField<number>(EContracts.Poll, "pollStartDate");
    const pollEndTimestamp = deployment.getDeployConfigField<number>(EContracts.Poll, "pollEndDate");
    const intStateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "intStateTreeDepth");
    const messageBatchSize = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageBatchSize");
    const voteOptionTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "voteOptionTreeDepth");
    const relayers = deployment
      .getDeployConfigField<string | undefined>(EContracts.Poll, "relayers")
      ?.split(",")
      .map((value) => value.trim()) || [ZeroAddress];

    const useQuadraticVoting =
      deployment.getDeployConfigField<boolean | null>(EContracts.Poll, "useQuadraticVoting") ?? false;
    const unserializedKey = PubKey.deserialize(coordinatorPubkey);
    const mode = useQuadraticVoting ? EMode.QV : EMode.NON_QV;

    const policy =
      deployment.getDeployConfigField<EContracts | null>(EContracts.Poll, "policy") || EContracts.FreeForAllPolicy;
    const policyContractAddress = storage.mustGetAddress(policy, hre.network.name, `poll-${pollId}`);
    const initialVoiceCreditProxyContractAddress = storage.mustGetAddress(
      EContracts.ConstantInitialVoiceCreditProxy,
      hre.network.name,
    );

    const voteOptions = deployment.getDeployConfigField<number>(EContracts.Poll, "voteOptions");

    const receipt = await maciContract
      .deployPoll({
        startDate: pollStartTimestamp,
        endDate: pollEndTimestamp,
        treeDepths: {
          intStateTreeDepth,
          voteOptionTreeDepth,
        },
        messageBatchSize,
        coordinatorPubKey: unserializedKey.asContractParam(),
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
    const extContracts = await pollContract.extContracts();

    const policyContract = await deployment.getContract<IBasePolicy>({
      name: policy,
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

    // get the empty ballot root
    const emptyBallotRoot = await pollContract.emptyBallotRoot();

    await Promise.all([
      storage.register({
        id: EContracts.Poll,
        key: `poll-${pollId}`,
        contract: pollContract,
        args: [
          pollStartTimestamp,
          pollEndTimestamp,
          {
            intStateTreeDepth,
            voteOptionTreeDepth,
          },
          messageBatchSize,
          unserializedKey.asContractParam(),
          extContracts,
          emptyBallotRoot.toString(),
          policyContractAddress,
          initialVoiceCreditProxyContractAddress,
        ],
        network: hre.network.name,
      }),

      storage.register({
        id: EContracts.MessageProcessor,
        key: `poll-${pollId}`,
        contract: messageProcessorContract,
        args: [verifierContractAddress, vkRegistryContractAddress, pollContractAddress, mode],
        network: hre.network.name,
      }),

      storage.register({
        id: EContracts.Tally,
        key: `poll-${pollId}`,
        contract: tallyContract,
        args: [
          verifierContractAddress,
          vkRegistryContractAddress,
          pollContractAddress,
          messageProcessorContractAddress,
          mode,
        ],
        network: hre.network.name,
      }),
    ]);
  }),
);
