import { extractVk } from "maci-circuits";
import { VerifyingKey } from "maci-domainobjs";

import type { IVerifyingKeyStruct } from "../../../ts/types";
import type { VkRegistry } from "../../../typechain-types";

import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, type IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-vk-registry", "Deploy Vk Registry and set keys")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const vkRegistryContractAddress = storage.getAddress(EContracts.VkRegistry, hre.network.name);

    if (incremental && vkRegistryContractAddress) {
      return;
    }

    const stateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "stateTreeDepth");
    const intStateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "intStateTreeDepth");
    const messageTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageTreeDepth");
    const messageBatchDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "messageBatchDepth");
    const voteOptionTreeDepth = deployment.getDeployConfigField<number>(EContracts.VkRegistry, "voteOptionTreeDepth");
    const processMessagesZkeyPath = deployment.getDeployConfigField<string>(
      EContracts.VkRegistry,
      "processMessagesZkey",
    );
    const tallyVotesZkeyPath = deployment.getDeployConfigField<string>(EContracts.VkRegistry, "tallyVotesZkey");

    const [processVk, tallyVk] = await Promise.all([
      extractVk(processMessagesZkeyPath),
      extractVk(tallyVotesZkeyPath),
    ]).then((vks) => vks.map((vk) => VerifyingKey.fromObj(vk)));

    const vkRegistryContract = await deployment.deployContract<VkRegistry>(EContracts.VkRegistry, deployer);

    await vkRegistryContract
      .setVerifyingKeys(
        stateTreeDepth,
        intStateTreeDepth,
        messageTreeDepth,
        voteOptionTreeDepth,
        5 ** messageBatchDepth,
        processVk.asContractParam() as IVerifyingKeyStruct,
        tallyVk.asContractParam() as IVerifyingKeyStruct,
      )
      .then((tx) => tx.wait());

    await storage.register({
      id: EContracts.VkRegistry,
      contract: vkRegistryContract,
      args: [],
      network: hre.network.name,
    });
  });
