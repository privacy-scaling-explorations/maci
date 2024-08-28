import { extractVk } from "maci-circuits";
import { type IVkObjectParams, VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct } from "../../../ts/types";
import type { VkRegistry } from "../../../typechain-types";

import { EMode } from "../../../ts/constants";
import { EDeploySteps } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, type IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.VkRegistry, "Deploy Vk Registry and set keys").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const vkRegistryContractAddress = storage.getAddress(EContracts.VkRegistry, hre.network.name);

    if (incremental && vkRegistryContractAddress) {
      // eslint-disable-next-line no-console
      console.log(`Skipping deployment of the ${EContracts.VkRegistry} contract`);
      return;
    }

    const stateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "stateTreeDepth");
    const intStateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "intStateTreeDepth");
    const messageTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageTreeDepth");
    const messageBatchDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageBatchDepth");
    const voteOptionTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "voteOptionTreeDepth");
    const processMessagesZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.qv.processMessagesZkey",
    );
    const processMessagesZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.nonQv.processMessagesZkey",
    );
    const tallyVotesZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.qv.tallyVotesZkey",
    );
    const tallyVotesZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "zkeys.nonQv.tallyVotesZkey",
    );
    const useQuadraticVoting =
      deployment.getDeployConfigField<boolean | null>(EContracts.Poll, "useQuadraticVoting") ?? false;

    if (useQuadraticVoting && (!tallyVotesZkeyPathQv || !processMessagesZkeyPathQv)) {
      throw new Error("QV zkeys are not set");
    }

    if (!useQuadraticVoting && (!tallyVotesZkeyPathNonQv || !processMessagesZkeyPathNonQv)) {
      throw new Error("Non-QV zkeys are not set");
    }

    const [qvProcessVk, qvTallyVk, nonQvProcessVk, nonQvTallyQv] = await Promise.all([
      processMessagesZkeyPathQv && extractVk(processMessagesZkeyPathQv),
      tallyVotesZkeyPathQv && extractVk(tallyVotesZkeyPathQv),
      processMessagesZkeyPathNonQv && extractVk(processMessagesZkeyPathNonQv),
      tallyVotesZkeyPathNonQv && extractVk(tallyVotesZkeyPathNonQv),
    ]).then((vks) =>
      vks.map(
        (vk: IVkObjectParams | "" | undefined) =>
          vk && (VerifyingKey.fromObj(vk).asContractParam() as IVerifyingKeyStruct),
      ),
    );

    const vkRegistryContract = await deployment.deployContract<VkRegistry>({
      name: EContracts.VkRegistry,
      signer: deployer,
    });

    const processZkeys = [qvProcessVk, nonQvProcessVk].filter(Boolean) as IVerifyingKeyStruct[];
    const tallyZkeys = [qvTallyVk, nonQvTallyQv].filter(Boolean) as IVerifyingKeyStruct[];
    const modes: EMode[] = [];

    if (qvProcessVk && qvTallyVk) {
      modes.push(EMode.QV);
    }

    if (nonQvProcessVk && nonQvTallyQv) {
      modes.push(EMode.NON_QV);
    }

    await vkRegistryContract
      .setVerifyingKeysBatch(
        stateTreeDepth,
        intStateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        5 ** messageBatchDepth,
        modes,
        processZkeys,
        tallyZkeys,
      )
      .then((tx) => tx.wait());

    await storage.register({
      id: EContracts.VkRegistry,
      contract: vkRegistryContract,
      args: [],
      network: hre.network.name,
    });
  }),
);
