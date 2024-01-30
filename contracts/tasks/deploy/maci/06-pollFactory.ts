import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-poll-factory", "Deploy poll factory")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const pollFactoryContractAddress = storage.getAddress(EContracts.PollFactory, hre.network.name);

    if (incremental && pollFactoryContractAddress) {
      return;
    }

    const poseidonT3ContractAddress = storage.mustGetAddress(EContracts.PoseidonT3, hre.network.name);
    const poseidonT4ContractAddress = storage.mustGetAddress(EContracts.PoseidonT4, hre.network.name);
    const poseidonT5ContractAddress = storage.mustGetAddress(EContracts.PoseidonT5, hre.network.name);
    const poseidonT6ContractAddress = storage.mustGetAddress(EContracts.PoseidonT6, hre.network.name);

    const linkedPollFactoryContract = await deployment.linkPoseidonLibraries(
      EContracts.PollFactory,
      poseidonT3ContractAddress,
      poseidonT4ContractAddress,
      poseidonT5ContractAddress,
      poseidonT6ContractAddress,
      deployer,
    );

    const pollFactoryContract = await deployment.deployContractWithLinkedLibraries(linkedPollFactoryContract);

    await storage.register({
      id: EContracts.PollFactory,
      contract: pollFactoryContract,
      args: [],
      network: hre.network.name,
    });
  });
