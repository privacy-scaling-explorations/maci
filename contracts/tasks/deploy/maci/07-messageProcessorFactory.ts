import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-message-processor-factory", "Deploy message processor factory")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const messageProcessorFactoryContractAddress = storage.getAddress(
      EContracts.MessageProcessorFactory,
      hre.network.name,
    );

    if (incremental && messageProcessorFactoryContractAddress) {
      return;
    }

    const poseidonT3ContractAddress = storage.mustGetAddress(EContracts.PoseidonT3, hre.network.name);
    const poseidonT4ContractAddress = storage.mustGetAddress(EContracts.PoseidonT4, hre.network.name);
    const poseidonT5ContractAddress = storage.mustGetAddress(EContracts.PoseidonT5, hre.network.name);
    const poseidonT6ContractAddress = storage.mustGetAddress(EContracts.PoseidonT6, hre.network.name);

    const linkedMessageProcessorFactoryContract = await deployment.linkPoseidonLibraries(
      EContracts.MessageProcessorFactory,
      poseidonT3ContractAddress,
      poseidonT4ContractAddress,
      poseidonT5ContractAddress,
      poseidonT6ContractAddress,
      deployer,
    );

    const messageProcessorFactoryContract = await deployment.deployContractWithLinkedLibraries(
      linkedMessageProcessorFactoryContract,
    );

    await storage.register({
      id: EContracts.MessageProcessorFactory,
      contract: messageProcessorFactoryContract,
      args: [],
      network: hre.network.name,
    });
  });
