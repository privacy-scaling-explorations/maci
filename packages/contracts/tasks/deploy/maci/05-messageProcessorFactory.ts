import { EDeploySteps } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.MessageProcessorFactory, "Deploy message processor factory").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const messageProcessorFactoryContractAddress = storage.getAddress(
      EContracts.MessageProcessorFactory,
      hre.network.name,
    );

    if (incremental && messageProcessorFactoryContractAddress) {
      // eslint-disable-next-line no-console
      console.log(`Skipping deployment of the ${EContracts.MessageProcessorFactory} contract`);
      return;
    }

    const poseidonT3ContractAddress = storage.mustGetAddress(EContracts.PoseidonT3, hre.network.name);
    const poseidonT4ContractAddress = storage.mustGetAddress(EContracts.PoseidonT4, hre.network.name);
    const poseidonT5ContractAddress = storage.mustGetAddress(EContracts.PoseidonT5, hre.network.name);
    const poseidonT6ContractAddress = storage.mustGetAddress(EContracts.PoseidonT6, hre.network.name);

    const linkedMessageProcessorFactoryContract = await hre.ethers.getContractFactory(
      EContracts.MessageProcessorFactory,
      {
        signer: deployer,
        libraries: {
          PoseidonT3: poseidonT3ContractAddress,
          PoseidonT4: poseidonT4ContractAddress,
          PoseidonT5: poseidonT5ContractAddress,
          PoseidonT6: poseidonT6ContractAddress,
        },
      },
    );

    const messageProcessorFactoryContract = await deployment.deployContractWithLinkedLibraries({
      contractFactory: linkedMessageProcessorFactoryContract,
    });

    await storage.register({
      id: EContracts.MessageProcessorFactory,
      contract: messageProcessorFactoryContract,
      args: [],
      network: hre.network.name,
    });
  }),
);
